'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chrome, Apple, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        // 新規登録
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
        const response = await fetch(`${API_BASE}/api/auth/register/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            username: formData.email,
          }),
        });

        if (response.ok) {
          alert('アカウントが作成されました。ログインしてください。');
          setIsSignUp(false);
          setFormData({ email: '', password: '' });
        } else {
          const errorData = await response.json();
          alert(`登録に失敗しました: ${errorData.error || '不明なエラー'}`);
        }
      } else {
        // ログイン
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        });
        
        if (result?.error) {
          alert('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
        } else {
          // URLパラメータからコールバックURLを取得
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl') || '/app';
          window.location.href = callbackUrl;
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert(isSignUp ? '登録に失敗しました。' : 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/app' });
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('apple', { callbackUrl: '/app' });
    } catch (error) {
      console.error('Apple sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      alert('メールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const response = await fetch(`${API_BASE}/api/auth/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`パスワードがリセットされました。新しいパスワード: ${data.new_password}\n\n（開発環境のため、本番ではメールで送信されます）`);
        setShowPasswordReset(false);
        setResetEmail('');
      } else {
        const errorData = await response.json();
        alert(`エラー: ${errorData.error || 'パスワードリセットに失敗しました'}`);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      alert('パスワードリセットに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🥊</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">世界一速いパンチ</h2>
          <p className="text-gray-600">アカウントにログインして投稿を開始しましょう</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold">
              {isSignUp ? '新規登録' : 'ログイン'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* メール/パスワードログイン */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    placeholder="パスワードを入力"
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
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isLoading ? 'ログイン中...' : (isSignUp ? '新規登録' : 'ログイン')}
              </Button>
            </form>

            {/* パスワードリセットリンク */}
            {!isSignUp && (
              <div className="text-center">
                <button
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  パスワードを忘れた場合
                </button>
              </div>
            )}

            {/* 区切り線 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>

            {/* ソーシャルログイン */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Chrome className="h-5 w-5 mr-2" />
              {isLoading ? 'ログイン中...' : 'Googleでログイン'}
            </Button>

            <Button
              onClick={handleAppleSignIn}
              disabled={isLoading}
              variant="outline"
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Apple className="h-5 w-5 mr-2" />
              {isLoading ? 'ログイン中...' : 'Appleでログイン'}
            </Button>

            {/* ログイン/新規登録切り替え */}
            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : 'アカウントをお持ちでない方はこちら'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                ログインすることで、
                <a href="#" className="text-blue-600 hover:text-blue-500">利用規約</a>
                および
                <a href="#" className="text-blue-600 hover:text-blue-500">プライバシーポリシー</a>
                に同意したものとみなされます。
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない場合は、上記のボタンから新規登録できます。
          </p>
        </div>
      </div>

      {/* パスワードリセットモーダル */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center">パスワードリセット</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="resetEmail"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setResetEmail('');
                    }}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {isLoading ? '送信中...' : '送信'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}