export type AuthDriverName = "stub" | "cognito";
export type DbDriverName = "stub" | "postgres";

function readDriver<T extends string>(
  name: string,
  allowed: readonly T[],
  fallback: T
): T {
  const raw = process.env[name];
  if (!raw) return fallback;
  if (!allowed.includes(raw as T)) {
    throw new Error(
      `Invalid ${name}: "${raw}" (expected one of: ${allowed.join(", ")})`
    );
  }
  return raw as T;
}

export function getAuthDriverName(): AuthDriverName {
  return readDriver<AuthDriverName>("AUTH_DRIVER", ["stub", "cognito"], "stub");
}

export function getDbDriverName(): DbDriverName {
  return readDriver<DbDriverName>("DB_DRIVER", ["stub", "postgres"], "stub");
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
