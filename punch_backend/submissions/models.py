from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class UserProfile(models.Model):
    """ユーザープロフィールモデル"""
    ROLE_CHOICES = [
        ('USER', '一般ユーザー'),
        ('JUDGE', '判定者'),
        ('ADMIN', '管理者'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    profile_image_base64 = models.TextField(blank=True, null=True, help_text="Base64エンコードされたプロフィール画像")
    bio = models.TextField(max_length=500, blank=True, help_text="自己紹介")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER', help_text="ユーザー権限")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Profile for {self.user.username}"


class Submission(models.Model):
    """パンチの投稿モデル"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    image = models.ImageField(upload_to='submissions/')
    thumbnail = models.ImageField(upload_to='thumbnails/', blank=True, null=True)
    watermarked_image = models.ImageField(upload_to='watermarked/', blank=True, null=True)
    description = models.TextField(max_length=500, blank=True, help_text="投稿の説明文")
    is_judged = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False, help_text="却下されたかどうか")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Submission {self.id} by {self.user.username}"


class Judgment(models.Model):
    """判定モデル"""
    JUDGMENT_CHOICES = [
        ('APPROVED', '承認'),
        ('REJECTED', '却下'),
    ]
    
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE, related_name='judgment')
    judgment = models.CharField(max_length=10, choices=JUDGMENT_CHOICES, default='APPROVED', help_text="判定結果")
    speed_kmh = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(1000)],
        help_text="速度 (km/h)",
        null=True,
        blank=True
    )
    metaphor_comment = models.TextField(max_length=500, help_text="例えコメント")
    detailed_comment = models.TextField(max_length=1000, blank=True, help_text="詳細コメント")
    rejection_reason = models.CharField(max_length=200, blank=True, help_text="却下理由")
    judge_name = models.CharField(max_length=100, help_text="判定者名")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Judgment for {self.submission.id}: {self.speed_kmh}km/h"


class Ranking(models.Model):
    """ランキングモデル"""
    RANKING_TYPES = [
        ('weekly', '週間'),
        ('monthly', '月間'),
        ('all_time', '全期間'),
    ]

    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='rankings')
    ranking_type = models.CharField(max_length=20, choices=RANKING_TYPES)
    rank = models.PositiveIntegerField()
    speed_kmh = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ranking_type', 'rank']
        unique_together = ['ranking_type', 'rank']

    def __str__(self):
        return f"{self.get_ranking_type_display()} #{self.rank}: {self.speed_kmh}km/h"


class Report(models.Model):
    """通報モデル"""
    REPORT_REASONS = [
        ('inappropriate', '不適切な内容'),
        ('spam', 'スパム'),
        ('harassment', 'ハラスメント'),
        ('violence', '暴力表現'),
        ('other', 'その他'),
    ]

    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=20, choices=REPORT_REASONS)
    description = models.TextField(max_length=500, blank=True, help_text="詳細説明")
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report for {self.submission.id}: {self.get_reason_display()}"


class Notification(models.Model):
    """通知モデル"""
    NOTIFICATION_TYPES = [
        ('REJECTION', '却下通知'),
        ('APPROVAL', '承認通知'),
        ('RANKING', 'ランキング通知'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"