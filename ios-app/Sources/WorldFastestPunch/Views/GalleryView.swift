import SwiftUI

struct GalleryView: View {
    @EnvironmentObject var apiService: APIService
    @State private var submissions: [Submission] = []
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
                } else if submissions.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "photo")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("まだ投稿がありません")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        
                        Text("最初のパンチを投稿してみましょう！")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding()
                } else {
                    ScrollView {
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            ForEach(submissions) { submission in
                                SubmissionCard(submission: submission)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("ギャラリー")
            .refreshable {
                await loadSubmissions()
            }
            .onAppear {
                Task {
                    await loadSubmissions()
                }
            }
        }
        .alert("エラー", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func loadSubmissions() async {
        isLoading = true
        errorMessage = ""
        
        apiService.getSubmissions()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                        showAlert = true
                    }
                },
                receiveValue: { submissions in
                    self.submissions = submissions
                }
            )
            .store(in: &apiService.cancellables)
    }
}

struct SubmissionCard: View {
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
                    .overlay(
                        ProgressView()
                    )
            }
            .frame(height: 150)
            .clipped()
            .cornerRadius(10)
            
            // ユーザー名
            Text(submission.userUsername)
                .font(.caption)
                .foregroundColor(.secondary)
            
            // 説明文
            if !submission.description.isEmpty {
                Text(submission.description)
                    .font(.caption)
                    .lineLimit(2)
            }
            
            // 判定状況
            HStack {
                if submission.isJudged {
                    if let judgment = submission.judgment {
                        if judgment.judgment == "APPROVED" {
                            Label("承認済み", systemImage: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.green)
                        } else {
                            Label("却下", systemImage: "xmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                } else {
                    Label("判定待ち", systemImage: "clock")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
                
                Spacer()
                
                Text(formatDate(submission.createdAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(8)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        formatter.timeZone = TimeZone(abbreviation: "UTC")
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "MM/dd HH:mm"
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

#Preview {
    GalleryView()
        .environmentObject(APIService.shared)
}
