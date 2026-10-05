/**
 * DB_DRIVER=stub のモック投稿データ（家族タイムライン用）。
 * `photo.ref` は stub では**そのまま使える URL** を持つ（本番は S3 の `object_key`）。
 * 本番データを表すものではない。
 */
export interface StubTimelinePostFixture {
  id: string;
  residentId: string;
  residentName: string;
  facilityId: string;
  postedAt: Date;
  text: string;
  photo: { ref: string; width: number; height: number };
  /** 論理削除（DB設計書：`posts.deleted_at`）。削除済みは一覧に出ない。 */
  deletedAt: Date | null;
}

const FACILITY_A = "018f2d6e-0000-7000-8000-0000000000f1";
const FACILITY_B = "018f2d6e-0000-7000-8000-0000000000f2";

/**
 * stub の写真。`resolvePhotoUrl()` がそのまま返すため、完成形の URL を置く。
 * 外部ホストを next/image に通すため、next.config.ts の `images.remotePatterns` に登録している。
 */
const STUB_PHOTO_URL = "https://picsum.photos/200/300";

export const RESIDENT_TANAKA = "018f2d6e-0000-7000-8000-0000000000b1";
export const RESIDENT_SATO = "018f2d6e-0000-7000-8000-0000000000b2";

export const STUB_TIMELINE_POSTS: readonly StubTimelinePostFixture[] = [
  {
    id: "018f7a00-0000-7000-8000-000000000001",
    residentId: RESIDENT_TANAKA,
    residentName: "田中 太郎",
    facilityId: FACILITY_A,
    postedAt: new Date("2026-09-20T04:31:00Z"),
    text: "お昼にお庭を散歩しました",
    photo: { ref: STUB_PHOTO_URL, width: 200, height: 300 },
    deletedAt: null,
  },
  {
    id: "018f7a00-0000-7000-8000-000000000002",
    residentId: RESIDENT_TANAKA,
    residentName: "田中 太郎",
    facilityId: FACILITY_A,
    postedAt: new Date("2026-09-19T08:50:00Z"),
    text: "リハビリを頑張りました",
    photo: { ref: STUB_PHOTO_URL, width: 200, height: 300 },
    deletedAt: null,
  },
  {
    id: "018f7a00-0000-7000-8000-000000000003",
    residentId: RESIDENT_TANAKA,
    residentName: "田中 太郎",
    facilityId: FACILITY_A,
    postedAt: new Date("2026-09-18T01:40:00Z"),
    text: "おやつの時間に笑顔が見られました",
    photo: { ref: STUB_PHOTO_URL, width: 200, height: 300 },
    deletedAt: null,
  },
  {
    // 削除済みの投稿。一覧から消えることを確認するためのフィクスチャ。
    id: "018f7a00-0000-7000-8000-000000000004",
    residentId: RESIDENT_TANAKA,
    residentName: "田中 太郎",
    facilityId: FACILITY_A,
    postedAt: new Date("2026-09-17T02:00:00Z"),
    text: "（削除済みの投稿。表示されてはならない）",
    photo: { ref: STUB_PHOTO_URL, width: 200, height: 300 },
    deletedAt: new Date("2026-09-17T03:00:00Z"),
  },
  {
    // 別の入居者の投稿。家族は紐づく入居者の分しか見られない（NFR-41）ことを確認する。
    id: "018f7a00-0000-7000-8000-000000000011",
    residentId: RESIDENT_SATO,
    residentName: "佐藤 花子",
    facilityId: FACILITY_A,
    postedAt: new Date("2026-09-21T00:00:00Z"),
    text: "（別の入居者の投稿。表示されてはならない）",
    photo: { ref: STUB_PHOTO_URL, width: 200, height: 300 },
    deletedAt: null,
  },
  {
    // 別施設の投稿。テナント分離（facilityId 絞り込み）が効いていることを確認するためのフィクスチャ。
    id: "018f7a00-0000-7000-8000-000000000099",
    residentId: RESIDENT_TANAKA,
    residentName: "田中 太郎",
    facilityId: FACILITY_B,
    postedAt: new Date("2026-09-22T00:00:00Z"),
    text: "（別施設のデータ。表示されてはならない）",
    photo: { ref: STUB_PHOTO_URL, width: 200, height: 300 },
    deletedAt: null,
  },
];
