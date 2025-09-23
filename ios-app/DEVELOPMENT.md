# iOSアプリ開発ガイド

## 開発環境のセットアップ

### 必要な環境
- Xcode 15.0以上
- iOS 16.0以上
- Swift 5.9以上

### プロジェクトの開き方
1. Xcodeを起動
2. "Open a project or file"を選択
3. `ios-app`フォルダを選択
4. `Package.swift`を開く

## プロジェクト構造

```
ios-app/
├── Sources/
│   └── WorldFastestPunch/
│       ├── Models/           # データモデル
│       │   ├── User.swift
│       │   └── Submission.swift
│       ├── Services/         # APIサービス
│       │   └── APIService.swift
│       ├── Views/            # UI画面
│       │   ├── AuthView.swift
│       │   ├── GalleryView.swift
│       │   ├── SubmissionView.swift
│       │   ├── RankingView.swift
│       │   └── ProfileView.swift
│       ├── WorldFastestPunchApp.swift
│       └── ContentView.swift
├── Package.swift
├── Info.plist
└── README.md
```

## 主要機能

### 1. 認証機能
- ユーザー登録
- ログイン
- JWT トークン管理

### 2. 投稿機能
- カメラで撮影
- フォトライブラリから選択
- 画像の圧縮・アップロード
- 説明文の入力

### 3. ギャラリー機能
- 投稿一覧表示
- 画像の非同期読み込み
- プルトゥリフレッシュ

### 4. ランキング機能
- 速度順ランキング表示
- 順位の色分け表示

### 5. プロフィール機能
- プロフィール情報表示
- プロフィール編集
- 画像アップロード

## API連携

### ベースURL
```
https://world-fastest-punch.onrender.com
```

### 主要エンドポイント
- `POST /api/auth/register/` - ユーザー登録
- `POST /api/auth/login/` - ログイン
- `GET /api/submissions/` - 投稿一覧取得
- `POST /api/submissions/` - 投稿作成
- `GET /api/profile/` - プロフィール取得
- `PUT /api/profile/` - プロフィール更新
- `GET /api/rankings/` - ランキング取得

## 開発の進め方

### 1. 基本設定
```bash
# プロジェクトディレクトリに移動
cd ios-app

# 依存関係の解決
swift package resolve
```

### 2. ビルド・実行
1. Xcodeでプロジェクトを開く
2. シミュレーターまたは実機を選択
3. ⌘+R でビルド・実行

### 3. テスト
```bash
# テストの実行
swift test
```

## デバッグ

### ログ出力
```swift
print("デバッグメッセージ: \(variable)")
```

### ネットワークデバッグ
- XcodeのNetwork Inspectorを使用
- APIレスポンスの確認

## デプロイ

### TestFlight
1. XcodeでArchiveを作成
2. App Store Connectにアップロード
3. TestFlightでテスト配布

### App Store
1. App Store Connectでアプリ情報を設定
2. 審査に提出
3. リリース

## 注意事項

### セキュリティ
- APIキーは環境変数で管理
- ユーザー情報の適切な処理

### パフォーマンス
- 画像の非同期読み込み
- メモリ使用量の最適化

### ユーザビリティ
- ローディング状態の表示
- エラーハンドリング
- オフライン対応

## トラブルシューティング

### よくある問題
1. **ビルドエラー**: 依存関係の確認
2. **ネットワークエラー**: APIエンドポイントの確認
3. **画像表示エラー**: Cloudinaryの設定確認

### サポート
- ドキュメント: [Apple Developer Documentation](https://developer.apple.com/documentation/)
- SwiftUI: [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
