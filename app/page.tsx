import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Camera, Users, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-orange-500 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">世界一速いパンチ</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/admin/signin">
                <Button variant="outline" className="text-gray-600 hover:text-gray-900 border-gray-300 hover:border-gray-400">
                  管理者用
                </Button>
              </Link>
              <Link href="/game">
                <Button variant="outline" className="border-gray-300 hover:border-gray-400">アプリを試す</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            あなたのパンチの速さを
            <span className="text-orange-500">競い合おう</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            世界一速いパンチアプリで、あなたのパンチのイラストを投稿し、
            他のユーザーと速さを競い合いましょう！
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              <Camera className="mr-2 h-5 w-5" />
              アプリをダウンロード
            </Button>
            <Link href="/game">
              <Button size="lg" variant="outline">
                <Users className="mr-2 h-5 w-5" />
                アプリを試す
              </Button>
            </Link>
          </div>
        </div>

        {/* 機能紹介 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Camera className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>パンチ投稿</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                あなたのパンチのイラストを写真で撮影して投稿できます
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Trophy className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>速度判定</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                専門の管理者が速度を判定し、km/hで表示されます
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>ランキング</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                速度別にランキングを作成し、競い合えます
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>安全な環境</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                不適切なコンテンツは厳重に管理されています
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* アプリの特徴 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">アプリの特徴</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold mb-4">📱 モバイルアプリ</h4>
              <p className="text-gray-600 mb-6">
                iOSアプリで簡単にパンチのイラストを撮影・投稿できます。
                直感的なUIで誰でも簡単に使用できます。
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">🎯 正確な判定</h4>
              <p className="text-gray-600 mb-6">
                専門の管理者が各投稿を慎重に判定し、
                正確な速度をkm/hで表示します。
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">🏆 ランキング機能</h4>
              <p className="text-gray-600 mb-6">
                速度別にカテゴリ分けされたランキングで、
                他のユーザーと競い合えます。
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">🔒 安全な環境</h4>
              <p className="text-gray-600 mb-6">
                不適切なコンテンツの投稿は禁止されており、
                安全で楽しい環境を提供します。
              </p>
            </div>
          </div>
        </div>

        {/* ダウンロードセクション */}
        <div className="text-center bg-orange-500 text-white rounded-lg p-12">
          <h3 className="text-3xl font-bold mb-4">今すぐ始めよう！</h3>
          <p className="text-xl mb-8">
            あなたのパンチの速さを世界に披露しませんか？
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Camera className="mr-2 h-5 w-5" />
              App Storeでダウンロード
            </Button>
            <Button size="lg" variant="secondary">
              <Users className="mr-2 h-5 w-5" />
              Google Playでダウンロード
            </Button>
            <Link href="/game">
              <Button size="lg" variant="secondary">
                <Trophy className="mr-2 h-5 w-5" />
                Webで試す
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Trophy className="h-6 w-6 text-orange-500 mr-2" />
              <span className="text-xl font-bold">世界一速いパンチ</span>
            </div>
            <p className="text-gray-400 mb-4">
              あなたのパンチの速さを競い合うアプリ
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link>
              <Link href="/terms" className="hover:text-white">利用規約</Link>
              <Link href="/contact" className="hover:text-white">お問い合わせ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
