import SwiftUI

struct ProfileView: View {
    @StateObject private var apiService = APIService.shared
    @State private var mySubmissions: [Submission] = []
    @State private var userProfile: UserProfile?
    @State private var isLoading = false
    @State private var showingSettings = false
    
    var body: some View {
        NavigationView {
                    ScrollView {
                VStack(spacing: 24) {
                    // プロフィール情報
                    VStack(spacing: 16) {
                            // プロフィール画像
                        AsyncImage(url: URL(string: userProfile?.profileImage ?? "")) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .overlay(
                                    Image(systemName: "person")
                                        .font(.system(size: 40))
                                        .foregroundColor(.gray)
                                )
                        }
                        .frame(width: 100, height: 100)
                        .clipped()
                        .clipShape(Circle())
                        
                        // ユーザー情報
                        VStack(spacing: 8) {
                            Text(apiService.currentUser?.username ?? "ユーザー")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Text(apiService.currentUser?.email ?? "")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            if let bio = userProfile?.bio, !bio.isEmpty {
                                Text(bio)
                                                .font(.body)
                                    .foregroundColor(.secondary)
                                                .multilineTextAlignment(.center)
                                    .padding(.horizontal)
                            }
                        }
                        
                        // 設定ボタンとログアウトボタン
                        HStack(spacing: 16) {
                            Button(action: {
                                showingSettings = true
                            }) {
                                HStack {
                                    Image(systemName: "gearshape")
                                    Text("設定")
                                }
                                .font(.subheadline)
                                .foregroundColor(.orange)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.orange.opacity(0.1))
                                .cornerRadius(20)
                            }
                            
                            Button(action: {
                                    apiService.logout()
                            }) {
                                HStack {
                                    Image(systemName: "arrow.right.square")
                                    Text("ログアウト")
                                }
                                .font(.subheadline)
                                .foregroundColor(.red)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(20)
                            }
                        }
                            }
                            .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(16)
                    
                    // 統計情報
                    HStack(spacing: 20) {
                        StatCardView(
                            title: "総投稿数",
                            value: "\(mySubmissions.count)",
                            color: .blue
                        )
                        
                        StatCardView(
                            title: "承認済み",
                            value: "\(mySubmissions.filter { $0.isJudged && !$0.isRejected }.count)",
                            color: .green
                        )
                        
                        StatCardView(
                            title: "判定待ち",
                            value: "\(mySubmissions.filter { !$0.isJudged }.count)",
                            color: .orange
                        )
                    }
                    
                    // 最高速度
                    if let maxSpeed = mySubmissions.compactMap({ $0.judgment?.speedKmh }).max() {
                        VStack(spacing: 8) {
                            Text("最高速度")
                                .font(.headline)
                                .foregroundColor(.secondary)
                            
                            Text("\(maxSpeed, specifier: "%.1f") km/h")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(speedColor(maxSpeed))
                            
                            Text(speedCategory(maxSpeed))
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 4)
                                .background(categoryColor(maxSpeed))
                                .cornerRadius(8)
                        }
                        .padding()
                        .background(Color.yellow.opacity(0.1))
                        .cornerRadius(12)
                    }
                    
                    // 自分の投稿一覧
                    VStack(alignment: .leading, spacing: 16) {
                        Text("自分の投稿")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if mySubmissions.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "photo.on.rectangle")
                                    .font(.system(size: 40))
                                    .foregroundColor(.gray)
                                
                                Text("まだ投稿がありません")
                                    .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                                Text("最初の投稿をしてみましょう！")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                        } else {
                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: 12) {
                                ForEach(mySubmissions) { submission in
                                    MySubmissionCardView(submission: submission)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("プロフィール")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await loadData()
            }
            .onAppear {
                Task {
                    await loadData()
                }
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView(userProfile: userProfile)
            }
        }
    }
    
    @MainActor
    private func loadData() async {
        isLoading = true
        
        do {
            // 自分の投稿を取得
            let submissions = try await apiService.getMySubmissions().async()
            mySubmissions = submissions
            
            // プロフィール情報を取得
            let profile = try await apiService.getProfile().async()
            userProfile = profile
        } catch {
            print("Error loading data: \(error)")
        }
        
                    isLoading = false
    }
    
    private func speedColor(_ speed: Double) -> Color {
        if speed >= 80 { return .red }
        if speed >= 60 { return .orange }
        if speed >= 40 { return .yellow }
        if speed >= 20 { return .blue }
        return .gray
    }
    
    private func speedCategory(_ speed: Double) -> String {
        if speed >= 80 { return "とても速いパンチ" }
        if speed >= 60 { return "まあまあ速いパンチ" }
        if speed >= 40 { return "普通のパンチ" }
        if speed >= 20 { return "あまり速くないパンチ" }
        return "ぜんぜん速くないパンチ"
    }
    
    private func categoryColor(_ speed: Double) -> Color {
        if speed >= 80 { return .red.opacity(0.2) }
        if speed >= 60 { return .orange.opacity(0.2) }
        if speed >= 40 { return .yellow.opacity(0.2) }
        if speed >= 20 { return .blue.opacity(0.2) }
        return .gray.opacity(0.2)
    }
}

struct StatCardView: View {
    let title: String
    let value: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct MySubmissionCardView: View {
    let submission: Submission
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // 画像
            AsyncImage(url: URL(string: submission.thumbnail ?? submission.image)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .overlay(ProgressView())
            }
            .frame(height: 120)
            .clipped()
            .cornerRadius(8)
            
            // 速度表示
            VStack(alignment: .leading, spacing: 4) {
                if let speed = submission.judgment?.speedKmh {
                    Text("\(speed, specifier: "%.1f") km/h")
                        .font(.headline)
                        .foregroundColor(speedColor(speed))
                } else {
                    Text("判定待ち")
                        .font(.headline)
                        .foregroundColor(.orange)
                }
                
                Text(submission.speedCategory)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.gray.opacity(0.2))
                    .cornerRadius(6)
            }
            .padding(.horizontal, 4)
        }
    }
    
    private func speedColor(_ speed: Double) -> Color {
        if speed >= 80 { return .red }
        if speed >= 60 { return .orange }
        if speed >= 40 { return .yellow }
        if speed >= 20 { return .blue }
        return .gray
    }
}

#Preview {
    ProfileView()
}