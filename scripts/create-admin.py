#!/usr/bin/env python3
"""
管理者ユーザーを作成するスクリプト
"""
import os
import sys
import django
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

# Django設定を読み込み
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'punch_backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'punch_backend.settings')
django.setup()

from submissions.models import UserProfile

def create_admin_user():
    """管理者ユーザーを作成"""
    email = input("管理者のメールアドレスを入力してください: ")
    username = input("管理者のユーザー名を入力してください: ")
    password = input("管理者のパスワードを入力してください: ")
    
    # ユーザーが既に存在するかチェック
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': username,
            'password': make_password(password),
            'is_staff': True,
            'is_superuser': True,
        }
    )
    
    if not created:
        print(f"ユーザー {email} は既に存在します。")
        # 既存ユーザーを管理者に設定
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        print("既存ユーザーを管理者に設定しました。")
    else:
        print(f"新しい管理者ユーザー {email} を作成しました。")
    
    # プロフィールを作成または更新
    profile, profile_created = UserProfile.objects.get_or_create(
        user=user,
        defaults={'role': 'ADMIN'}
    )
    
    if not profile_created:
        profile.role = 'ADMIN'
        profile.save()
        print("既存プロフィールを管理者に設定しました。")
    else:
        print("管理者プロフィールを作成しました。")
    
    print(f"\n管理者ユーザー情報:")
    print(f"メール: {email}")
    print(f"ユーザー名: {username}")
    print(f"ロール: {profile.role}")
    print(f"スタッフ権限: {user.is_staff}")
    print(f"スーパーユーザー権限: {user.is_superuser}")

if __name__ == "__main__":
    create_admin_user()
