"""
Django settings for punch_backend project.
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',')

# 画像ストレージ設定
USE_CLOUDINARY = bool(os.environ.get("CLOUDINARY_URL"))
print(f"DEBUG: USE_CLOUDINARY = {USE_CLOUDINARY}")
print(f"DEBUG: CLOUDINARY_URL = {os.environ.get('CLOUDINARY_URL', 'NOT_SET')}")
print(f"DEBUG: All environment variables: {dict(os.environ)}")

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'submissions',
]

# Cloudinary設定（本番環境のみ）
if USE_CLOUDINARY:
    INSTALLED_APPS += [
        'cloudinary',
        'cloudinary_storage',
    ]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'punch_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'punch_backend.wsgi.application'

# Database
if os.environ.get('DATABASE_URL'):
    # Render.com PostgreSQL設定
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }
else:
    # ローカル開発用SQLite設定
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ja'
TIME_ZONE = 'Asia/Tokyo'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
if USE_CLOUDINARY:
    # Cloudinaryを使用する場合
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
    MEDIA_URL = "/media/"  # 任意（Cloudinaryは絶対URLを返してくれます）
    print("DEBUG: Using Cloudinary for media storage")
    print(f"DEBUG: DEFAULT_FILE_STORAGE = {DEFAULT_FILE_STORAGE}")
    print(f"DEBUG: MEDIA_URL = {MEDIA_URL}")
else:
    # ローカルファイルシステムを使用する場合
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
    print("DEBUG: Using local filesystem for media storage")
    print(f"DEBUG: MEDIA_URL = {MEDIA_URL}")
    print(f"DEBUG: MEDIA_ROOT = {MEDIA_ROOT}")

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://世界最速パンチ.vercel.app",
    "https://alex1-1-1s-projects.vercel.app",
    "https://world-fastest-punch-b1ndmhr49-alex1-1-1s-projects.vercel.app",
    "https://world-fastest-punch-3eazimi5s-alex1-1-1s-projects.vercel.app",
    "https://world-fastest-punch.vercel.app",
    "https://world-fastest-punch-backend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["authorization", "content-type"]
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]

# VercelのデプロイメントURLパターンを許可
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"https://.*\.vercel\.app$",
    r"https://.*\.alex1-1-1s-projects\.vercel\.app$",
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# メール設定 - Resendを使用
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', 're_CVAkCM5B_DMF54gzLsw7cHCedFy5n8DYQ')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'world.fastest.punch.kanri@gmail.com')

# Security settings for production
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# Static files storage
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 認証バックエンド設定（メールアドレスでログイン可能にする）
AUTHENTICATION_BACKENDS = [
    'submissions.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]