import { findStubEntryByEmail } from "@/lib/fixtures/stub-directory";

/**
 * 職員画面がログイン画面の実装を待たずに動くための仮の身元。
 * セッションを経由しないため、職員画面にログインを通す時点で `resolveSession()` に置き換える。
 */
export async function getCurrentStaffIdentity(): Promise<{
  staffId: string;
  facilityId: string;
}> {
  const entry = findStubEntryByEmail("sakura@example.test");
  if (!entry) throw new Error("モック名簿に sakura@example.test がない");

  return { staffId: entry.subjectId, facilityId: entry.facilityId };
}
