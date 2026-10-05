import { getDb } from "@/lib/db";
import type { Session } from "@/lib/db/types";

/**
 * セッションIDから主体を解決する。有効でなければ null（存在しない／期限切れを区別しない）。
 *
 * 保管先が stub かどうかは `getDb()` の内部に閉じているため、呼び出し側は知らない。
 * 期限の判定は保管先に依存しない方針なのでここで行う。
 */
export async function resolveSession(
  sessionId: string,
  now: Date = new Date()
): Promise<Session | null> {
  if (!sessionId) return null;

  const session = await getDb().findSession(sessionId);
  if (!session) return null;
  if (session.expiresAt.getTime() <= now.getTime()) return null;

  return session;
}
