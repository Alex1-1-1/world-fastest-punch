# 世界一速いパンチアプリ

パンチの速度を測定・投稿・ランキング表示するWebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 14, React, TypeScript, Tailwind CSS
- **バックエンド**: Django 5.2, Django REST Framework
- **データベース**: SQLite（開発環境）
- **認証**: NextAuth.js（Google OAuth対応）
- **画像処理**: サムネイル生成、ウォーターマーク付与

## 機能

### ユーザー機能
- パンチ速度の測定・投稿
- プロフィール設定（画像、ユーザー名、メール、自己紹介）
- 投稿の説明文追加
- ランキング表示（カテゴリー別・総合）
- ギャラリー表示
- 通知機能

### 管理者機能
- 投稿の承認・却下
- 却下理由の設定
- ユーザーへの通知送信
- 統計情報の表示

## セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/YOUR_USERNAME/world-fastest-punch.git
cd world-fastest-punch
```

### 2. フロントエンドのセットアップ
```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp env.example .env.local
# .env.localを編集して必要な環境変数を設定

# 開発サーバーの起動
npm run dev
```

### 3. バックエンドのセットアップ
```bash
# Django仮想環境の作成
python -m venv django-backend
source django-backend/bin/activate  # Windows: django-backend\Scripts\activate

# 依存関係のインストール
cd punch_backend
pip install -r requirements.txt

# データベースマイグレーション
python manage.py migrate

# 開発サーバーの起動
python manage.py runserver 8000
```

## アクセス

- **メインアプリ**: http://localhost:3000
- **管理者ダッシュボード**: http://localhost:3000/admin
- **API**: http://localhost:8000/api/

## プロジェクト構造

```
├── app/                    # Next.js App Router
├── components/             # Reactコンポーネント
│   ├── WebApp.tsx         # メインアプリケーション
│   └── admin/             # 管理者ダッシュボード
├── punch_backend/         # Djangoバックエンド
│   ├── submissions/       # 投稿管理アプリ
│   └── punch_backend/     # Django設定
├── public/                # 静的ファイル
└── lib/                   # ユーティリティ関数
```

## 特徴

### モダンなランキングUI
- 1-3位: 金・銀・銅の特別なデザイン
- 4位以下: 統一されたオレンジ色のデザイン
- アニメーション・グラデーション・装飾付き

### 画像処理
- 自動サムネイル生成
- ウォーターマーク付与
- プレースホルダー画像対応

### レスポンシブデザイン
- モバイル・タブレット・デスクトップ対応
- Tailwind CSSによる統一されたデザイン

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## 更新履歴

- v1.0.0: 初期リリース
  - 基本的な投稿・ランキング機能
  - 管理者ダッシュボード
  - ユーザー認証・プロフィール機能
  - モダンなランキングUI
  - 説明文・通知機能