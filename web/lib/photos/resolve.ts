import { getDbDriverName } from "@/lib/env";

/**
 * 写真の参照（`PhotoRef.ref`）を、ブラウザがそのまま使える URL に解決する。
 *
 * stub か本番かの判断はこの関数の内部に閉じる——呼び出し側（API・画面）は
 * 参照の中身も driver の種別も知らない。`getDb()` / `getAuthDriver()` と同じ方針。
 * 参照の形は driver に従うため、判断は DB_DRIVER に相乗りする
 * （stub のモックデータは完成形の URL を持ち、postgres は S3 の `object_key` を持つ）。
 */
export function resolvePhotoUrl(ref: string): string {
  if (getDbDriverName() === "stub") return ref;

  throw new Error(
    `S3 の署名付きURL生成は未実装です（DB_DRIVER=postgres）。object_key=${ref}`
  );
}
