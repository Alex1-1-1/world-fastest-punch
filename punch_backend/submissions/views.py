from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
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
from django.conf import settings


@api_view(['POST'])
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

        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def register_user(request):
    """新規ユーザー登録"""
    try:
        data = request.data
        email = data.get('email')
        password = data.get('password')
        username = data.get('username', email)

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # メールアドレスの重複チェック
        if User.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # ユーザー名の重複チェック
        if User.objects.filter(username=username).exists():
            return Response({'error': 'User with this username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        # ユーザー作成
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=True
        )

        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def reset_password(request):
    """パスワードリセット（開発用簡易版）"""
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

        # 新しいパスワードを生成（開発用）
        new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        user.set_password(new_password)
        user.save()

        # 開発環境ではコンソールに出力（本番ではメール送信）
        print(f"Password reset for {email}: {new_password}")
        
        return Response({
            'message': 'Password reset successfully',
            'new_password': new_password,  # 開発用：本番では削除
            'note': 'This is a development environment. In production, this would be sent via email.'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmissionListCreateView(generics.ListCreateAPIView):
    """投稿一覧・作成ビュー"""
    queryset = Submission.objects.all()
    parser_classes = [MultiPartParser, FormParser]
    
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
        
        # サムネイルと透かし画像の生成
        submission = serializer.instance
        self._generate_thumbnail(submission)
        self._generate_watermark(submission)
    
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
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class JudgmentCreateView(generics.CreateAPIView):
    """判定作成ビュー"""
    queryset = Judgment.objects.all()
    serializer_class = JudgmentSerializer
    
    def perform_create(self, serializer):
        submission_id = self.kwargs['submission_id']
        print(f"DEBUG: 判定処理開始 - 投稿ID: {submission_id}")
        print(f"DEBUG: リクエストデータ: {self.request.data}")
        
        try:
            submission = get_object_or_404(Submission, id=submission_id)
            print(f"DEBUG: 投稿取得成功 - {submission.id}")
            
            # 判定データを保存
            judgment = serializer.save(submission=submission)
            print(f"DEBUG: 判定データ保存成功 - {judgment.id}")
            
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


class NotificationListView(generics.ListAPIView):
    """通知一覧ビュー"""
    serializer_class = NotificationSerializer
    
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
def admin_submissions(request):
    """管理者用投稿一覧"""
    submissions = Submission.objects.all().order_by('-created_at')
    serializer = SubmissionSerializer(submissions, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def admin_reports(request):
    """管理者用通報一覧"""
    reports = Report.objects.filter(is_resolved=False).order_by('-created_at')
    serializer = ReportSerializer(reports, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
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