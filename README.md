# 世界一速いパンチアプリ

パンチの速さを競い合うモバイルアプリケーションです。ユーザーがパンチの瞬間を撮影・投稿し、管理者による判定を通じて速度を競い合うことができます。

## 🏗️ アーキテクチャ

### フロントエンド
- **Web**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Mobile**: Expo (React Native) + TypeScript + React Native Paper

### バックエンド
- **API**: Next.js API Routes
- **データベース**: PostgreSQL (Supabase)
- **認証**: NextAuth.js (Google/Apple Sign-In)
- **画像保存**: Supabase Storage
- **ORM**: Prisma

## 📱 機能

### モバイルアプリ（iOS）
1. **ギャラリー画面**: 投稿されたパンチ画像の一覧表示
2. **投稿画面**: 画像アップロードと投稿機能
3. **詳細画面**: 透かし入り画像と判定結果の表示
4. **ランキング画面**: 速度別カテゴリでのランキング表示
5. **プロフィール画面**: ユーザー情報とログイン機能

### Web管理画面
1. **投稿管理**: 未判定投稿の一覧と判定機能
2. **通報管理**: ユーザーからの通報の確認と対応
3. **ランキング管理**: 週次ランキングの作成
4. **統計ダッシュボード**: 投稿数や判定状況の可視化

## 🚀 セットアップ

### 1. 環境変数の設定
`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/world_fastest_punch"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple OAuth
APPLE_ID="your-apple-id"
APPLE_SECRET="your-apple-secret"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Image Storage
SUPABASE_BUCKET_NAME="punch-submissions"
```

### 2. 依存関係のインストール

```bash
# Webアプリケーション
npm install

# モバイルアプリケーション
cd expo-app
npm install
```

### 3. データベースのセットアップ

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma db push
```

### 4. アプリケーションの起動

```bash
# Webアプリケーション（開発サーバー）
npm run dev

# モバイルアプリケーション（Expo）
cd expo-app
npm run expo:start
```

## 📊 データベーススキーマ

### 主要なテーブル
- **User**: ユーザー情報
- **Submission**: 投稿データ（画像URL、速度、コメント等）
- **Report**: 通報データ
- **Ranking**: ランキングデータ
- **Account/Session**: NextAuth用の認証データ

### 速度カテゴリ
- **VERY_FAST**: 100+ km/h（とても速い）
- **QUITE_FAST**: 80-99 km/h（まあまあ速い）
- **MODERATE**: 60-79 km/h（普通）
- **SLOW**: 40-59 km/h（遅い）
- **VERY_SLOW**: 0-39 km/h（とても遅い）

## 🔧 API エンドポイント

### 一般ユーザー用
- `GET /api/submissions` - ギャラリー一覧取得
- `GET /api/submissions/:id` - 投稿詳細取得
- `POST /api/submissions` - 画像投稿
- `GET /api/ranking` - ランキング取得

### 管理者用
- `GET /api/admin/submissions` - 管理者用投稿一覧
- `POST /api/admin/submissions/:id/judge` - 投稿判定
- `GET /api/admin/reports` - 通報一覧
- `PATCH /api/admin/reports/:id` - 通報ステータス更新

## 🛡️ セキュリティ機能

### 画像アップロード制限
- ファイル形式: JPEG/PNG/TIFFのみ
- ファイルサイズ: 2MB以下
- 自動透かし追加

### コンテンツ管理
- 不適切なコンテンツの投稿禁止
- ユーザー通報システム
- 管理者による手動判定

### 認証・認可
- Google/Apple Sign-In対応
- 管理者権限の分離
- JWT ベースのセッション管理

## 📱 モバイルアプリのビルド

### iOS アプリのビルド
```bash
cd expo-app
npx expo build:ios
```

### 開発用の実行
```bash
cd expo-app
npx expo start
```

## 🎨 UI/UX の特徴

### モバイルアプリ
- Material Design 3 (React Native Paper)
- 直感的なナビゲーション
- 高速な画像表示とキャッシュ
- オフライン対応

### Web管理画面
- モダンなダッシュボードデザイン
- レスポンシブ対応
- リアルタイム更新
- 直感的な操作インターフェース

## 🔄 開発フロー

1. **投稿**: ユーザーがパンチ画像をアップロード
2. **保存**: Supabase Storageに画像を保存
3. **判定待ち**: 管理者による判定を待つ
4. **判定**: 管理者が速度とコメントを入力
5. **公開**: 承認された投稿がギャラリーに表示
6. **ランキング**: 速度別にランキングに追加

## 📈 今後の拡張予定

- 動画投稿機能
- リアルタイム判定システム
- ソーシャル機能（いいね、コメント）
- プッシュ通知
- 多言語対応
- アナリティクス機能

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します。バグ報告や機能要望は、GitHubのIssuesでお知らせください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。



