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
    let id: Int
    let profileImage: String?
    let bio: String
    let role: String
    let createdAt: String
    let updatedAt: String
    
    enum CodingKeys: String, CodingKey {
        case id
        case profileImage = "profile_image"
        case bio
        case role
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Auth Response
struct AuthResponse: Codable {
    let access: String
    let refresh: String
    let user: User
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
