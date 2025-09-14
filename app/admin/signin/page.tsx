'use client';

import { signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminSignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });
      
      if (result?.error) {
        alert('ログインに失敗しました。\n\n管理者権限のあるアカウントでログインしてください。\n不正なアクセス試行は記録されています。');
      } else {
        // 管理者権限をチェック
        const response = await fetch('http://localhost:8000/api/profile/');
        if (response.ok) {
          const profile = await response.json();
          if (profile.role === 'ADMIN') {
            // 管理者ダッシュボードに同じタブ内で遷移
            router.push('/admin/dashboard');
          } else {
            alert('管理者権限がありません。\n\n管理者アカウントでログインしてください。\n不正なアクセス試行は記録されています。');
            await signOut({ callbackUrl: '/admin/signin' });
          }
        } else {
          alert('プロフィール情報の取得に失敗しました。');
        }
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      alert('ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">管理者ダッシュボード</h1>
          <p className="text-gray-600 text-lg">管理者権限でログインしてください</p>
        </div>

        {/* ログインカード */}
        <Card className="shadow-2xl border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
            <CardTitle className="text-center text-2xl font-bold text-red-800 flex items-center justify-center">
              <Shield className="h-6 w-6 mr-2" />
              管理者ログイン
            </CardTitle>
            <p className="text-center text-sm text-red-600 mt-2">
              管理者権限を持つアカウントのみアクセス可能です
            </p>
            <div className="mt-3 flex justify-center">
              <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-1">
                <span className="text-xs font-medium text-red-800">
                  🔒 セキュリティ保護されたエリア - 管理者専用
                </span>
              </div>
            </div>
            <div className="mt-2 flex justify-center">
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-1">
                <span className="text-xs font-medium text-yellow-800">
                  ⚠️ 不正アクセスは記録・監視されます
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleAdminSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  管理者メールアドレス
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12 text-lg border-2 focus:border-red-500"
                    placeholder="管理者メールアドレスを入力"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  管理者パスワード
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12 text-lg border-2 focus:border-red-500"
                    placeholder="管理者パスワードを入力"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ログイン中...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Shield className="h-5 w-5 mr-2" />
                    管理者としてログイン
                  </div>
                )}
              </Button>
            </form>


            {/* セキュリティ注意事項 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    セキュリティ警告
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>管理者権限を持つアカウントのみアクセス可能です</strong></li>
                      <li>不正なアクセス試行はすべて記録・監視されます</li>
                      <li>ログイン後は必ず適切にログアウトしてください</li>
                      <li>この画面は管理者専用のセキュリティ保護されたエリアです</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 開発環境用リンク（本番環境では非表示） */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-2">開発環境用</p>
                  <Link 
                    href="/admin/signin/dev-credentials.md"
                    target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    管理者アカウント情報を確認
                  </Link>
                </div>
              </div>
            )}

            {/* 戻るリンク */}
            <div className="text-center pt-4 border-t border-gray-200">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                一般ユーザーサイトに戻る
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* フッター */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 世界一速いパンチ - 管理者ダッシュボード
          </p>
        </div>
      </div>
    </div>
  );
}
