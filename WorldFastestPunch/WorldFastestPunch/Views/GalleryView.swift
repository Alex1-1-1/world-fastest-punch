import SwiftUI

struct GalleryView: View {
    @StateObject private var apiService = APIService.shared
    @State private var submissions: [Submission] = []
    @State private var isLoading = false
    @State private var selectedSubmission: Submission?
    @State private var showingDetail = false
    
    var body: some View {
        NavigationView {
            VStack {
                if isLoading {
                    ProgressView("読み込み中...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if submissions.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("投稿がありません")
                            .font(.title2)
                            .foregroundColor(.gray)
                        
                        Text("最初の投稿をしてみましょう！")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            ForEach(submissions) { submission in
                                SubmissionCardView(submission: submission) {
                                    selectedSubmission = submission
                                    showingDetail = true
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("ギャラリー")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await loadSubmissions()
            }
            .onAppear {
                Task {
                    await loadSubmissions()
                }
            }
            .sheet(isPresented: $showingDetail) {
                if let submission = selectedSubmission {
                    SubmissionDetailView(submission: submission)
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

struct SubmissionCardView: View {
    let submission: Submission
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
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
                .cornerRadius(12)
                
                // 速度表示
                VStack(alignment: .leading, spacing: 4) {
                    if let speed = submission.judgment?.speedKmh {
                        Text("\(speed, specifier: "%.1f") km/h")
                            .font(.headline)
                            .foregroundColor(.primary)
                    } else {
                        Text("判定待ち")
                            .font(.headline)
                            .foregroundColor(.orange)
                    }
                    
                    Text(submission.speedCategory)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.gray.opacity(0.2))
                        .cornerRadius(8)
                    
                    Text(submission.userUsername)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal, 4)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

#Preview {
    GalleryView()
}