import { describe, expect, it } from "vitest";

import { resolveSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import type { AuthSubject } from "@/lib/db/types";

const FAMILY: AuthSubject = {
  id: "018f2d6e-0000-7000-8000-000000000004",
  kind: "family",
  facilityId: "018f2d6e-0000-7000-8000-0000000000f1",
  status: "active",
};

describe("セッションの解決", () => {
  it("発行済みのセッションIDから主体を解決できる", async () => {
    const session = await getDb().createSession(FAMILY);

    const resolved = await resolveSession(session.id);

    expect(resolved).not.toBeNull();
    expect(resolved!.subject).toEqual(FAMILY);
  });

  it("知らないセッションIDは null になる", async () => {
    expect(await resolveSession("018f0000-0000-7000-8000-000000000000")).toBeNull();
  });

  it("空のセッションIDは null になる", async () => {
    expect(await resolveSession("")).toBeNull();
  });

  it("期限を過ぎたセッションは null になる（ADR-032：使われなければ自然に切れる）", async () => {
    const session = await getDb().createSession(FAMILY);
    const afterExpiry = new Date(session.expiresAt.getTime() + 1);

    expect(await resolveSession(session.id, afterExpiry)).toBeNull();
  });
});
