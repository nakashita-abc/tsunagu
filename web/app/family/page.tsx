import Image from "next/image";
import Link from "next/link";
// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";

// import { resolveSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { resolvePhotoUrl } from "@/lib/photos/resolve";

const SESSION_COOKIE = "__Host-session";
const PAGE_SIZE = 2;
const EXPANDED_PAGE_SIZE = 20;

function formatPostedAt(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

// TODO: 認証ロジック実装後、下の cookies()/resolveSession() による実セッション取得に置き換える。
// id/facilityId は lib/fixtures/stub-directory.ts の hanako@example.test（family, RESIDENT_TANAKA 紐付け）。
const mockSession = {
  subject: {
    id: "018f2d6e-0000-7000-8000-000000000004",
    facilityId: "018f2d6e-0000-7000-8000-0000000000f1",
  },
};

export default async function FamilyHomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  // const session = sessionId ? await resolveSession(sessionId) : null;

  // if (!session || session.subject.kind !== "family" || session.subject.status !== "active") {
  //   redirect("/");
  // }
  const session = mockSession;

  const showAll = (await searchParams).all === "1";
  const limit = showAll ? EXPANDED_PAGE_SIZE : PAGE_SIZE;

  const { items: posts, nextCursor } = await getDb().listTimelineForFamily({
    familyMemberId: session.subject.id,
    facilityId: session.subject.facilityId,
    limit,
  });

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 text-lg">
      {posts.length === 0 ? (
        <p className="py-16 text-center">まだ投稿はありません</p>
      ) : (
        <>
          <h1 className="mb-8 text-2xl font-bold">{posts[0].resident.name} さんの様子</h1>

          <ul className="space-y-12">
            {posts.map((post) => (
              <li key={post.id}>
                <Image
                  className="h-auto w-full rounded-lg"
                  src={resolvePhotoUrl(post.photo.ref)}
                  alt=""
                  width={post.photo.width}
                  height={post.photo.height}
                />
                <p className="mt-4">{post.text}</p>
                <p className="mt-2 text-base text-gray-700 dark:text-gray-300">
                  {formatPostedAt(post.postedAt)}
                </p>
              </li>
            ))}
          </ul>

          {!showAll && nextCursor !== null && (
            <div className="mt-8 text-center">
              <Link
                href="?all=1"
                className="inline-block rounded-lg border border-gray-300 px-6 py-3 dark:border-gray-600"
              >
                もっと見る
              </Link>
            </div>
          )}

          {showAll && (
            <div className="mt-8 text-center">
              <Link
                href="/family"
                className="inline-block rounded-lg border border-gray-300 px-6 py-3 dark:border-gray-600"
              >
                閉じる
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  );
}
