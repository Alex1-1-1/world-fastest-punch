#!/bin/bash

# Railwayデプロイスクリプト

echo "Starting Railway deployment..."

# 依存関係のインストール
pip install -r requirements.txt

# データベースマイグレーション
python manage.py migrate

# 静的ファイルの収集
python manage.py collectstatic --noinput

# 管理者ユーザーの作成（存在しない場合）
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Admin user created')
else:
    print('Admin user already exists')
"

echo "Deployment completed successfully!"
