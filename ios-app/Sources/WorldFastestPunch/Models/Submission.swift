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
        case createdAt = "created_at"
        case judgment
    }
}

// MARK: - Judgment Model
struct Judgment: Codable, Identifiable {
    let id: Int
    let submissionId: Int
    let judgment: String
    let speedKmh: Double?
    let rejectionReason: String?
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case submissionId = "submission_id"
        case judgment
        case speedKmh = "speed_kmh"
        case rejectionReason = "rejection_reason"
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
