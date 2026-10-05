import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/family/timeline/route";
import { getDb } from "@/lib/db";
import type { AuthSubject } from "@/lib/db/types";

const ORIGIN = "http://localhost:3000";
const FACILITY_A = "018f2d6e-0000-7000-8000-0000000000f1";

const HANAKO: AuthSubject = {
  id: "018f2d6e-0000-7000-8000-000000000004",
  kind: "family",
  facilityId: FACILITY_A,
  status: "active",
};

const REVOKED_FAMILY: AuthSubject = { ...HANAKO, id: "018f2d6e-0000-7000-8000-000000000006", status: "revoked" };
const INVITED_FAMILY: AuthSubject = { ...HANAKO, id: "018f2d6e-0000-7000-8000-000000000005", status: "invited" };
const SAKURA_STAFF: AuthSubject = {
  id: "018f2d6e-0000-7000-8000-000000000002",
  kind: "staff",
  facilityId: FACILITY_A,
  status: "active",
};

async function sessionIdFor(subject: AuthSubject): Promise<string> {
  const session = await getDb().createSession(subject);
  return session.id;
}

function makeRequest(opts: { sessionId?: string; query?: string } = {}): NextRequest {
  const headers = new Headers();
  if (opts.sessionId !== undefined) {
    headers.set("cookie", `__Host-session=${opts.sessionId}`);
  }

  return new NextRequest(`${ORIGIN}/api/family/timeline${opts.query ?? ""}`, {
    method: "GET",
    headers,
  });
}

async function getAsHanako(query?: string) {
  return GET(makeRequest({ sessionId: await sessionIdFor(HANAKO), query }));
}

describe("GET /api/family/timeline", () => {
  it("セッションCookieが無いと 401 になる", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("unauthenticated");
  });

  it("知らないセッションIDは 401 になる", async () => {
    const res = await GET(makeRequest({ sessionId: "018f0000-0000-7000-8000-000000000000" }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("unauthenticated");
  });

  it("職員のセッションでは 403 になる（家族向けのエンドポイントである）", async () => {
    const res = await GET(makeRequest({ sessionId: await sessionIdFor(SAKURA_STAFF) }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("forbidden");
  });

  it("失効した家族は、セッションが残っていても 401 になる（FR-501・INV-11）", async () => {
    const res = await GET(makeRequest({ sessionId: await sessionIdFor(REVOKED_FAMILY) }));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("unauthenticated");
  });

  it("引き換え前（招待済み）の家族は 401 になる", async () => {
    const res = await GET(makeRequest({ sessionId: await sessionIdFor(INVITED_FAMILY) }));
    expect(res.status).toBe(401);
  });

  it("有効な家族のセッションでは、紐づく入居者の投稿が新しい順で返る", async () => {
    const res = await getAsHanako();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.items).toHaveLength(3);
    expect(json.nextCursor).toBeNull();

    const postedAt = json.items.map((item: { postedAt: string }) => item.postedAt);
    expect(postedAt).toEqual([
      "2026-09-20T04:31:00Z",
      "2026-09-19T08:50:00Z",
      "2026-09-18T01:40:00Z",
    ]);
  });

  it("1件の形は設計どおりで、余分なフィールドを含まない（06_API設計.md 2-4）", async () => {
    const res = await getAsHanako();
    const json = await res.json();

    expect(json.items[0]).toEqual({
      id: "018f7a00-0000-7000-8000-000000000001",
      postedAt: "2026-09-20T04:31:00Z",
      text: "お昼にお庭を散歩しました",
      photo: {
        url: "https://picsum.photos/200/300",
        width: 200,
        height: 300,
      },
      resident: { name: "田中 太郎" },
    });
  });

  it("写真は全件に付く（FR-101：写真1枚が必須）", async () => {
    const res = await getAsHanako();
    const json = await res.json();

    for (const item of json.items) {
      expect(item.photo).not.toBeNull();
      expect(typeof item.photo.url).toBe("string");
      expect(item.photo.url.length).toBeGreaterThan(0);
    }
  });

  it("別の入居者の投稿は含まれない（NFR-41）", async () => {
    const res = await getAsHanako();
    const json = await res.json();

    const residents = new Set(
      json.items.map((item: { resident: { name: string } }) => item.resident.name)
    );
    expect([...residents]).toEqual(["田中 太郎"]);
  });

  it("別施設の投稿・削除済みの投稿は含まれない", async () => {
    const res = await getAsHanako();
    const json = await res.json();

    const ids = json.items.map((item: { id: string }) => item.id);
    expect(ids).not.toContain("018f7a00-0000-7000-8000-000000000099");
    expect(ids).not.toContain("018f7a00-0000-7000-8000-000000000004");
  });

  it("limit で件数を絞ると nextCursor が返り、続きを取得できる", async () => {
    const first = await getAsHanako("?limit=2");
    expect(first.status).toBe(200);

    const firstJson = await first.json();
    expect(firstJson.items).toHaveLength(2);
    expect(typeof firstJson.nextCursor).toBe("string");

    const second = await getAsHanako(`?limit=2&cursor=${encodeURIComponent(firstJson.nextCursor)}`);
    const secondJson = await second.json();

    expect(secondJson.items).toHaveLength(1);
    expect(secondJson.nextCursor).toBeNull();
    expect(secondJson.items[0].id).toBe("018f7a00-0000-7000-8000-000000000003");

    const firstIds = firstJson.items.map((item: { id: string }) => item.id);
    expect(firstIds).not.toContain(secondJson.items[0].id);
  });

  it("壊れたカーソルは 400 になる", async () => {
    const res = await getAsHanako("?cursor=not-a-cursor");
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("malformed_request");
  });

  it("範囲外・数値でない limit は 400 になる（既定20・上限50）", async () => {
    for (const query of ["?limit=0", "?limit=51", "?limit=abc", "?limit=-1", "?limit=1.5"]) {
      const res = await getAsHanako(query);
      expect(res.status, query).toBe(400);
      expect((await res.json()).code, query).toBe("malformed_request");
    }
  });

  it("limit=50 は受け付ける（上限そのものは有効）", async () => {
    const res = await getAsHanako("?limit=50");
    expect(res.status).toBe(200);
  });
});
