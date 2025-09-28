'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Zap, Target, Clock, Play, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GameHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartGame = () => {
    setIsLoading(true);
    // 2秒後にメインゲーム画面に遷移
    setTimeout(() => {
      router.push('/app');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 relative overflow-hidden">
      {/* 背景エフェクト */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-red-200 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-orange-300 rounded-full opacity-20 animate-bounce"></div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* ロゴとタイトル */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Trophy className="h-20 w-20 text-orange-500 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <Zap className="h-8 w-8 text-yellow-500 animate-bounce" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 mb-4 animate-pulse">
            世界一速いパンチ
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 font-bold mb-2">
            SPEED PUNCH CHAMPIONSHIP
          </p>
          <p className="text-lg text-gray-600">
            あなたのパンチの速さを世界に証明しよう！
          </p>
        </div>


        {/* ゲーム説明 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-12 max-w-4xl border-2 border-orange-200 shadow-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            🥊 ゲームのルール
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 rounded-full p-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">1. パンチを記録</h3>
                <p className="text-gray-600">カメラでパンチのイラストを撮影して投稿</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-red-100 rounded-full p-3">
                <Target className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">2. 速度を測定</h3>
                <p className="text-gray-600">専門の管理者が速度をkm/hで判定</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">3. ランキングで競争</h3>
                <p className="text-gray-600">他のプレイヤーと速さを競い合う</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-3">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">4. 世界記録に挑戦</h3>
                <p className="text-gray-600">最速のパンチで歴史に名を刻む</p>
              </div>
            </div>
          </div>
        </div>

        {/* スタートボタン */}
        <div className="text-center">
          <Button
            onClick={handleStartGame}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 hover:from-orange-600 hover:via-red-600 hover:to-yellow-600 text-white text-2xl font-bold px-12 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-4 border-white"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span>ゲームを開始中...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Play className="h-8 w-8" />
                <span>パンチを開始！</span>
                <Zap className="h-8 w-8 animate-pulse" />
              </div>
            )}
          </Button>
          
          <p className="text-gray-600 mt-4 text-lg">
            {isLoading ? '準備中...' : 'クリックして世界一速いパンチに挑戦！'}
          </p>
        </div>

        {/* 戻るボタン */}
        <div className="mt-8">
          <Link href="/">
            <Button variant="outline" className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400">
              トップページに戻る
            </Button>
          </Link>
        </div>
      </div>

      {/* フッター */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500">
          © 2025 世界一速いパンチ - ゲームモード
        </p>
      </div>
    </div>
  );
}
