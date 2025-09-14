from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from submissions.models import UserProfile

class Command(BaseCommand):
    help = '管理者ユーザーを作成します'

    def handle(self, *args, **options):
        email = input("管理者のメールアドレスを入力してください: ")
        username = input("管理者のユーザー名を入力してください: ")
        password = input("管理者のパスワードを入力してください: ")
        
        # ユーザーが既に存在するかチェック
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        
        if not created:
            self.stdout.write(f"ユーザー {email} は既に存在します。")
            # 既存ユーザーを管理者に設定
            user.is_staff = True
            user.is_superuser = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS("既存ユーザーを管理者に設定しました。"))
        else:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"新しい管理者ユーザー {email} を作成しました。"))
        
        # プロフィールを作成または更新
        profile, profile_created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'ADMIN'}
        )
        
        if not profile_created:
            profile.role = 'ADMIN'
            profile.save()
            self.stdout.write(self.style.SUCCESS("既存プロフィールを管理者に設定しました。"))
        else:
            self.stdout.write(self.style.SUCCESS("管理者プロフィールを作成しました。"))
        
        self.stdout.write(f"\n管理者ユーザー情報:")
        self.stdout.write(f"メール: {email}")
        self.stdout.write(f"ユーザー名: {username}")
        self.stdout.write(f"ロール: {profile.role}")
        self.stdout.write(f"スタッフ権限: {user.is_staff}")
        self.stdout.write(f"スーパーユーザー権限: {user.is_superuser}")
