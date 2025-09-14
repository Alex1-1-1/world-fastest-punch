#!/usr/bin/env python
import os
import sys
import django

# Djangoの設定を読み込み
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'punch_backend.settings')
django.setup()

from django.contrib.auth.models import User
from submissions.models import Submission

def fix_username_consistency():
    """ユーザー名の一貫性を修正"""
    print("ユーザー名の一貫性を修正します...")
    
    # ユーザー３３３（全角数字）をユーザー333（半角数字）に統一
    try:
        user_fullwidth = User.objects.get(username='ユーザー３３３')
        print(f"全角数字ユーザー発見: {user_fullwidth.username}")
        
        # ユーザー333（半角数字）を取得または作成
        user_halfwidth, created = User.objects.get_or_create(
            username='ユーザー333',
            defaults={'email': 'test@example.com'}
        )
        print(f"半角数字ユーザー: {user_halfwidth.username} (created: {created})")
        
        # 全角数字ユーザーの投稿を半角数字ユーザーに移動
        submissions = Submission.objects.filter(user=user_fullwidth)
        print(f"移動対象の投稿数: {submissions.count()}")
        
        for submission in submissions:
            print(f"投稿ID {submission.id} をユーザー333に移動")
            submission.user = user_halfwidth
            submission.save()
        
        # 全角数字ユーザーを削除
        user_fullwidth.delete()
        print("全角数字ユーザーを削除しました")
        
    except User.DoesNotExist:
        print("全角数字ユーザーは存在しません")
    
    print("修正完了！")

if __name__ == '__main__':
    fix_username_consistency()

