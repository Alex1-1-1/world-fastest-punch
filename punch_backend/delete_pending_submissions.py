#!/usr/bin/env python
import os
import sys
import django

# Django設定を読み込み
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'punch_backend.settings')
django.setup()

from submissions.models import Submission

# 判定待ちの投稿を取得
pending_submissions = Submission.objects.filter(is_judged=False)
print(f"判定待ちの投稿数: {pending_submissions.count()}")

# 各投稿の詳細を表示
for submission in pending_submissions:
    print(f"ID: {submission.id}, ユーザー: {submission.user.username}, 作成日: {submission.created_at}")

# 削除を実行
if pending_submissions.exists():
    print("\n判定待ちの投稿を削除します...")
    deleted_count = pending_submissions.delete()[0]
    print(f"削除された投稿数: {deleted_count}")
else:
    print("削除する投稿はありません")

# 残りの投稿数を確認
remaining_submissions = Submission.objects.all()
print(f"\n残りの投稿数: {remaining_submissions.count()}")
for submission in remaining_submissions:
    print(f"ID: {submission.id}, 判定済み: {submission.is_judged}, ユーザー: {submission.user.username}")


