from rest_framework import serializers
from .models import Submission, Judgment, Ranking, Report, UserProfile, Notification
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

# Cloudinary用のインポート
if settings.USE_CLOUDINARY:
    from cloudinary.utils import cloudinary_url


class SubmissionSerializer(serializers.ModelSerializer):
    """投稿シリアライザー"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    judgment = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    watermarked_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Submission
        fields = [
            'id', 'user_username', 'image', 'thumbnail', 
            'watermarked_image', 'description', 'is_judged', 'created_at', 'judgment'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def _safe_url(self, f):
        """CloudinaryResource/File から安全に URL を取り出す"""
        if not f:
            return None
        try:
            url = f.url       # Cloudinary も Django File もここが最も互換性が高い
        except Exception:
            return None
        # Cloudinary は絶対URL、ローカルは /media/... の相対URL
        if url and url.startswith('http'):
            return url
        req = self.context.get('request')
        return req.build_absolute_uri(url) if (req and url) else url

    def get_image(self, obj):
        return self._safe_url(obj.image)

    def get_thumbnail(self, obj):
        return self._safe_url(obj.thumbnail)

    def get_watermarked_image(self, obj):
        return self._safe_url(obj.watermarked_image)

    def get_judgment(self, obj):
        try:
            judgment = obj.judgment  # ここで存在しないと例外が出る
        except ObjectDoesNotExist:
            return None
        # 存在する場合のみシリアライズ
        return JudgmentSerializer(judgment).data


class JudgmentSerializer(serializers.ModelSerializer):
    """判定シリアライザー"""
    submission_id = serializers.IntegerField(source='submission.id', read_only=True)
    judge_name = serializers.CharField(read_only=True)  # サーバー側で自動設定
    
    class Meta:
        model = Judgment
        fields = [
            'id', 'submission_id', 'judgment', 'speed_kmh', 'metaphor_comment',
            'detailed_comment', 'rejection_reason', 'judge_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'judge_name']


class RankingSerializer(serializers.ModelSerializer):
    """ランキングシリアライザー"""
    submission = SubmissionSerializer(read_only=True)
    
    class Meta:
        model = Ranking
        fields = [
            'id', 'submission', 'ranking_type', 'rank', 
            'speed_kmh', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    """通報シリアライザー"""
    submission_id = serializers.IntegerField(source='submission.id', read_only=True)
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'submission_id', 'reporter_username', 'reason',
            'description', 'is_resolved', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """ユーザープロフィールシリアライザー"""
    profile_image = serializers.SerializerMethodField()
    role = serializers.CharField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['profile_image', 'bio', 'role', 'created_at', 'updated_at']
        read_only_fields = ['role', 'created_at', 'updated_at']
    
    def get_profile_image(self, obj):
        if obj.profile_image:
            # CloudinaryFieldは自動的に絶対URLを返す
            url = obj.profile_image.url
            print(f"DEBUG: Cloudinary image URL: {url}")
            return url
        print("DEBUG: No profile image found")
        return None
    
    def update(self, instance, validated_data):
        print(f"DEBUG: Serializer update - initial_data keys: {list(self.initial_data.keys())}")
        
        # プロフィール画像の処理
        if 'profile_image' in self.initial_data:
            profile_image = self.initial_data['profile_image']
            print(f"DEBUG: Profile image received - type: {type(profile_image)}")
            if profile_image:
                print(f"DEBUG: Setting profile image: {profile_image}")
                instance.profile_image = profile_image
                print(f"DEBUG: After setting - instance.profile_image: {instance.profile_image}")
        
        # その他のフィールドを更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        print(f"DEBUG: After save - profile_image URL: {instance.profile_image.url if instance.profile_image else 'None'}")
        return instance


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """投稿作成用シリアライザー"""
    
    class Meta:
        model = Submission
        fields = ['image', 'description']
    
    def to_representation(self, instance):
        """作成後に完全なデータを返す"""
        return SubmissionSerializer(instance, context=self.context).data
    
    def validate_image(self, value):
        # 画像サイズのバリデーション
        if value.size > 2 * 1024 * 1024:  # 2MB
            raise serializers.ValidationError("画像サイズは2MB以下にしてください。")
        
        # 画像形式のバリデーション
        allowed_formats = ['JPEG', 'PNG', 'TIFF', 'JPG']
        try:
            # PIL Imageを使用して形式を取得
            from PIL import Image
            image = Image.open(value)
            format_name = image.format
            if format_name not in allowed_formats:
                raise serializers.ValidationError(f"対応形式は {', '.join(allowed_formats)} のみです。")
        except Exception as e:
            # 形式が取得できない場合は、ファイル拡張子で判定
            file_name = value.name.lower()
            if not any(file_name.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.tiff', '.tif']):
                raise serializers.ValidationError(f"対応形式は {', '.join(allowed_formats)} のみです。")
        
        return value


class NotificationSerializer(serializers.ModelSerializer):
    """通知シリアライザー"""
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'created_at']
