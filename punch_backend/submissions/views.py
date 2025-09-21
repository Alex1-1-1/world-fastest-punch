from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
from .models import Submission, Judgment, Ranking, Report, UserProfile, Notification
from .serializers import (
    SubmissionSerializer, SubmissionCreateSerializer,
    JudgmentSerializer, RankingSerializer, ReportSerializer, UserProfileSerializer, NotificationSerializer
)
from PIL import Image
import os

def admin_required(view_func):
    """管理者権限が必要なデコレータ"""
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({'error': '認証が必要です'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            profile = request.user.profile
            if profile.role != 'ADMIN':
                return Response({'error': '管理者権限が必要です'}, status=status.HTTP_403_FORBIDDEN)
        except UserProfile.DoesNotExist:
            return Response({'error': 'プロフィールが見つかりません'}, status=status.HTTP_404_NOT_FOUND)
        
        return view_func(request, *args, **kwargs)
    return wrapper
from django.conf import settings


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """パスワード変更"""
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response({'error': '現在のパスワードと新しいパスワードが必要です'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 現在のパスワードを確認
    if not request.user.check_password(current_password):
        return Response({'error': '現在のパスワードが正しくありません'}, status=status.HTTP_400_BAD_REQUEST)
    
    # 新しいパスワードを設定
    request.user.set_password(new_password)
    request.user.save()
    
    return Response({'success': True})


@api_view(['POST'])
@permission_classes([AllowAny])
def sync_user(request):
    """Google認証でユーザー情報を同期"""
    try:
        google_id = request.data.get('google_id')
        email = request.data.get('email')
        name = request.data.get('name')
        picture = request.data.get('picture')
        
        # ユーザーが存在するかチェック
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                'email': email,
                'first_name': name.split(' ')[0] if name else '',
                'last_name': ' '.join(name.split(' ')[1:]) if name and ' ' in name else '',
            }
        )
        
        if created:
            print(f"New user created: {user.username}")
        else:
            print(f"Existing user found: {user.username}")
        
        return Response({
            'user_id': user.id,
            'username': user.username,
            'created': created
        })
    except Exception as e:
        print(f"Error syncing user: {e}")
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """メール/パスワードでログイン"""
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # ユーザーを認証
        user = authenticate(username=email, password=password)
        
        if user is None:
            # メールアドレスでユーザーを検索してから認証を試行
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # セッションにログイン
        from django.contrib.auth import login
        login(request, user)

        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """新規ユーザー登録"""
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', email)

        print(f"DEBUG: Registration attempt - email: {email}, password length: {len(password) if password else 'None'}, username: {username}")

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # メールアドレスの重複チェック（既存ユーザーを削除して再登録を許可）
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            print(f"DEBUG: User with email {email} already exists, deleting and recreating")
            existing_user.delete()

        # ユーザー名の重複チェック
        if User.objects.filter(username=username).exists():
            print(f"DEBUG: User with username {username} already exists")
            return Response({'error': 'User with this username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # ユーザー作成
        print(f"DEBUG: Creating user with email: {email}, username: {username}")
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=True
        )
        print(f"DEBUG: User created successfully - ID: {user.id}, email: {user.email}")

        # パスワードが正しく設定されているかチェック
        if user.check_password(password):
            print("DEBUG: Password verification successful")
        else:
            print("DEBUG: Password verification FAILED!")

        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"DEBUG: Registration error: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """パスワードリセット（メール送信対応版）"""
    try:
        data = request.data
        email = data.get('email')

        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # ユーザーが存在するかチェック
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)

        # 新しいパスワードを生成
        new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        user.set_password(new_password)
        user.save()

        # Resendを使用してメール送信を試行
        try:
            import resend
            import requests
            
            # Resend APIキーを設定
            resend.api_key = settings.RESEND_API_KEY
            
            subject = 'パスワードリセット完了 - 世界一速いパンチ'
            html_content = f'''
            <html>
            <body>
                <h2>パスワードリセット完了</h2>
                <p>こんにちは！</p>
                <p>パスワードリセットが完了しました。</p>
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>新しいパスワード: {new_password}</strong>
                </div>
                <p>このパスワードでログインしてください。</p>
                <p>ログイン後は、プロフィール設定からパスワードを変更することをお勧めします。</p>
                <hr>
                <p>世界一速いパンチ</p>
            </body>
            </html>
            '''
            
            # ResendのAPIを直接呼び出し
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json"
            }
            data = {
                "from": "世界一速いパンチ <onboarding@resend.dev>",
                "to": [email],
                "subject": subject,
                "html": html_content
            }
            
            response = requests.post(url, headers=headers, json=data)
            print(f"Resend API response status: {response.status_code}")
            print(f"Resend API response: {response.text}")
            
            if response.status_code == 200:
                print(f"Password reset email sent to {email} via Resend")
                return Response({
                    'message': 'Password reset successfully. Please check your email.',
                    'note': '新しいパスワードがメールアドレスに送信されました。'
                }, status=status.HTTP_200_OK)
            else:
                raise Exception(f"Resend API error: {response.status_code} - {response.text}")
            
        except Exception as email_error:
            print(f"Resend email sending failed: {email_error}")
            print(f"Error type: {type(email_error)}")
            print(f"Error details: {str(email_error)}")
            # メール送信に失敗した場合はフォールバック
            return Response({
                'message': 'Password reset successfully',
                'new_password': new_password,  # メール送信失敗時のフォールバック
                'note': f'メール送信に失敗しました。新しいパスワード: {new_password}'
            }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmissionListCreateView(generics.ListCreateAPIView):
    """投稿一覧・作成ビュー"""
    queryset = Submission.objects.all()
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]  # 認証不要で投稿一覧を取得可能
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubmissionCreateSerializer
        return SubmissionSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        # ユーザーを設定（認証が必要な場合）
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            # フロントエンドから送信されたユーザー情報を使用
            username = self.request.data.get('username', 'ユーザー333')
            email = self.request.data.get('email', 'test@example.com')
            
            print(f"DEBUG: ユーザー情報 - username: {username}, email: {email}")
            
            # ユーザーを取得または作成
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email}
            )
            print(f"DEBUG: ユーザー取得/作成 - user: {user.username}, created: {created}")
            serializer.save(user=user)
        
        # サムネイルと透かし画像の生成（Cloudinary環境ではスキップ）
        submission = serializer.instance
        if not settings.USE_CLOUDINARY:
            self._generate_thumbnail(submission)
            self._generate_watermark(submission)
        else:
            print("DEBUG: Cloudinary環境のため、ローカル画像処理をスキップ")
    
    def create(self, request, *args, **kwargs):
        """投稿作成後のレスポンスをカスタマイズ"""
        try:
            print(f"DEBUG: 投稿作成開始 - リクエストデータ: {request.data}")
            print(f"DEBUG: ファイル: {request.FILES}")
            
            response = super().create(request, *args, **kwargs)
            print(f"DEBUG: 投稿作成レスポンス: {response.status_code}")
            print(f"DEBUG: レスポンスデータ: {response.data}")
            
            # 作成された投稿の詳細情報を返す
            if response.status_code == 201:
                submission_id = response.data.get('id')
                print(f"DEBUG: 投稿ID: {submission_id}")
                if submission_id:
                    submission = Submission.objects.get(id=submission_id)
                    serializer = SubmissionSerializer(submission, context={'request': request})
                    response.data = serializer.data
                    print(f"DEBUG: 最終レスポンスデータ: {response.data}")
                else:
                    print("DEBUG: 投稿IDが取得できませんでした")
                    
        except Exception as e:
            print(f"DEBUG: 投稿作成エラー: {e}")
            import traceback
            traceback.print_exc()
            raise
            
        return response
    
    def _generate_thumbnail(self, submission):
        """サムネイル生成"""
        try:
            print(f"DEBUG: サムネイル生成開始 - 投稿ID: {submission.id}")
            print(f"DEBUG: 画像パス: {submission.image.path}")
            
            image = Image.open(submission.image.path)
            print(f"DEBUG: 画像サイズ: {image.size}")
            
            image.thumbnail((150, 150), Image.Resampling.LANCZOS)
            
            # サムネイル保存
            thumb_path = os.path.join(settings.MEDIA_ROOT, 'thumbnails', f'thumb_{submission.id}.jpg')
            os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
            image.save(thumb_path, 'JPEG', quality=85)
            
            submission.thumbnail = f'thumbnails/thumb_{submission.id}.jpg'
            submission.save()
            print(f"DEBUG: サムネイル生成完了: {submission.thumbnail}")
        except Exception as e:
            print(f"DEBUG: サムネイル生成エラー: {e}")
            import traceback
            traceback.print_exc()
    
    def _generate_watermark(self, submission):
        """透かし画像生成"""
        try:
            image = Image.open(submission.image.path)
            
            # 透かしテキストを追加
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(image)
            
            # フォントサイズを画像サイズに応じて調整
            font_size = max(20, min(image.width, image.height) // 20)
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            watermark_text = "世界一速いパンチ"
            text_bbox = draw.textbbox((0, 0), watermark_text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            
            # 透かしの位置（右下）
            x = image.width - text_width - 20
            y = image.height - text_height - 20
            
            # 半透明の背景
            overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
            overlay_draw = ImageDraw.Draw(overlay)
            overlay_draw.rectangle([x-5, y-5, x+text_width+5, y+text_height+5], 
                                 fill=(0, 0, 0, 128))
            
            # 透かしテキスト
            overlay_draw.text((x, y), watermark_text, fill=(255, 255, 255, 255), font=font)
            
            # 元画像に透かしを合成
            watermarked = Image.alpha_composite(image.convert('RGBA'), overlay)
            watermarked = watermarked.convert('RGB')
            
            # 透かし画像保存
            watermark_path = os.path.join(settings.MEDIA_ROOT, 'watermarked', f'watermark_{submission.id}.jpg')
            os.makedirs(os.path.dirname(watermark_path), exist_ok=True)
            watermarked.save(watermark_path, 'JPEG', quality=90)
            
            submission.watermarked_image = f'watermarked/watermark_{submission.id}.jpg'
            submission.save()
        except Exception as e:
            print(f"DEBUG: 透かし画像生成エラー: {e}")
            import traceback
            traceback.print_exc()


class SubmissionDetailView(generics.RetrieveAPIView):
    """投稿詳細ビュー"""
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [AllowAny]  # 認証不要
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class JudgmentCreateView(generics.CreateAPIView):
    """判定作成ビュー（管理者のみ）"""
    queryset = Judgment.objects.all()
    serializer_class = JudgmentSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        print(f"DEBUG: 判定エンドポイント開始 - ユーザー: {self.request.user}")
        
        # JWT認証により既に認証済み、IsAdminUserにより管理者権限も確認済み
        
        # 判定処理
        submission_id = self.kwargs['submission_id']
        print(f"DEBUG: 判定処理開始 - 投稿ID: {submission_id}")
        print(f"DEBUG: リクエストデータ: {self.request.data}")
        
        # セキュリティ強化：judge_nameをサーバー側で自動設定
        data = self.request.data.copy()
        if not data.get("judge_name"):
            user = self.request.user
            data["judge_name"] = getattr(user, "get_full_name", lambda: None)() or user.username or user.email
            print(f"DEBUG: judge_nameを自動設定: {data['judge_name']}")
        
        # metaphor_commentの必須チェック
        if not data.get("metaphor_comment"):
            print("DEBUG: metaphor_commentが必須です")
            from rest_framework import status
            from rest_framework.response import Response
            raise ValidationError({"metaphor_comment": ["この項目は必須です。"]})
        
        try:
            submission = get_object_or_404(Submission, id=submission_id)
            print(f"DEBUG: 投稿取得成功 - {submission.id}")
            
            # 既存の判定があるかチェック
            existing_judgment = Judgment.objects.filter(submission=submission).first()
            if existing_judgment:
                print(f"DEBUG: 既存の判定を更新 - 判定ID: {existing_judgment.id}")
                print(f"DEBUG: 更新前のrejection_reason: {existing_judgment.rejection_reason}")
                # 既存の判定を更新
                for key, value in data.items():
                    print(f"DEBUG: 設定中 - {key}: {value}")
                    setattr(existing_judgment, key, value)
                existing_judgment.save()
                judgment = existing_judgment
                print(f"DEBUG: 更新後のrejection_reason: {judgment.rejection_reason}")
                print(f"DEBUG: 既存判定更新成功 - {judgment.id}")
            else:
                print(f"DEBUG: 新しい判定を作成")
                # 新しい判定を作成
                judgment = serializer.save(submission=submission, **data)
                print(f"DEBUG: 新規判定データ保存成功 - {judgment.id}")
            
            # 判定結果に応じて処理
            if judgment.judgment == 'REJECTED':
                # 却下の場合は投稿を削除
                print(f"DEBUG: 投稿 {submission_id} を却下して削除します")
                
                # 却下通知を作成
                try:
                    Notification.objects.create(
                        user=submission.user,
                        type='REJECTION',
                        title='パンチ投稿が却下されました',
                        message=f'あなたのパンチ投稿が却下されました。理由: {judgment.rejection_reason}'
                    )
                    print(f"DEBUG: 却下通知作成成功")
                except Exception as e:
                    print(f"DEBUG: 却下通知作成エラー: {e}")
                
                # 判定データも削除
                judgment.delete()
                # 投稿を削除
                submission.delete()
                print(f"DEBUG: 却下処理完了")
            else:
                # 承認の場合は判定済みにマーク
                submission.is_judged = True
                submission.save()
                print(f"DEBUG: 投稿 {submission_id} を承認しました")
                
                # 承認通知を作成
                try:
                    Notification.objects.create(
                        user=submission.user,
                        type='APPROVAL',
                        title='パンチ投稿が承認されました',
                        message=f'あなたのパンチ投稿が承認されました！速度: {judgment.speed_kmh}km/h'
                    )
                    print(f"DEBUG: 承認通知作成成功")
                except Exception as e:
                    print(f"DEBUG: 承認通知作成エラー: {e}")
                
                print(f"DEBUG: 承認処理完了")
                
        except Exception as e:
            print(f"DEBUG: 判定処理エラー: {e}")
            print(f"DEBUG: エラータイプ: {type(e)}")
            import traceback
            print(f"DEBUG: トレースバック: {traceback.format_exc()}")
            raise e


class RankingListView(generics.ListAPIView):
    """ランキング一覧ビュー"""
    queryset = Ranking.objects.all()
    serializer_class = RankingSerializer
    permission_classes = [AllowAny]  # 認証不要


class NotificationListView(generics.ListAPIView):
    """通知一覧ビュー"""
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]  # 認証不要
    
    def get_queryset(self):
        # 認証されたユーザーまたはworld.fastest.punch@gmail.comのユーザーの通知を取得
        if self.request.user.is_authenticated:
            user = self.request.user
        else:
            user = User.objects.filter(email='world.fastest.punch@gmail.com').first()
            if not user:
                user, created = User.objects.get_or_create(
                    username='world.fastest.punch@gmail.com',
                    defaults={'email': 'world.fastest.punch@gmail.com'}
                )
        return Notification.objects.filter(user=user)


class NotificationMarkReadView(generics.UpdateAPIView):
    """通知既読マークビュー"""
    serializer_class = NotificationSerializer
    permission_classes = [AllowAny]  # 認証不要に設定
    
    def get_queryset(self):
        # 認証されたユーザーまたはworld.fastest.punch@gmail.comのユーザーの通知を取得
        if self.request.user.is_authenticated:
            user = self.request.user
        else:
            user = User.objects.filter(email='world.fastest.punch@gmail.com').first()
            if not user:
                user, created = User.objects.get_or_create(
                    username='world.fastest.punch@gmail.com',
                    defaults={'email': 'world.fastest.punch@gmail.com'}
                )
        return Notification.objects.filter(user=user)
    
    def patch(self, request, *args, **kwargs):
        try:
            notification = self.get_object()
            notification.is_read = True
            notification.save()
            print(f"DEBUG: 通知 {notification.id} を既読にしました")
            return Response({'status': 'success'})
        except Exception as e:
            print(f"DEBUG: 通知既読エラー: {e}")
            return Response({'error': str(e)}, status=400)


class ReportCreateView(generics.CreateAPIView):
    """通報作成ビュー"""
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    
    def perform_create(self, serializer):
        submission_id = self.kwargs['submission_id']
        submission = get_object_or_404(Submission, id=submission_id)
        
        # テスト用のデフォルトユーザー
        reporter, created = User.objects.get_or_create(
            username='reporter_user',
            defaults={'email': 'reporter@example.com'}
        )
        
        serializer.save(submission=submission, reporter=reporter)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_submissions(request):
    """管理者用投稿一覧"""
    submissions = Submission.objects.all().order_by('-created_at')
    serializer = SubmissionSerializer(submissions, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_reports(request):
    """管理者用通報一覧"""
    reports = Report.objects.filter(is_resolved=False).order_by('-created_at')
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])
def user_profile(request):
    """ユーザープロフィール取得・更新"""
    try:
        # 認証されたユーザーを取得
        if request.user.is_authenticated:
            user = request.user
        else:
            # 認証されていない場合は、world.fastest.punch@gmail.comのユーザーを取得
            user = User.objects.filter(email='world.fastest.punch@gmail.com').first()
            if not user:
                # ユーザーが存在しない場合は作成
                user = User.objects.create_user(
                    username='world.fastest.punch@gmail.com',
                    email='world.fastest.punch@gmail.com'
                )
        
        # プロフィールを取得または作成
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        if request.method == 'GET':
            serializer = UserProfileSerializer(profile, context={'request': request})
            data = serializer.data
            # ユーザー情報も含める
            data['username'] = user.username
            data['email'] = user.email
            return Response(data)
        
        elif request.method == 'PUT':
            try:
                print(f"DEBUG: PUT request data: {request.data}")
                print(f"DEBUG: Current user: {user.username} (ID: {user.id})")
                
                # ユーザー情報の更新
                if 'username' in request.data:
                    new_username = request.data['username']
                    print(f"DEBUG: Username update - current: '{user.username}', new: '{new_username}'")
                    # ユーザー名が変更されている場合のみチェック
                    if new_username != user.username:
                        print(f"DEBUG: Username is changing, checking for duplicates...")
                        # ユーザー名の重複チェック
                        existing_user = User.objects.filter(username=new_username).exclude(id=user.id).first()
                        if existing_user:
                            print(f"DEBUG: Username conflict found: {existing_user.username} (ID: {existing_user.id})")
                            return Response({'error': 'このユーザー名は既に使用されています。'}, status=status.HTTP_400_BAD_REQUEST)
                        print(f"DEBUG: Username is unique, updating...")
                        user.username = new_username
                        user.save()
                        print(f"DEBUG: Username updated successfully")
                
                if 'email' in request.data:
                    new_email = request.data['email']
                    print(f"DEBUG: Email update - current: '{user.email}', new: '{new_email}'")
                    # メールアドレスが変更されている場合のみチェック
                    if new_email != user.email:
                        print(f"DEBUG: Email is changing, checking for duplicates...")
                        # メールアドレスの重複チェック
                        existing_user = User.objects.filter(email=new_email).exclude(id=user.id).first()
                        if existing_user:
                            print(f"DEBUG: Email conflict found: {existing_user.email} (ID: {existing_user.id})")
                            return Response({'error': 'このメールアドレスは既に使用されています。'}, status=status.HTTP_400_BAD_REQUEST)
                        print(f"DEBUG: Email is unique, updating...")
                        user.email = new_email
                        user.save()
                        print(f"DEBUG: Email updated successfully")
                
                # プロフィール情報の更新
                print(f"DEBUG: Updating profile with data: {request.data}")
                serializer = UserProfileSerializer(profile, data=request.data, context={'request': request})
                if serializer.is_valid():
                    print(f"DEBUG: Serializer is valid, saving...")
                    serializer.save()
                    data = serializer.data
                    # 更新されたユーザー情報も含める
                    data['username'] = user.username
                    data['email'] = user.email
                    print(f"DEBUG: Profile updated successfully: {data}")
                    return Response(data)
                else:
                    print(f"DEBUG: Serializer errors: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print(f"DEBUG: Error in PUT request: {e}")
                import traceback
                traceback.print_exc()
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)