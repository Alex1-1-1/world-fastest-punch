import SwiftUI

struct SubmissionDetailView: View {
    let submission: Submission
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // 画像
                    AsyncImage(url: URL(string: submission.watermarkedImage ?? submission.image)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .overlay(
                                ProgressView()
                            )
                    }
                    .frame(maxHeight: 400)
                    .cornerRadius(12)
                    
                    // 速度情報
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            VStack(alignment: .leading) {
                                if let speed = submission.judgment?.speedKmh {
                                    Text("\(speed, specifier: "%.1f") km/h")
                                        .font(.largeTitle)
                                        .fontWeight(.bold)
                                        .foregroundColor(speedColor(speed))
                                } else {
                                    Text("判定待ち")
                                        .font(.largeTitle)
                                        .fontWeight(.bold)
                                        .foregroundColor(.orange)
                                }
                                
                                Text(submission.speedCategory)
                                    .font(.headline)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(categoryColor(submission.judgment?.speedKmh ?? 0))
                                    .cornerRadius(8)
                            }
                            
                            Spacer()
                            
                            // ステータスバッジ
                            statusBadge
                        }
                        
                        // 投稿者情報
                        HStack {
                            Image(systemName: "person.circle")
                                .foregroundColor(.secondary)
                            Text(submission.userUsername)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            Spacer()
                            
                            Text(formatDate(submission.createdAt))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        // 説明文
                        if !submission.description.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("説明")
                                    .font(.headline)
                                Text(submission.description)
                                    .font(.body)
                                    .foregroundColor(.primary)
                            }
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                        }
                        
                        // 管理者コメント
                        if let judgment = submission.judgment {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("管理者コメント")
                                    .font(.headline)
                                
                                if let metaphorComment = judgment.metaphorComment {
                                    Text(metaphorComment)
                                        .font(.body)
                                        .italic()
                                        .foregroundColor(.primary)
                                }
                                
                                if let detailedComment = judgment.detailedComment, !detailedComment.isEmpty {
                                    Text(detailedComment)
                                        .font(.body)
                                        .foregroundColor(.secondary)
                                }
                                
                                if let rejectionReason = judgment.rejectionReason, !rejectionReason.isEmpty {
                                    Text("却下理由: \(rejectionReason)")
                                        .font(.body)
                                        .foregroundColor(.red)
                                }
                            }
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .navigationTitle("投稿詳細")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("閉じる") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private var statusBadge: some View {
        HStack {
            Image(systemName: statusIcon)
                .foregroundColor(statusColor)
            Text(submission.status.rawValue)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(statusColor.opacity(0.2))
        .cornerRadius(8)
    }
    
    private var statusIcon: String {
        switch submission.status {
        case .pending: return "clock"
        case .approved: return "checkmark.circle"
        case .rejected: return "xmark.circle"
        }
    }
    
    private var statusColor: Color {
        switch submission.status {
        case .pending: return .orange
        case .approved: return .green
        case .rejected: return .red
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
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            displayFormatter.locale = Locale(identifier: "ja_JP")
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

#Preview {
    SubmissionDetailView(submission: Submission(
        id: 1,
        userUsername: "テストユーザー",
        image: "https://example.com/image.jpg",
        thumbnail: "https://example.com/thumbnail.jpg",
        watermarkedImage: "https://example.com/watermarked.jpg",
        description: "テスト投稿です",
        isJudged: true,
        isRejected: false,
        createdAt: "2024-01-01T00:00:00.000000Z",
        judgment: Judgment(
            id: 1,
            submissionId: 1,
            judgment: "APPROVED",
            speedKmh: 85.5,
            metaphorComment: "新幹線並みの速さ！",
            detailedComment: "非常に速いパンチでした",
            rejectionReason: nil,
            judgeName: "管理者",
            createdAt: "2024-01-01T00:00:00.000000Z"
        )
    ))
}

