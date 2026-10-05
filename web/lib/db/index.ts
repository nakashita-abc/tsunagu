import { getDbDriverName } from "@/lib/env";

import { createStubDb } from "./stub";
import type { Db } from "./types";


export function getDb(): Db {
  if (getDbDriverName() === "stub") return createStubDb();

  throw new Error(
    "DB_DRIVER=postgres は未実装です（スキーマの適用とクエリの実装が必要）。DB_DRIVER=stub で起動してください。"
  );
}
