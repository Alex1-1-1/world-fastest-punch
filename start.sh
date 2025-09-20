#!/usr/bin/env bash
set -euxo pipefail

# リポジトリルートから start.sh が呼ばれる想定
cd punch_backend

# 1) DBマイグレーション
python manage.py migrate --noinput

# 2) 管理ユーザーを作成/更新（存在すれば昇格＆パス更新）
python manage.py shell <<'PY'
from django.contrib.auth import get_user_model
User = get_user_model()

email = "world.fastest.punch.kanri@gmail.com"
username = email
password = "world.kanri"

u, created = User.objects.get_or_create(username=username, defaults={"email": email})
if created:
    u.is_staff = True
    u.is_superuser = True
    u.set_password(password)
    u.save()
    print("Created superuser:", username)
else:
    changed = False
    if not u.is_superuser or not u.is_staff:
        u.is_superuser = True
        u.is_staff = True
        changed = True
    # 必要ならパス更新
    u.set_password(password)
    changed = True
    if changed:
        u.save()
        print("Updated superuser:", username)
    else:
        print("Superuser already valid:", username)
PY

# 3) 静的ファイル収集（Whitenoise）
python manage.py collectstatic --noinput || true

# 4) アプリ起動（Render の $PORT 使用）
exec gunicorn punch_backend.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers 3
