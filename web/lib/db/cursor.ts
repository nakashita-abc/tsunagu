/**
 * 一覧のカーソル（06_API設計.md 0章：不透明な文字列）。
 * 時刻降順の一覧で「どこまで読んだか」を表すため、時刻と識別子の組を持つ
 * （同時刻の投稿が複数あっても位置が一意に決まるようにする）。
 */
export interface CursorPosition {
  postedAt: Date;
  id: string;
}

const SEPARATOR = "|";

export function encodeCursor({ postedAt, id }: CursorPosition): string {
  return Buffer.from(`${postedAt.toISOString()}${SEPARATOR}${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPosition | null {
  if (!cursor) return null;

  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const separatorAt = decoded.indexOf(SEPARATOR);
  if (separatorAt === -1) return null;

  const postedAt = new Date(decoded.slice(0, separatorAt));
  const id = decoded.slice(separatorAt + SEPARATOR.length);
  if (Number.isNaN(postedAt.getTime()) || id.length === 0) return null;

  return { postedAt, id };
}
