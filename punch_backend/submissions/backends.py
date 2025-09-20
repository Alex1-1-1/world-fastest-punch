from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class EmailBackend(ModelBackend):
    """
    メールアドレスでログインできるカスタム認証バックエンド
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            # メールアドレスでユーザーを検索
            user = User.objects.get(email=username)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            # メールアドレスで見つからない場合は、ユーザー名で検索
            try:
                user = User.objects.get(username=username)
                if user.check_password(password):
                    return user
            except User.DoesNotExist:
                return None
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
