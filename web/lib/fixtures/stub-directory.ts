import type { SubjectKind, SubjectStatus } from "@/lib/db/types";
import { RESIDENT_TANAKA } from "@/lib/fixtures/stub-timeline";

/**
 * AUTH_DRIVER=stub・DB_DRIVER=stub のときに使うモックデータ。
 * Cognito・RDS を用意せずに /api/auth/session の挙動を確認・テストするための固定データであり、
 * 本番データを表すものではない。
 */
export interface StubDirectoryEntry {
  email: string;
  password: string;
  kind: SubjectKind;
  /**
   * セッションに載る主体の識別子。
   * resident は `residents.id` を置く（`resident_accounts.id` ではない＝08_DB設計.md 5-2）。
   */
  subjectId: string;
  facilityId: string;
  status: SubjectStatus;
  /** true の場合、この password はサインイン時に NEW_PASSWORD_REQUIRED を発生させる（招待直後）。 */
  requiresInitialPassword?: boolean;
  /** family のみ。紐づく入居者（`family_members.resident_id`）。 */
  residentId?: string;
}

const FACILITY_A = "018f2d6e-0000-7000-8000-0000000000f1";

export const STUB_DIRECTORY: readonly StubDirectoryEntry[] = [
  {
    email: "admin@example.test",
    password: "correct-horse-battery-staple",
    kind: "admin",
    subjectId: "018f2d6e-0000-7000-8000-000000000001",
    facilityId: FACILITY_A,
    status: "active",
  },
  {
    email: "sakura@example.test",
    password: "correct-horse-battery-staple",
    kind: "staff",
    subjectId: "018f2d6e-0000-7000-8000-000000000002",
    facilityId: FACILITY_A,
    status: "active",
  },
  {
    email: "revoked-staff@example.test",
    password: "correct-horse-battery-staple",
    kind: "staff",
    subjectId: "018f2d6e-0000-7000-8000-000000000003",
    facilityId: FACILITY_A,
    status: "revoked",
  },
  {
    email: "hanako@example.test",
    password: "correct-horse-battery-staple",
    kind: "family",
    subjectId: "018f2d6e-0000-7000-8000-000000000004",
    facilityId: FACILITY_A,
    status: "active",
    residentId: RESIDENT_TANAKA,
  },
  {
    email: "taro-invited@example.test",
    password: "temporary-password-from-invitation",
    kind: "family",
    subjectId: "018f2d6e-0000-7000-8000-000000000005",
    facilityId: FACILITY_A,
    status: "invited",
    requiresInitialPassword: true,
    residentId: RESIDENT_TANAKA,
  },
  {
    // 退居等でアクセスを失効した家族（FR-501・INV-11）。資格情報が正しくても閲覧できない。
    email: "revoked-family@example.test",
    password: "correct-horse-battery-staple",
    kind: "family",
    subjectId: "018f2d6e-0000-7000-8000-000000000006",
    facilityId: FACILITY_A,
    status: "revoked",
    residentId: RESIDENT_TANAKA,
  },
  {
    // 自律的に操作できる入居者本人（ADR-049）。subjectId は residents.id である。
    email: "resident-yamada@example.test",
    password: "correct-horse-battery-staple",
    kind: "resident",
    subjectId: "018f2d6e-0000-7000-8000-0000000000a1",
    facilityId: FACILITY_A,
    status: "active",
  },
  {
    email: "resident-invited@example.test",
    password: "temporary-password-from-invitation",
    kind: "resident",
    subjectId: "018f2d6e-0000-7000-8000-0000000000a2",
    facilityId: FACILITY_A,
    status: "invited",
    requiresInitialPassword: true,
  },
];

export function findStubEntryByEmail(email: string): StubDirectoryEntry | null {
  const lower = email.toLowerCase();
  return STUB_DIRECTORY.find((e) => e.email.toLowerCase() === lower) ?? null;
}

export function findStubEntryBySubjectId(subjectId: string): StubDirectoryEntry | null {
  return STUB_DIRECTORY.find((e) => e.subjectId === subjectId) ?? null;
}
