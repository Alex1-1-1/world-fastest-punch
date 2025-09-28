import Foundation

// MARK: - User Model
struct User: Codable, Identifiable {
    let id: Int
    let username: String
    let email: String
    let isActive: Bool
    let dateJoined: String
    let lastLogin: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case email
        case isActive = "is_active"
        case dateJoined = "date_joined"
        case lastLogin = "last_login"
    }
}

// MARK: - User Profile Model
struct UserProfile: Codable, Identifiable {
    let id: Int?  // Optional に変更
    let profileImage: String?
    let bio: String
    let role: String
    let createdAt: String
    let updatedAt: String
    let username: String  // 追加
    let email: String     // 追加
    
    enum CodingKeys: String, CodingKey {
        case id
        case profileImage = "profile_image"
        case bio
        case role
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case username
        case email
    }
}

// MARK: - Auth Response
struct AuthResponse: Codable {
    let access: String
    let refresh: String?
    let user: User
}

// MARK: - Refresh Response
struct RefreshResponse: Codable {
    let access: String
}

// MARK: - Login Request
struct LoginRequest: Codable {
    let email: String
    let password: String
}

// MARK: - Register Request
struct RegisterRequest: Codable {
    let email: String
    let password: String
    let username: String
}
