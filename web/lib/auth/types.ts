/**
 * サインインの結果。資格情報の正否は認証基盤（本番は Cognito）が真実であり、
 * 主体の種別・在籍状態は DB 側が真実である（Q5・INV-7）。
 */
export type SignInOutcome =
  | { kind: "authenticated" }
  /** 招待直後の仮パスワード。初期パスワード設定に進む（NEW_PASSWORD_REQUIRED）。 */
  | { kind: "challenge"; challengeToken: string }
  | { kind: "invalid_credentials" }
  | { kind: "rate_limited"; retryAfterSeconds: number };

export interface AuthDriver {
  signIn(identifier: string, password: string): Promise<SignInOutcome>;
}
