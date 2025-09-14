#!/usr/bin/env python
import os
import sys
import django

# Djangoの設定を読み込み
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'punch_backend.settings')
django.setup()

from django.contrib.auth.models import User
from submissions.models import Submission, Judgment

def merge_world_users():
    """worldユーザーを統合"""
    print("worldユーザーを統合します...")
    
    # 2つのworldユーザーを取得
    user_world = User.objects.get(username='world')
    user_email = User.objects.get(username='world.fastest.punch@gmail.com')
    
    print(f"ユーザー1: {user_world.username} (ID: {user_world.id}, Email: {user_world.email})")
    print(f"ユーザー2: {user_email.username} (ID: {user_email.id}, Email: {user_email.email})")
    
    # メールアドレスベースのユーザーをメインに統合
    main_user = user_email
    old_user = user_world
    
    print(f"メインユーザー: {main_user.username} (ID: {main_user.id})")
    print(f"統合対象ユーザー: {old_user.username} (ID: {old_user.id})")
    
    # 投稿を移動
    submissions = Submission.objects.filter(user=old_user)
    print(f"移動対象の投稿数: {submissions.count()}")
    for submission in submissions:
        submission.user = main_user
        submission.save()
        print(f"投稿ID {submission.id} を {main_user.username} に移動")
    
    # 判定を移動
    judgments = Judgment.objects.filter(submission__user=old_user)
    print(f"移動対象の判定数: {judgments.count()}")
    for judgment in judgments:
        judgment.submission.user = main_user
        judgment.submission.save()
        print(f"判定ID {judgment.id} を {main_user.username} に移動")
    
    # 通知はsubmissionsアプリ内で管理されているので、ここではスキップ
    
    # 古いユーザーを削除
    old_user.delete()
    print(f"ユーザー {old_user.username} を削除しました")
    
    print("統合完了！")

if __name__ == '__main__':
    merge_world_users()
