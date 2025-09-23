import SwiftUI

struct ContentView: View {
    @EnvironmentObject var apiService: APIService
    @State private var selectedTab = 0
    
    var body: some View {
        Group {
            if apiService.isAuthenticated {
                MainTabView(selectedTab: $selectedTab)
            } else {
                AuthView()
            }
        }
        .onAppear {
            // アプリ起動時の処理
        }
    }
}

struct MainTabView: View {
    @Binding var selectedTab: Int
    
    var body: some View {
        TabView(selection: $selectedTab) {
            GalleryView()
                .tabItem {
                    Image(systemName: "photo.on.rectangle")
                    Text("ギャラリー")
                }
                .tag(0)
            
            SubmissionView()
                .tabItem {
                    Image(systemName: "camera")
                    Text("投稿")
                }
                .tag(1)
            
            RankingView()
                .tabItem {
                    Image(systemName: "trophy")
                    Text("ランキング")
                }
                .tag(2)
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person")
                    Text("プロフィール")
                }
                .tag(3)
        }
        .accentColor(.orange)
    }
}

#Preview {
    ContentView()
        .environmentObject(APIService.shared)
}
