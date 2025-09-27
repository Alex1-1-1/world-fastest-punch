import SwiftUI

struct ContentView: View {
    @StateObject private var apiService = APIService.shared
    @State private var selectedTab = 0
    
    var body: some View {
        Group {
            if apiService.isAuthenticated {
                // 認証済みの場合はメインアプリを表示
                TabView(selection: $selectedTab) {
            // ギャラリータブ
            GalleryView()
                .tabItem {
                    Image(systemName: "photo.on.rectangle")
                    Text("ギャラリー")
                }
                .tag(0)
            
            // 投稿タブ
            SubmissionView()
                .tabItem {
                    Image(systemName: "camera")
                    Text("投稿")
                }
                .tag(1)
            
            // ランキングタブ
            RankingView()
                .tabItem {
                    Image(systemName: "trophy")
                    Text("ランキング")
                }
                .tag(2)
            
            // プロフィールタブ
            ProfileView()
                .tabItem {
                    Image(systemName: "person")
                    Text("プロフィール")
                }
                .tag(3)
            
            // 通知タブ
            NotificationView()
                .tabItem {
                    Image(systemName: "bell")
                    Text("通知")
                }
                .tag(4)
                }
                .accentColor(.orange)
                .onAppear {
                    // 認証済みの場合はデータを取得
                    loadInitialData()
                }
            } else {
                // 未認証の場合はログイン画面を表示
                AuthView()
            }
        }
    }
    
    private func loadInitialData() {
        // 初期データの読み込み
        // 各ビューで個別にデータを取得するため、ここでは何もしない
    }
}

#Preview {
    ContentView()
}