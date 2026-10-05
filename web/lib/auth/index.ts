import { getAuthDriverName } from "@/lib/env";

import { createStubAuthDriver } from "./stub";
import type { AuthDriver } from "./types";

/**
 * 認証の入口。stub か本番かの判断はここに閉じ込める——
 * 呼び出し側（API）は driver の種別を知らない。
 */
export function getAuthDriver(): AuthDriver {
  if (getAuthDriverName() === "stub") return createStubAuthDriver();

  throw new Error(
    "AUTH_DRIVER=cognito は未実装です（User Pool の用意と InitiateAuth の実装が必要）。AUTH_DRIVER=stub で起動してください。"
  );
}
