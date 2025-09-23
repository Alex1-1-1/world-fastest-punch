import SwiftUI

struct RankingView: View {
    @EnvironmentObject var apiService: APIService
    @State private var rankings: [Ranking] = []
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showAlert = false
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    VStack {
                        ProgressView("読み込み中...")
                        Spacer()
                    }
                } else if rankings.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "trophy")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("まだランキングがありません")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        
                        Text("パンチを投稿してランキングに参加しましょう！")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                } else {
                    List {
                        ForEach(Array(rankings.enumerated()), id: \.element.id) { index, ranking in
                            RankingRow(ranking: ranking, rank: index + 1)
                        }
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .navigationTitle("ランキング")
            .refreshable {
                await loadRankings()
            }
            .onAppear {
                Task {
                    await loadRankings()
                }
            }
        }
        .alert("エラー", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func loadRankings() async {
        isLoading = true
        errorMessage = ""
        
        apiService.getRankings()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                        showAlert = true
                    }
                },
                receiveValue: { rankings in
                    self.rankings = rankings.sorted { $0.speedKmh > $1.speedKmh }
                }
            )
            .store(in: &apiService.cancellables)
    }
}

struct RankingRow: View {
    let ranking: Ranking
    let rank: Int
    
    var body: some View {
        HStack(spacing: 16) {
            // 順位
            ZStack {
                Circle()
                    .fill(rankColor)
                    .frame(width: 40, height: 40)
                
                Text("\(rank)")
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            
            // ユーザー情報
            VStack(alignment: .leading, spacing: 4) {
                Text(ranking.user)
                    .font(.headline)
                
                Text(formatDate(ranking.createdAt))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // 速度
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(ranking.speedKmh, specifier: "%.1f") km/h")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.orange)
                
                Text("パンチ速度")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
    
    private var rankColor: Color {
        switch rank {
        case 1:
            return .yellow
        case 2:
            return .gray
        case 3:
            return .brown
        default:
            return .blue
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        formatter.timeZone = TimeZone(abbreviation: "UTC")
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MM/dd"
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

#Preview {
    RankingView()
        .environmentObject(APIService.shared)
}
