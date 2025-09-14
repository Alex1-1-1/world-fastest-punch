from django.contrib import admin
from .models import Submission, Judgment, Ranking, Report


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'is_judged', 'created_at']
    list_filter = ['is_judged', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Judgment)
class JudgmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'submission', 'speed_kmh', 'judge_name', 'created_at']
    list_filter = ['created_at']
    search_fields = ['submission__user__username', 'judge_name']


@admin.register(Ranking)
class RankingAdmin(admin.ModelAdmin):
    list_display = ['id', 'submission', 'ranking_type', 'rank', 'speed_kmh']
    list_filter = ['ranking_type', 'created_at']
    search_fields = ['submission__user__username']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'submission', 'reporter', 'reason', 'is_resolved', 'created_at']
    list_filter = ['reason', 'is_resolved', 'created_at']
    search_fields = ['submission__user__username', 'reporter__username']