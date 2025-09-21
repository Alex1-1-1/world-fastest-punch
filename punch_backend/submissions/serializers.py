from rest_framework import serializers
from .models import Submission, Judgment, Ranking, Report, UserProfile, Notification
from django.conf import settings

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

    def _public_id(self, fieldfile):
        """CloudinaryFieldからpublic_idを取得"""
        if not fieldfile:
            return None
        # CloudinaryFieldの場合、nameからpublic_idを推測
        # 例: "submissions/abcd1234.jpg" -> "submissions/abcd1234"
        name = getattr(fieldfile, "name", "")
        if name:
            return name.rsplit(".", 1)[0]
        return None

    def get_image(self, obj):
        if not obj.image:
            return None
        
        if settings.USE_CLOUDINARY:
            # Cloudinaryの動的URL生成
            public_id = self._public_id(obj.image)
            if public_id:
                url, _ = cloudinary_url(public_id, secure=True)
                print(f"DEBUG: Cloudinary image URL: {url}")
                return url
        else:
            # ローカルファイルの場合
            url = obj.image.url
            print(f"DEBUG: Local image URL: {url}")
            return url
        return None

    def get_thumbnail(self, obj):
        if not obj.image:
            return None
        
        if settings.USE_CLOUDINARY:
            # Cloudinaryの動的サムネイル生成
            public_id = self._public_id(obj.image)
            if public_id:
                url, _ = cloudinary_url(
                    public_id,
                    secure=True,
                    transformation=[{
                        "width": 600, 
                        "height": 600, 
                        "crop": "fill", 
                        "gravity": "auto"
                    }],
                    format="jpg",
                )
                print(f"DEBUG: Cloudinary thumbnail URL: {url}")
                return url
        else:
            # ローカルファイルの場合
            if obj.thumbnail:
                url = obj.thumbnail.url
                print(f"DEBUG: Local thumbnail URL: {url}")
                return url
            elif obj.image:
                url = obj.image.url
                print(f"DEBUG: Using main image as thumbnail: {url}")
                return url
        return None

    def get_watermarked_image(self, obj):
        if not obj.image:
            return None
        
        if settings.USE_CLOUDINARY:
            # Cloudinaryの動的透かし画像生成
            public_id = self._public_id(obj.image)
            if public_id:
                url, _ = cloudinary_url(
                    public_id,
                    secure=True,
                    transformation=[
                        {"quality": "auto", "fetch_format": "auto"},
                        # 透かしロゴ（例：右下に配置）
                        {
                            "overlay": "watermark_logo",  # Cloudinaryにアップロードした透かしロゴ名
                            "gravity": "south_east", 
                            "x": 20, 
                            "y": 20, 
                            "opacity": 60, 
                            "width": 120
                        }
                    ],
                    format="jpg",
                )
                print(f"DEBUG: Cloudinary watermarked URL: {url}")
                return url
        else:
            # ローカルファイルの場合
            if obj.watermarked_image:
                url = obj.watermarked_image.url
                print(f"DEBUG: Local watermarked URL: {url}")
                return url
            elif obj.image:
                url = obj.image.url
                print(f"DEBUG: Using main image as watermarked: {url}")
                return url
        return None

    def get_judgment(self, obj):
        if hasattr(obj, 'judgment') and obj.judgment:
            return JudgmentSerializer(obj.judgment).data
        return None


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
