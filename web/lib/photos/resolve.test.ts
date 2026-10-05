import { afterEach, describe, expect, it, vi } from "vitest";

import { resolvePhotoUrl } from "@/lib/photos/resolve";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("写真URLの解決", () => {
  it("stub では、モックデータが持つ URL をそのまま返す", () => {
    vi.stubEnv("DB_DRIVER", "stub");

    expect(resolvePhotoUrl("/stub-photos/garden.png")).toBe("/stub-photos/garden.png");
  });

  it("DB_DRIVER 未設定でも stub として扱う（既定値）", () => {
    vi.stubEnv("DB_DRIVER", undefined);

    expect(resolvePhotoUrl("/stub-photos/garden.png")).toBe("/stub-photos/garden.png");
  });

  it("postgres では S3 の object_key を URL に解決する（未実装のため明示的に失敗する）", () => {
    vi.stubEnv("DB_DRIVER", "postgres");

    expect(() => resolvePhotoUrl("facility-a/2026/09/0192f7a1.jpg")).toThrow(/S3/);
  });
});
