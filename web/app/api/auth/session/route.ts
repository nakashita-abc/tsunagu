import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { problemResponse } from "@/lib/http/problem-response";
import { signInRateLimiter } from "@/lib/rate-limit";
import { getAuthDriver } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const INSTANCE = "/api/auth/session";
const SESSION_COOKIE = "__Host-session";

interface SignInBody {
  identifier: string;
  password: string;
}

function parseBody(raw: unknown): SignInBody | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;

  const keys = Object.keys(raw as Record<string, unknown>);
  const allowed = new Set(["identifier", "password"]);
  if (keys.some((k) => !allowed.has(k))) return null;

  const { identifier, password } = raw as Record<string, unknown>;
  if (typeof identifier !== "string" || typeof password !== "string") return null;
  if (identifier.length === 0 || password.length === 0) return null;
  // 厳密なメール形式の検証は行わない（Cognito 側が真実であり、ここでの判定は形の粗いふるいでよい）。
  if (!identifier.includes("@")) return null;

  return { identifier, password };
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  return origin === request.nextUrl.origin;
}

function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

function credentialsInvalid(traceId: string): NextResponse {
  return problemResponse({
    status: 401,
    code: "credentials_invalid",
    title: "Identifier or password is incorrect",
    instance: INSTANCE,
    traceId,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const traceId = randomUUID();

  // 3-4: 状態を変えるメソッドは Origin ヘッダを検証する（自サイト以外・欠落は 403）。
  if (!isSameOrigin(request)) {
    return problemResponse({
      status: 403,
      code: "origin_invalid",
      title: "Origin header missing or does not match this site",
      instance: INSTANCE,
      traceId,
    });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return problemResponse({
      status: 400,
      code: "malformed_request",
      title: "Request body must be valid JSON",
      instance: INSTANCE,
      traceId,
    });
  }

  const body = parseBody(rawBody);
  if (!body) {
    return problemResponse({
      status: 400,
      code: "malformed_request",
      title: "identifier and password are required; unknown fields are rejected",
      instance: INSTANCE,
      traceId,
    });
  }
  const { identifier, password } = body;

  // 3-12: 識別子ごと・IPごとに試行回数を制限する（NFR-46）。
  const rateLimitKey = `${clientIp(request)}:${identifier.toLowerCase()}`;
  const retryAfter = signInRateLimiter.check(rateLimitKey);
  if (retryAfter !== null) {
    return problemResponse({
      status: 429,
      code: "rate_limited",
      title: "Too many sign-in attempts",
      instance: INSTANCE,
      traceId,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const outcome = await getAuthDriver().signIn(identifier, password);

  if (outcome.kind === "rate_limited") {
    return problemResponse({
      status: 429,
      code: "rate_limited",
      title: "Too many sign-in attempts",
      instance: INSTANCE,
      traceId,
      headers: { "Retry-After": String(outcome.retryAfterSeconds) },
    });
  }

  if (outcome.kind === "invalid_credentials") {
    return credentialsInvalid(traceId);
  }

  // authenticated / challenge のいずれも、主体の種別・在籍状態は DB 側が真実である（Q5・INV-7）。
  const db = getDb();
  const subject = await db.findAuthSubjectByEmail(identifier);

  if (outcome.kind === "challenge") {
    // 招待済みで引き換え前の主体だけがチャレンジに進める（`status='invited'` ＝ cognito_sub は未記録）。
    // 名簿側が整合しない状態は認めない（3-7：存在の有無も伝えない）。
    if (!subject || subject.status !== "invited") {
      return credentialsInvalid(traceId);
    }

    return NextResponse.json(
      { subject: subject.kind, next: "initial_password", challengeToken: outcome.challengeToken },
      { status: 200 }
    );
  }

  // outcome.kind === "authenticated"
  if (!subject || subject.status !== "active") {
    return credentialsInvalid(traceId);
  }

  const session = await db.createSession(subject);

  const response = NextResponse.json({ subject: subject.kind }, { status: 200 });
  response.cookies.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
  return response;
}
