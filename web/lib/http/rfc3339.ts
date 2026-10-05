/** 日時は RFC 3339・UTC・秒精度で返す（06_API設計.md 0章）。 */
export function toRfc3339Seconds(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}
