import { randomUUID } from "node:crypto";

import { findStubEntryByEmail } from "@/lib/fixtures/stub-directory";

import type { AuthDriver, SignInOutcome } from "./types";

/**
 * Cognito を用意せずに認証の挙動を確認するためのドライバ。
 * 固定のモック名簿（STUB_DIRECTORY）と平文を突き合わせるだけであり、本番では使わない。
 */
export function createStubAuthDriver(): AuthDriver {
  return {
    async signIn(identifier: string, password: string): Promise<SignInOutcome> {
      const entry = findStubEntryByEmail(identifier);
      if (!entry || entry.password !== password) {
        return { kind: "invalid_credentials" };
      }

      if (entry.requiresInitialPassword) {
        return { kind: "challenge", challengeToken: randomUUID() };
      }

      return { kind: "authenticated" };
    },
  };
}
