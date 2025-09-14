#!/usr/bin/env python
import os
import sys
import django

# Djangoの設定を読み込み
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'punch_backend.settings')
django.setup()

from django.contrib.auth.models import User
from submissions.models import Submission

def fix_user_assignments():
    """既存の投稿のユーザー割り当てを修正"""
    print("既存の投稿のユーザー割り当てを修正します...")
    
    # ユーザー333を取得または作成
    user333, created = User.objects.get_or_create(
        username='ユーザー333',
        defaults={'email': 'test@example.com'}
    )
    print(f"ユーザー333: {user333.username} (created: {created})")
    
    # ユーザー4を取得
    try:
        user4 = User.objects.get(username='ユーザー4')
        print(f"ユーザー4: {user4.username}")
    except User.DoesNotExist:
        print("ユーザー4が見つかりません")
        return
    
    # ユーザー4の投稿をユーザー333に変更
    submissions = Submission.objects.filter(user=user4)
    print(f"ユーザー4の投稿数: {submissions.count()}")
    
    for submission in submissions:
        print(f"投稿ID {submission.id} をユーザー333に変更")
        submission.user = user333
        submission.save()
    
    print("修正完了！")

if __name__ == '__main__':
    fix_user_assignments()

