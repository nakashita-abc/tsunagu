import Image from "next/image";
import Link from "next/link";

import { getCurrentStaffIdentity } from "@/lib/auth/current-staff-stub";
import { getDb } from "@/lib/db";

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function StaffHomePage() {
  const { staffId, facilityId } = await getCurrentStaffIdentity();
  const { items: reactions } = await getDb().listReactionsForStaff({ staffId, facilityId, limit: 2 });

  return (
    <div>
      <Link href="/staff/posts/new">＋ 投稿をつくる</Link>

      <section>
        <h2>自分への最新の反応</h2>
        {reactions.length === 0 ? (
          <p>まだ反応はありません</p>
        ) : (
          <ul>
            {reactions.map((reaction) => (
              <li key={reaction.id}>
                <p>
                  {reaction.familyMember.name}（{reaction.familyMember.relationship}）さんから —{" "}
                  {formatDateTime(reaction.reactedAt)}
                </p>
                <p>
                  {reaction.post.resident.name} さんの投稿（{formatDateTime(reaction.post.postedAt)}）：
                  {reaction.post.text}
                </p>
                {reaction.post.photo && (
                  <Image
                    src={reaction.post.photo.url}
                    alt=""
                    width={reaction.post.photo.width}
                    height={reaction.post.photo.height}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        <Link href="/staff/reactions">すべての反応を見る</Link>
      </section>
    </div>
  );
}
