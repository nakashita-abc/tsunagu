import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "@/lib/db/cursor";

describe("カーソル", () => {
  it("符号化した値を復号すると元の位置に戻る", () => {
    const postedAt = new Date("2026-09-12T04:31:00Z");
    const id = "0192f7a1-3c4e-7b2d-9f10-8a5c6e2b4d31";

    const decoded = decodeCursor(encodeCursor({ postedAt, id }));

    expect(decoded).not.toBeNull();
    expect(decoded!.postedAt.toISOString()).toBe(postedAt.toISOString());
    expect(decoded!.id).toBe(id);
  });

  it("不透明な文字列であり、中身がそのまま読めない", () => {
    const cursor = encodeCursor({
      postedAt: new Date("2026-09-12T04:31:00Z"),
      id: "0192f7a1-3c4e-7b2d-9f10-8a5c6e2b4d31",
    });

    expect(cursor).not.toContain("2026-09-12");
    expect(cursor).not.toContain("0192f7a1");
  });

  it("URL に載せられる文字だけで構成される", () => {
    const cursor = encodeCursor({
      postedAt: new Date("2026-09-12T04:31:00Z"),
      id: "0192f7a1-3c4e-7b2d-9f10-8a5c6e2b4d31",
    });

    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encodeURIComponent(cursor)).toBe(cursor);
  });

  it("壊れたカーソルは null になる（呼び出し側が 400 を返せる）", () => {
    expect(decodeCursor("")).toBeNull();
    expect(decodeCursor("not-a-cursor")).toBeNull();
    expect(decodeCursor(Buffer.from("日付でない|id").toString("base64url"))).toBeNull();
    expect(decodeCursor(Buffer.from("区切りがない").toString("base64url"))).toBeNull();
  });
});
