#!/usr/bin/env python
import os
import sys
import django

# Django設定を読み込み
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'punch_backend.settings')
django.setup()

from submissions.models import Submission

def clear_all_submissions():
    """すべての投稿を削除してCloudinary移行を強制"""
    print("すべての投稿を削除してCloudinary移行を強制します...")
    
    # すべての投稿を取得
    all_submissions = Submission.objects.all()
    print(f"削除対象の投稿数: {all_submissions.count()}")
    
    # 各投稿の詳細を表示
    for submission in all_submissions:
        print(f"ID: {submission.id}, ユーザー: {submission.user.username}, 画像: {submission.image}, 作成日: {submission.created_at}")
    
    # 削除を実行
    if all_submissions.exists():
        print("\nすべての投稿を削除します...")
        deleted_count = all_submissions.delete()[0]
        print(f"削除された投稿数: {deleted_count}")
    else:
        print("削除する投稿はありません")
    
    # 残りの投稿数を確認
    remaining_submissions = Submission.objects.all()
    print(f"\n残りの投稿数: {remaining_submissions.count()}")
    
    print("削除完了！新しい投稿はCloudinaryに保存されます。")

if __name__ == '__main__':
    clear_all_submissions()
