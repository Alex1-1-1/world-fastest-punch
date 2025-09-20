from rest_framework import serializers
from .models import Submission, Judgment, Ranking, Report, UserProfile, Notification


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

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None

    def get_watermarked_image(self, obj):
        if obj.watermarked_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.watermarked_image.url)
            return obj.watermarked_image.url
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
            request = self.context.get('request')
            if request:
                # 本番環境ではHTTPSを使用
                base_url = request.build_absolute_uri('/')
                if base_url.startswith('https://'):
                    return f"https://world-fastest-punch.onrender.com{obj.profile_image.url}"
                else:
                    return request.build_absolute_uri(obj.profile_image.url)
            # リクエストがない場合は絶対URLを構築
            return f"https://world-fastest-punch.onrender.com{obj.profile_image.url}"
        return None
    
    def update(self, instance, validated_data):
        # プロフィール画像の処理
        if 'profile_image' in self.initial_data:
            profile_image = self.initial_data['profile_image']
            if profile_image:
                instance.profile_image = profile_image
        
        # その他のフィールドを更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
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
