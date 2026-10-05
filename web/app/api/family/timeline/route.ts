import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { resolveSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { decodeCursor, type CursorPosition } from "@/lib/db/cursor";
import { problemResponse } from "@/lib/http/problem-response";
import { toRfc3339Seconds } from "@/lib/http/rfc3339";
import { resolvePhotoUrl } from "@/lib/photos/resolve";

export const runtime = "nodejs";

const INSTANCE = "/api/family/timeline";
const SESSION_COOKIE = "__Host-session";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function unauthenticated(traceId: string): NextResponse {
  // 存在の有無・失効の理由は伝えない（3-7）。
  return problemResponse({
    status: 401,
    code: "unauthenticated",
    title: "Sign-in required",
    instance: INSTANCE,
    traceId,
  });
}

function malformedRequest(traceId: string, title: string): NextResponse {
  return problemResponse({
    status: 400,
    code: "malformed_request",
    title,
    instance: INSTANCE,
    traceId,
  });
}

function parseLimit(raw: string | null): number | null {
  if (raw === null) return DEFAULT_LIMIT;
  if (!/^\d+$/.test(raw)) return null;

  const limit = Number(raw);
  if (limit < 1 || limit > MAX_LIMIT) return null;

  return limit;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const traceId = randomUUID();

  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return unauthenticated(traceId);

  const session = await resolveSession(sessionId);
  if (!session) return unauthenticated(traceId);

  const subject = session.subject;
  if (subject.kind !== "family") {
    return problemResponse({
      status: 403,
      code: "forbidden",
      title: "This endpoint is for family members",
      instance: INSTANCE,
      traceId,
    });
  }

  if (subject.status !== "active") return unauthenticated(traceId);

  const searchParams = request.nextUrl.searchParams;

  const limit = parseLimit(searchParams.get("limit"));
  if (limit === null) {
    return malformedRequest(traceId, `limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  const rawCursor = searchParams.get("cursor");
  let cursor: CursorPosition | undefined;
  if (rawCursor !== null) {
    const decoded = decodeCursor(rawCursor);
    if (!decoded) return malformedRequest(traceId, "cursor is not a valid cursor");
    cursor = decoded;
  }

  // 2. データを取得する（stub かどうかは getDb() の内側の話）。
  //    紐づく入居者はセッションから解決した家族の情報から引く——クライアントは指定できない（NFR-41）。
  const page = await getDb().listTimelineForFamily({
    familyMemberId: subject.id,
    facilityId: subject.facilityId,
    limit,
    cursor,
  });

  // 3. 写真を URL に解決する（stub かどうかは resolvePhotoUrl() の内側の話）。
  return NextResponse.json({
    items: 
    page.items.map((post) => ({
      id: post.id,
      postedAt: toRfc3339Seconds(post.postedAt),
      text: post.text,
      photo: {
        url: resolvePhotoUrl(post.photo.ref),
        width: post.photo.width,
        height: post.photo.height,
      },
      resident: { name: post.resident.name },
    })),
    nextCursor: page.nextCursor,
  });
}
