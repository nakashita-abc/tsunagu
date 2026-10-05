export interface StubReactionFixture {
  id: string;
  staffId: string;
  facilityId: string;
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

const SAKURA_STAFF_ID = "018f2d6e-0000-7000-8000-000000000002";
const FACILITY_A = "018f2d6e-0000-7000-8000-0000000000f1";

/**
 * DB_DRIVER=stub のモック反応データ。sakura@example.test（職員）宛て3件と、
 * テナント分離確認用の別施設1件を含む。本番データを表すものではない。
 */
export const STUB_REACTIONS: readonly StubReactionFixture[] = [
  {
    id: "018f7a10-0000-7000-8000-000000000001",
    staffId: SAKURA_STAFF_ID,
    facilityId: FACILITY_A,
    reactedAt: new Date("2026-09-20T05:02:11Z"),
    familyMember: { name: "山田 恵子", relationship: "娘" },
    post: {
      id: "018f7a00-0000-7000-8000-000000000001",
      postedAt: new Date("2026-09-20T04:31:00Z"),
      text: "お昼にお庭を散歩しました",
      photo: { url: "/api/staff/photos/018f7a00-0000-7000-8000-000000000001", width: 1600, height: 1200 },
      resident: { name: "田中 太郎" },
    },
  },
  {
    id: "018f7a10-0000-7000-8000-000000000002",
    staffId: SAKURA_STAFF_ID,
    facilityId: FACILITY_A,
    reactedAt: new Date("2026-09-19T09:15:40Z"),
    familyMember: { name: "佐藤 一郎", relationship: "息子" },
    post: {
      id: "018f7a00-0000-7000-8000-000000000002",
      postedAt: new Date("2026-09-19T08:50:00Z"),
      text: "リハビリを頑張りました",
      photo: null,
      resident: { name: "佐藤 花子" },
    },
  },
  {
    id: "018f7a10-0000-7000-8000-000000000003",
    staffId: SAKURA_STAFF_ID,
    facilityId: FACILITY_A,
    reactedAt: new Date("2026-09-18T02:00:00Z"),
    familyMember: { name: "鈴木 直美", relationship: "妻" },
    post: {
      id: "018f7a00-0000-7000-8000-000000000003",
      postedAt: new Date("2026-09-18T01:40:00Z"),
      text: "おやつの時間に笑顔が見られました",
      photo: { url: "/api/staff/photos/018f7a00-0000-7000-8000-000000000003", width: 1600, height: 1200 },
      resident: { name: "鈴木 一郎" },
    },
  },
  {
    // 別施設の反応。テナント分離（facilityId 絞り込み）が効いていることを確認するためのフィクスチャ。
    id: "018f7a10-0000-7000-8000-000000000099",
    staffId: SAKURA_STAFF_ID,
    facilityId: "018f2d6e-0000-7000-8000-0000000000f2",
    reactedAt: new Date("2026-09-25T00:00:00Z"),
    familyMember: { name: "他施設 花子", relationship: "娘" },
    post: {
      id: "018f7a00-0000-7000-8000-000000000099",
      postedAt: new Date("2026-09-24T23:00:00Z"),
      text: "（別施設のデータ。表示されてはならない）",
      photo: null,
      resident: { name: "他施設 太郎" },
    },
  },
];
