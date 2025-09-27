import SwiftUI

struct RankingView: View {
    @StateObject private var apiService = APIService.shared
    @State private var submissions: [Submission] = []
    @State private var isLoading = false
    @State private var selectedCategory = "OVERALL"
    
    private let categories = [
        ("OVERALL", "総合ランキング"),
        ("VERY_FAST", "とても速いパンチ"),
        ("QUITE_FAST", "まあまあ速いパンチ"),
        ("MODERATE", "普通のパンチ"),
        ("SLOW", "あまり速くないパンチ"),
        ("VERY_SLOW", "ぜんぜん速くないパンチ")
    ]
    
    var filteredSubmissions: [Submission] {
        let judgedSubmissions = submissions.filter { $0.isJudged && !$0.isRejected }
        
        switch selectedCategory {
        case "OVERALL":
            return judgedSubmissions.sorted { ($0.judgment?.speedKmh ?? 0) > ($1.judgment?.speedKmh ?? 0) }
        case "VERY_FAST":
            return judgedSubmissions.filter { ($0.judgment?.speedKmh ?? 0) >= 80 }
                .sorted { ($0.judgment?.speedKmh ?? 0) > ($1.judgment?.speedKmh ?? 0) }
        case "QUITE_FAST":
            return judgedSubmissions.filter { let speed = $0.judgment?.speedKmh ?? 0; return speed >= 60 && speed < 80 }
                .sorted { ($0.judgment?.speedKmh ?? 0) > ($1.judgment?.speedKmh ?? 0) }
        case "MODERATE":
            return judgedSubmissions.filter { let speed = $0.judgment?.speedKmh ?? 0; return speed >= 40 && speed < 60 }
                .sorted { ($0.judgment?.speedKmh ?? 0) > ($1.judgment?.speedKmh ?? 0) }
        case "SLOW":
            return judgedSubmissions.filter { let speed = $0.judgment?.speedKmh ?? 0; return speed >= 20 && speed < 40 }
                .sorted { ($0.judgment?.speedKmh ?? 0) > ($1.judgment?.speedKmh ?? 0) }
        case "VERY_SLOW":
            return judgedSubmissions.filter { ($0.judgment?.speedKmh ?? 0) < 20 }
                .sorted { ($0.judgment?.speedKmh ?? 0) > ($1.judgment?.speedKmh ?? 0) }
        default:
            return judgedSubmissions
        }
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // カテゴリー選択
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(categories, id: \.0) { category in
                            Button(action: {
                                selectedCategory = category.0
                            }) {
                                Text(category.1)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(selectedCategory == category.0 ? Color.orange : Color.gray.opacity(0.2))
                                    .foregroundColor(selectedCategory == category.0 ? .white : .primary)
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 12)
                
                if isLoading {
                    ProgressView("読み込み中...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredSubmissions.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "trophy")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("ランキングデータがありません")
                            .font(.title2)
                            .foregroundColor(.gray)
                        
                        Text("投稿をしてランキングに参加しましょう！")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(Array(filteredSubmissions.prefix(10).enumerated()), id: \.element.id) { index, submission in
                                RankingRowView(
                                    submission: submission,
                                    rank: index + 1,
                                    isTopThree: index < 3
                                )
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("ランキング")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await loadSubmissions()
            }
            .onAppear {
                Task {
                    await loadSubmissions()
                }
            }
        }
    }
    
    @MainActor
    private func loadSubmissions() async {
        isLoading = true
        do {
            let fetchedSubmissions = try await apiService.getSubmissions().async()
            submissions = fetchedSubmissions
        } catch {
            print("Error loading submissions: \(error)")
        }
        isLoading = false
    }
}

struct RankingRowView: View {
    let submission: Submission
    let rank: Int
    let isTopThree: Bool
    
    var body: some View {
        HStack(spacing: 16) {
            // 順位
            ZStack {
                Circle()
                    .fill(rankColor)
                    .frame(width: 50, height: 50)
                
                if isTopThree {
                    Image(systemName: rankIcon)
                        .font(.title2)
                        .foregroundColor(.white)
                } else {
                    Text("\(rank)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
            }
            
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
            .frame(width: 60, height: 60)
            .clipped()
            .cornerRadius(8)
            
            // 情報
            VStack(alignment: .leading, spacing: 4) {
                Text(submission.userUsername)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                if let speed = submission.judgment?.speedKmh {
                    Text("\(speed, specifier: "%.1f") km/h")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(speedColor(speed))
                }
                
                Text(submission.speedCategory)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(categoryColor(submission.judgment?.speedKmh ?? 0))
                    .cornerRadius(8)
            }
            
            Spacer()
        }
        .padding()
        .background(rankBackgroundColor)
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(rankBorderColor, lineWidth: isTopThree ? 2 : 0)
        )
    }
    
    private var rankColor: Color {
        switch rank {
        case 1: return .yellow
        case 2: return .gray
        case 3: return .orange
        default: return .blue
        }
    }
    
    private var rankIcon: String {
        switch rank {
        case 1: return "crown.fill"
        case 2: return "medal.fill"
        case 3: return "medal.fill"
        default: return ""
        }
    }
    
    private var rankBackgroundColor: Color {
        switch rank {
        case 1: return .yellow.opacity(0.1)
        case 2: return .gray.opacity(0.1)
        case 3: return .orange.opacity(0.1)
        default: return .blue.opacity(0.05)
        }
    }
    
    private var rankBorderColor: Color {
        switch rank {
        case 1: return .yellow
        case 2: return .gray
        case 3: return .orange
        default: return .clear
        }
    }
    
    private func speedColor(_ speed: Double) -> Color {
        if speed >= 80 { return .red }
        if speed >= 60 { return .orange }
        if speed >= 40 { return .yellow }
        if speed >= 20 { return .blue }
        return .gray
    }
    
    private func categoryColor(_ speed: Double) -> Color {
        if speed >= 80 { return .red.opacity(0.2) }
        if speed >= 60 { return .orange.opacity(0.2) }
        if speed >= 40 { return .yellow.opacity(0.2) }
        if speed >= 20 { return .blue.opacity(0.2) }
        return .gray.opacity(0.2)
    }
}

#Preview {
    RankingView()
}