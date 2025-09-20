#!/usr/bin/env bash
set -euxo pipefail

# 1. DBマイグレーション
python manage.py migrate --noinput

# 2. 管理ユーザーを作成（既にあればスキップ）
python - <<'PY'
from django.contrib.auth import get_user_model
User = get_user_model()
email = "world.fastest.punch.kanri@gmail.com"
username = email
password = "world.kanri"

u = User.objects.filter(username=username).first()
if not u:
    User.objects.create_superuser(username=username, email=email, password=password)
    print("Created superuser:", username)
else:
    print("Superuser already exists:", username)
PY

# 3. 静的ファイル（Whitenoise用）
python manage.py collectstatic --noinput || true

# 4. 最後にアプリ起動（Render の $PORT を使う）
exec gunicorn punch_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000}
