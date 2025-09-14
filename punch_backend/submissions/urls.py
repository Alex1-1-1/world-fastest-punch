from django.urls import path
from . import views

urlpatterns = [
    # 認証関連
    path('auth/sync-user/', views.sync_user, name='sync-user'),
    path('auth/login/', views.login_user, name='login-user'),
    path('auth/register/', views.register_user, name='register-user'),
    path('auth/reset-password/', views.reset_password, name='reset-password'),
    
    # 投稿関連
    path('submissions/', views.SubmissionListCreateView.as_view(), name='submission-list-create'),
    path('submissions/<int:pk>/', views.SubmissionDetailView.as_view(), name='submission-detail'),
    
    # 判定関連
    path('submissions/<int:submission_id>/judge/', views.JudgmentCreateView.as_view(), name='judgment-create'),
    
    # ランキング関連
    path('ranking/', views.RankingListView.as_view(), name='ranking-list'),
    
    # 通報関連
    path('submissions/<int:submission_id>/report/', views.ReportCreateView.as_view(), name='report-create'),
    
    # 管理者用
    path('admin/submissions/', views.admin_submissions, name='admin-submissions'),
    path('admin/reports/', views.admin_reports, name='admin-reports'),
    
    # プロフィール関連
    path('profile/', views.user_profile, name='user-profile'),
    
    # 通知関連
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
]
