import { randomBytes } from "node:crypto";

import { findStubEntryByEmail, findStubEntryBySubjectId } from "@/lib/fixtures/stub-directory";
import { STUB_REACTIONS } from "@/lib/fixtures/stub-reactions";
import { STUB_TIMELINE_POSTS } from "@/lib/fixtures/stub-timeline";

import { encodeCursor, type CursorPosition } from "./cursor";
import { sessionTtlMs } from "./types";
import type {
  AuthSubject,
  Db,
  Page,
  Session,
  StaffReaction,
  StaffReactionsQuery,
  TimelinePost,
  TimelineQuery,
} from "./types";

/**
 * プロセス内のセッション保管。DB_DRIVER=stub は RDS を用意せずに挙動を確認するためのもので、
 * 永続化もサーバーインスタンス間の共有もしない。
 *
 * globalThis に置くのは、API（Route Handler）とサーバーコンポーネントでモジュールの
 * インスタンスが分かれるため——モジュール変数に置くと、サインインで発行したセッションを
 * 画面側が見つけられない。
 */
const globalForStubDb = globalThis as { __stubSessions?: Map<string, Session> };
const sessions = (globalForStubDb.__stubSessions ??= new Map<string, Session>());

/** 時刻降順。同時刻は id 降順にして並びを一意にする。 */
function newestFirst(a: CursorPosition, b: CursorPosition): number {
  const byTime = b.postedAt.getTime() - a.postedAt.getTime();
  if (byTime !== 0) return byTime;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

function isOlderThan(item: CursorPosition, position: CursorPosition): boolean {
  const diff = item.postedAt.getTime() - position.postedAt.getTime();
  return diff < 0 || (diff === 0 && item.id < position.id);
}

function paginate<T>(
  all: readonly T[],
  positionOf: (item: T) => CursorPosition,
  limit: number,
  position: CursorPosition | null
): Page<T> {
  const sorted = [...all].sort((a, b) => newestFirst(positionOf(a), positionOf(b)));
  const remaining = position
    ? sorted.filter((item) => isOlderThan(positionOf(item), position))
    : sorted;

  const items = remaining.slice(0, limit);
  const last = items.at(-1);
  const hasMore = remaining.length > items.length;

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(positionOf(last)) : null,
  };
}

export function createStubDb(): Db {
  return {
    async findAuthSubjectByEmail(email: string): Promise<AuthSubject | null> {
      const entry = findStubEntryByEmail(email);
      if (!entry) return null;

      return {
        id: entry.subjectId,
        kind: entry.kind,
        facilityId: entry.facilityId,
        status: entry.status,
      };
    },

    async createSession(subject: AuthSubject): Promise<Session> {
      const session: Session = {
        // 高エントロピーな不透明トークン。UUIDv7 は使わない（発行時刻が読めるため）。
        id: randomBytes(32).toString("base64url"),
        subject,
        expiresAt: new Date(Date.now() + sessionTtlMs(subject.kind)),
      };
      sessions.set(session.id, session);
      return session;
    },

    async findSession(sessionId: string): Promise<Session | null> {
      return sessions.get(sessionId) ?? null;
    },

    async listTimelineForFamily(query: TimelineQuery): Promise<Page<TimelinePost>> {
      const family = findStubEntryBySubjectId(query.familyMemberId);
      if (!family || family.kind !== "family" || !family.residentId) {
        return { items: [], nextCursor: null };
      }

      const visible = STUB_TIMELINE_POSTS.filter(
        (post) =>
          post.residentId === family.residentId &&
          post.facilityId === query.facilityId &&
          post.deletedAt === null
      ).map(
        (post): TimelinePost => ({
          id: post.id,
          postedAt: post.postedAt,
          text: post.text,
          photo: post.photo,
          resident: { name: post.residentName },
        })
      );

      return paginate(visible, (post) => post, query.limit, query.cursor ?? null);
    },

    async listReactionsForStaff(query: StaffReactionsQuery): Promise<Page<StaffReaction>> {
      const visible = STUB_REACTIONS.filter(
        (reaction) =>
          reaction.staffId === query.staffId && reaction.facilityId === query.facilityId
      ).map(
        (reaction): StaffReaction => ({
          id: reaction.id,
          reactedAt: reaction.reactedAt,
          familyMember: reaction.familyMember,
          post: reaction.post,
        })
      );

      return paginate(
        visible,
        (reaction) => ({ id: reaction.id, postedAt: reaction.reactedAt }),
        query.limit,
        query.cursor ?? null
      );
    },
  };
}
