from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from mobile_auth.views import MobileJWTLoginView, MobileJWTRegisterView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('submissions.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # iOS専用のJWT認証エンドポイント
    path('api/auth/jwt/login/', MobileJWTLoginView.as_view(), name='mobile_jwt_login'),
    path('api/auth/jwt/register/', MobileJWTRegisterView.as_view(), name='mobile_jwt_register'),
]

# メディアファイルの配信設定（本番環境でも有効にする）
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)