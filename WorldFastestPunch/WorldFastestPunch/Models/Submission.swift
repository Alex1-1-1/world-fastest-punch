import Foundation

// MARK: - Submission Model
struct Submission: Codable, Identifiable {
    let id: Int
    let userUsername: String
    let image: String
    let thumbnail: String?
    let watermarkedImage: String?
    let description: String
    let isJudged: Bool
    let isRejected: Bool?  // Optional に変更
    let createdAt: String
    let judgment: Judgment?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userUsername = "user_username"
        case image
        case thumbnail
        case watermarkedImage = "watermarked_image"
        case description
        case isJudged = "is_judged"
        case isRejected = "is_rejected"
        case createdAt = "created_at"
        case judgment
    }
    
    // 速度カテゴリーを取得
    var speedCategory: String {
        guard let speed = judgment?.speedKmh else { return "判定待ち" }
        
        if speed >= 80 { return "とても速いパンチ" }
        if speed >= 60 { return "まあまあ速いパンチ" }
        if speed >= 40 { return "普通のパンチ" }
        if speed >= 20 { return "あまり速くないパンチ" }
        return "ぜんぜん速くないパンチ"
    }
    
    // ステータスを取得
    var status: SubmissionStatus {
        if isRejected == true { return .rejected }
        if isJudged { return .approved }
        return .pending
    }
}

// MARK: - Submission Status
enum SubmissionStatus: String, CaseIterable {
    case pending = "判定待ち"
    case approved = "承認済み"
    case rejected = "却下"
    
    var color: String {
        switch self {
        case .pending: return "yellow"
        case .approved: return "green"
        case .rejected: return "red"
        }
    }
}

// MARK: - Judgment Model
struct Judgment: Codable, Identifiable {
    let id: Int
    let submissionId: Int
    let judgment: String
    let speedKmh: Double?
    let metaphorComment: String?
    let detailedComment: String?
    let rejectionReason: String?
    let judgeName: String
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case submissionId = "submission_id"
        case judgment
        case speedKmh = "speed_kmh"
        case metaphorComment = "metaphor_comment"
        case detailedComment = "detailed_comment"
        case rejectionReason = "rejection_reason"
        case judgeName = "judge_name"
        case createdAt = "created_at"
    }
}

// MARK: - Submission Create Request
struct SubmissionCreateRequest: Codable {
    let image: Data
    let description: String
    let username: String
    let email: String
}

// MARK: - Ranking Model
struct Ranking: Codable, Identifiable {
    let id: Int
    let user: String
    let speedKmh: Double
    let submissionId: Int
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case user
        case speedKmh = "speed_kmh"
        case submissionId = "submission_id"
        case createdAt = "created_at"
    }
}

// MARK: - Submissions Response
struct SubmissionsResponse: Codable {
    let count: Int
    let next: String?
    let previous: String?
    let results: [Submission]
}

// MARK: - Notifications Response
struct NotificationsResponse: Codable {
    let count: Int
    let next: String?
    let previous: String?
    let results: [Notification]
}

// MARK: - Notification Model
struct Notification: Codable, Identifiable {
    let id: Int
    let type: String
    let title: String
    let message: String
    let isRead: Bool
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case type
        case title
        case message
        case isRead = "is_read"
        case createdAt = "created_at"
    }
}
