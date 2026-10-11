# プロジェクト概要
- 名前: tsunagu
- スタック: Next.js+TypeScript+Vercel+AWS
- 目的: 入居型介護施設の職員と家族の間で情報をつなぐこと
- 開発者: 1人

# コーディング規約
- フロントエンド: TypeScript strict、Tailwind CSS
- テスト: カバレッジ80%以上
- アーキテクチャ: Presentation / Service / Repository の3層。定義は docs/清書/アーキテクチャ設計書.md が正本

# 禁止事項
- anyの使用禁止。型による契約を徹底してください
- facilityId をクライアント入力（パス・クエリ・ボディ）から受け取らない。セッション由来のみ（NFR-47）

# 実装するとき
- implementation Skill の手順に従う（設計書の確認 → 層の確定 → テスト先行）

# セッション開始時の動作
1. CLAUDE.mdを読む
2. 直近のgit logを確認する
3. 変更前にテストを実行する