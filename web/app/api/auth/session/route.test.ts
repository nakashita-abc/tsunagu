import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/session/route";

const ORIGIN = "http://localhost:3000";

function makeRequest(
  body: unknown,
  opts: { origin?: string | null; ip?: string } = {}
): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  const originValue = opts.origin === undefined ? ORIGIN : opts.origin;
  if (originValue !== null) headers.set("origin", originValue);
  if (opts.ip) headers.set("x-forwarded-for", opts.ip);

  return new NextRequest(`${ORIGIN}/api/auth/session`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/auth/session", () => {
  it("Origin ヘッダが無いと 403 になる", async () => {
    const res = await POST(makeRequest({ identifier: "a@example.test", password: "x" }, { origin: null }));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("origin_invalid");
  });

  it("Origin ヘッダが自サイトと異なると 403 になる", async () => {
    const res = await POST(
      makeRequest({ identifier: "a@example.test", password: "x" }, { origin: "https://evil.example" })
    );
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("origin_invalid");
  });

  it("本文が JSON でないと 400 になる", async () => {
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("malformed_request");
  });

  it("未知のフィールドを含むと 400 になる", async () => {
    const res = await POST(
      makeRequest({ identifier: "a@example.test", password: "x", extra: "y" })
    );
    expect(res.status).toBe(400);
  });

  it("password が欠けていると 400 になる", async () => {
    const res = await POST(makeRequest({ identifier: "a@example.test" }));
    expect(res.status).toBe(400);
  });

  it("正しい資格情報でサインインすると 200 とセッションCookieが返る", async () => {
    const res = await POST(
      makeRequest({ identifier: "sakura@example.test", password: "correct-horse-battery-staple" })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ subject: "staff" });

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("__Host-session=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=lax");
  });

  it("パスワードが誤っていると 401 credentials_invalid になり、Cookie は発行されない", async () => {
    const res = await POST(
      makeRequest({ identifier: "sakura@example.test", password: "wrong-password" })
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("credentials_invalid");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("失効済みの職員は正しい資格情報でも 401 credentials_invalid になる（INV-7）", async () => {
    const res = await POST(
      makeRequest({
        identifier: "revoked-staff@example.test",
        password: "correct-horse-battery-staple",
      })
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("credentials_invalid");
  });

  it("招待直後の家族は仮パスワードで 200・next=initial_password になり、Cookie は発行されない", async () => {
    const res = await POST(
      makeRequest({
        identifier: "taro-invited@example.test",
        password: "temporary-password-from-invitation",
      })
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.subject).toBe("family");
    expect(json.next).toBe("initial_password");
    expect(typeof json.challengeToken).toBe("string");
    expect(json.challengeToken.length).toBeGreaterThan(0);

    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("自律的な入居者本人は subject=resident でサインインできる（ADR-049）", async () => {
    const res = await POST(
      makeRequest({
        identifier: "resident-yamada@example.test",
        password: "correct-horse-battery-staple",
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ subject: "resident" });
    expect(res.headers.get("set-cookie")).toContain("__Host-session=");
  });

  it("招待直後の入居者本人も next=initial_password になる（FR-702）", async () => {
    const res = await POST(
      makeRequest({
        identifier: "resident-invited@example.test",
        password: "temporary-password-from-invitation",
      })
    );
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.subject).toBe("resident");
    expect(json.next).toBe("initial_password");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("存在しない識別子は 401 credentials_invalid になる（存在の有無を伝えない）", async () => {
    const res = await POST(
      makeRequest({ identifier: "nobody@example.test", password: "whatever" })
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("credentials_invalid");
  });

  it("同一の識別子・IPからの試行が続くと 429 rate_limited になる", async () => {
    const identifier = "rate-limit-test@example.test";
    const ip = "203.0.113.1";

    let lastRes;
    for (let i = 0; i < 11; i++) {
      lastRes = await POST(makeRequest({ identifier, password: "whatever" }, { ip }));
    }

    expect(lastRes!.status).toBe(429);
    const json = await lastRes!.json();
    expect(json.code).toBe("rate_limited");
    expect(lastRes!.headers.get("retry-after")).not.toBeNull();
  });
});
