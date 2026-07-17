# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリの性質

高齢者の介護施設職員と、その家族をつなぐ情報共有システム（個人開発／OSS想定）。
現時点ではリポジトリは **上流工程のドキュメント（`docs/`）が主で、`web/` は create-next-app 直後のスキャフォルド**（まだ機能実装は無い）という段階にある。ドキュメントが実装に先行しているため、コードを書き始める前に該当ドキュメントの結論を確認すること。

- `docs/as-is.md` — 現状分析（本システムが「無い」前提での情報伝達の課題）。**解決策・機能・画面・技術は書かない**方針の文書。
- `docs/personas.md` — 想定ユーザー5人（P1〜P5）。要件定義・UX判断で迷ったときの拠り所。**本システム固有の機能名・画面名・実装手段を一切書かない**という制約付き。機能はこの文書を根拠に決めるが、この文書を機能に合わせて書き換えてはならない。
- `メモ`（リポジトリ直下） — 進め方（コンサル形式）と題材の元メモ。

### 進め方（重要な前提）
上流工程は次の5ステップの順で進める方針：
1. 課題の抽象的な決定 → 2. 既存アプリでできること/できないこと → 3. 本システムで何をどう解決するか → 4. 要件定義 → 5. 画面設計・DB設計・API設計。

`personas.md` / `as-is.md` は step 4 より上流の文書。ここに機能・画面・技術を混ぜないこと（各文書冒頭のスコープ注記を厳守）。

### 確定済みの設計判断
- **認証は AWS Cognito Hosted UI を採用**。したがって独自のログイン画面・ログインロジックは実装しない。
- ペルソナ P2（82歳・IT低スキル）が最重要制約：**記憶・入力を求めるパスワード方式は不可**。認証・UXはこの制約に合わせる。
- P5（施設長）は個人情報を外部事業者に預けたくない → **施設側でデータを管理できる（セルフホスト可能な）構成**を志向。

## web/ アプリ

Next.js 16 App Router + React 19 + TypeScript(strict) + Tailwind CSS v4 + ESLint 9(flat config)。すべてのコマンドは `web/` ディレクトリで実行する。

```bash
cd web
npm run dev     # 開発サーバ（http://localhost:3000）
npm run build   # 本番ビルド
npm run start   # ビルド済みを起動
npm run lint    # ESLint
```

テストフレームワークはまだ導入されていない（`package.json` にテストスクリプト無し）。

### ⚠️ Next.js 16 の破壊的変更に注意
`web/CLAUDE.md` は `web/AGENTS.md` を読み込む構成になっており、そこに重要な指示がある：

> **This is NOT the Next.js you know.** APIや規約・ファイル構成が学習データと異なる可能性がある。コードを書く前に `web/node_modules/next/dist/docs/` の該当ガイドを読み、deprecation notice に従うこと。

`web/` で作業する際は必ずこの指示に従う（推測でNext.jsのAPIを書かない）。

### パス/構成メモ
- パスエイリアス `@/*` はリポジトリではなく **`web/` ルート**を指す（`web/tsconfig.json`）。
- 現状の `app/page.tsx` / `app/layout.tsx` はスキャフォルドのまま（"Create Next App" のメタデータ・デフォルトページ）。実装開始時に置き換える。
