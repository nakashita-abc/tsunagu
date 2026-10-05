import type { CursorPosition } from "./cursor";

export type SubjectKind = "admin" | "staff" | "family" | "resident";

/** 名簿上の状態（DB設計書：family_members.status ほか）。 */
export type SubjectStatus = "pending" | "invited" | "active" | "revoked";

/** 認証主体。resident の `id` は `residents.id` を指す（`resident_accounts.id` ではない）。 */
export interface AuthSubject {
  id: string;
  kind: SubjectKind;
  facilityId: string;
  status: SubjectStatus;
}

export interface Session {
  id: string;
  subject: AuthSubject;
  expiresAt: Date;
}

/** セッションの有効期間（ADR-032）。管理者は操作の重さに見合わせて短くする。 */
export function sessionTtlMs(kind: SubjectKind): number {
  switch (kind) {
    case "admin":
      return 12 * 60 * 60 * 1000;
    case "staff":
    case "family":
    case "resident":
      return 30 * 24 * 60 * 60 * 1000;
  }
}

/**
 * 写真の参照。`ref` の中身は driver によって変わる
 * （stub：そのまま使える URL／postgres：S3 の `object_key`）。
 * URL への解決は `resolvePhotoUrl()` の責務であり、呼び出し側は中身を解釈しない。
 */
export interface PhotoRef {
  ref: string;
  width: number;
  height: number;
}

/** 家族タイムラインの1件。写真は必須（DB設計書：`posts.photo_id` NOT NULL）。 */
export interface TimelinePost {
  id: string;
  postedAt: Date;
  text: string;
  photo: PhotoRef;
  resident: { name: string };
}

export interface StaffReaction {
  id: string;
  reactedAt: Date;
  familyMember: { name: string; relationship: string };
  post: {
    id: string;
    postedAt: Date;
    text: string;
    photo: { url: string; width: number; height: number } | null;
    resident: { name: string };
  };
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** `cursor` は復号済みの位置。不透明文字列の検証は呼び出し側（API）の責務。 */
export interface TimelineQuery {
  familyMemberId: string;
  facilityId: string;
  limit: number;
  cursor?: CursorPosition;
}

export interface StaffReactionsQuery {
  staffId: string;
  facilityId: string;
  limit: number;
  cursor?: CursorPosition;
}

export interface Db {
  findAuthSubjectByEmail(email: string): Promise<AuthSubject | null>;
  createSession(subject: AuthSubject): Promise<Session>;
  findSession(sessionId: string): Promise<Session | null>;
  listTimelineForFamily(query: TimelineQuery): Promise<Page<TimelinePost>>;
  listReactionsForStaff(query: StaffReactionsQuery): Promise<Page<StaffReaction>>;
}
