# 世界一速いパンチ - Django Backend

## Railway デプロイ手順

### 1. Railway プロジェクトの作成

1. [Railway.app](https://railway.app) にアクセス
2. GitHubアカウントでログイン
3. "New Project" → "Deploy from GitHub repo" を選択
4. `Alex1-1-1/world-fastest-punch` リポジトリを選択
5. ルートディレクトリを `punch_backend` に設定

### 2. データベースの設定

1. Railwayダッシュボードで "Add Service" → "Database" → "PostgreSQL" を選択
2. 自動的に `DATABASE_URL` 環境変数が設定されます

### 3. 環境変数の設定

以下の環境変数を設定してください：

```
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-railway-domain.railway.app,localhost,127.0.0.1
RESEND_API_KEY=your-resend-api-key
DEFAULT_FROM_EMAIL=your-email@example.com
```

### 4. デプロイ

Railwayが自動的にデプロイを開始します。

### 5. データベースマイグレーション

デプロイ後、Railwayのコンソールで以下のコマンドを実行：

```bash
python manage.py migrate
python manage.py createsuperuser
```

## ローカル開発

```bash
# 依存関係のインストール
pip install -r requirements.txt

# データベースマイグレーション
python manage.py migrate

# 開発サーバーの起動
python manage.py runserver
```

## API エンドポイント

- `GET /api/submissions/` - 投稿一覧
- `POST /api/submissions/` - 投稿作成
- `GET /api/ranking/` - ランキング
- `POST /api/auth/login/` - ログイン
- `GET /api/profile/` - プロフィール
- `GET /api/notifications/` - 通知一覧
