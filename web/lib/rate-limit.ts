/**
 * 固定ウィンドウのレート制限（インメモリ）。
 * 単一インスタンスでの運用を前提とする（NFR-46）。複数インスタンスに分散する場合は
 * 共有ストアへの置き換えが必要になるが、MVPの規模（月額コスト上限＝NFR-76）ではその構成を取らない。
 */
export interface RateLimiter {
  /** 許可されていれば null、超過していれば残り待ち時間（秒）を返す。 */
  check(key: string): number | null;
}

interface Window {
  count: number;
  resetAt: number;
}

export function createFixedWindowLimiter(opts: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const { limit, windowMs, now = Date.now } = opts;
  const windows = new Map<string, Window>();

  return {
    check(key: string): number | null {
      const t = now();
      const existing = windows.get(key);

      if (!existing || existing.resetAt <= t) {
        windows.set(key, { count: 1, resetAt: t + windowMs });
        return null;
      }

      if (existing.count < limit) {
        existing.count += 1;
        return null;
      }

      return Math.ceil((existing.resetAt - t) / 1000);
    },
  };
}

// POST /api/auth/session: 識別子ごと・IPごとに試行回数を制限する（07_API設計.md 3-12・NFR-46）。
export const signInRateLimiter = createFixedWindowLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000,
});
