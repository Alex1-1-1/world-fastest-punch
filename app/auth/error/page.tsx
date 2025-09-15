'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'サーバー設定に問題があります。';
      case 'AccessDenied':
        return 'アクセスが拒否されました。';
      case 'Verification':
        return '認証に失敗しました。';
      default:
        return '認証中にエラーが発生しました。';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              ログインページに戻る
            </Link>
          </div>
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-orange-600 hover:text-orange-500"
            >
              ホームページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
