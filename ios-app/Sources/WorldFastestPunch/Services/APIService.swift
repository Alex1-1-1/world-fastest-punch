import Foundation
import Combine

// MARK: - API Service
class APIService: ObservableObject {
    static let shared = APIService()
    
    private let baseURL = "https://world-fastest-punch.onrender.com"
    private var cancellables = Set<AnyCancellable>()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var authToken: String?
    
    private init() {
        loadAuthToken()
    }
    
    // MARK: - Authentication
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, Error> {
        let loginRequest = LoginRequest(email: email, password: password)
        
        return performRequest(
            endpoint: "/api/auth/login/",
            method: "POST",
            body: loginRequest,
            responseType: AuthResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.authToken = response.access
            self?.currentUser = response.user
            self?.isAuthenticated = true
            self?.saveAuthToken(response.access)
        })
        .eraseToAnyPublisher()
    }
    
    func register(email: String, password: String, username: String) -> AnyPublisher<AuthResponse, Error> {
        let registerRequest = RegisterRequest(email: email, password: password, username: username)
        
        return performRequest(
            endpoint: "/api/auth/register/",
            method: "POST",
            body: registerRequest,
            responseType: AuthResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.authToken = response.access
            self?.currentUser = response.user
            self?.isAuthenticated = true
            self?.saveAuthToken(response.access)
        })
        .eraseToAnyPublisher()
    }
    
    func logout() {
        authToken = nil
        currentUser = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: "auth_token")
    }
    
    // MARK: - Submissions
    func getSubmissions() -> AnyPublisher<[Submission], Error> {
        return performRequest(
            endpoint: "/api/submissions/",
            method: "GET",
            responseType: [Submission].self
        )
    }
    
    func createSubmission(image: Data, description: String, username: String, email: String) -> AnyPublisher<Submission, Error> {
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(baseURL)/api/submissions/")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        
        // Add image
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"punch.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(image)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add description
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"description\"\r\n\r\n".data(using: .utf8)!)
        body.append(description.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add username
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"username\"\r\n\r\n".data(using: .utf8)!)
        body.append(username.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add email
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"email\"\r\n\r\n".data(using: .utf8)!)
        body.append(email.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: Submission.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
    
    // MARK: - Profile
    func getProfile() -> AnyPublisher<UserProfile, Error> {
        return performRequest(
            endpoint: "/api/profile/",
            method: "GET",
            responseType: UserProfile.self
        )
    }
    
    func updateProfile(bio: String, username: String, email: String, profileImage: Data?) -> AnyPublisher<UserProfile, Error> {
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(baseURL)/api/profile/")!)
        request.httpMethod = "PUT"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        var body = Data()
        
        // Add bio
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"bio\"\r\n\r\n".data(using: .utf8)!)
        body.append(bio.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add username
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"username\"\r\n\r\n".data(using: .utf8)!)
        body.append(username.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add email
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"email\"\r\n\r\n".data(using: .utf8)!)
        body.append(email.data(using: .utf8)!)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add profile image if provided
        if let imageData = profileImage {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"profile_image\"; filename=\"profile.jpg\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
            body.append(imageData)
            body.append("\r\n".data(using: .utf8)!)
        }
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: UserProfile.self, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
    
    // MARK: - Rankings
    func getRankings() -> AnyPublisher<[Ranking], Error> {
        return performRequest(
            endpoint: "/api/rankings/",
            method: "GET",
            responseType: [Ranking].self
        )
    }
    
    // MARK: - Notifications
    func getNotifications() -> AnyPublisher<[Notification], Error> {
        return performRequest(
            endpoint: "/api/notifications/",
            method: "GET",
            responseType: [Notification].self
        )
    }
    
    // MARK: - Helper Methods
    private func performRequest<T: Codable>(
        endpoint: String,
        method: String,
        body: Codable? = nil,
        responseType: T.Type
    ) -> AnyPublisher<T, Error> {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: error)
                    .eraseToAnyPublisher()
            }
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: responseType, decoder: JSONDecoder())
            .eraseToAnyPublisher()
    }
    
    private func saveAuthToken(_ token: String) {
        UserDefaults.standard.set(token, forKey: "auth_token")
    }
    
    private func loadAuthToken() {
        if let token = UserDefaults.standard.string(forKey: "auth_token") {
            authToken = token
            isAuthenticated = true
        }
    }
}

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "無効なURLです"
        case .noData:
            return "データがありません"
        case .decodingError:
            return "データの解析に失敗しました"
        case .networkError(let message):
            return "ネットワークエラー: \(message)"
        }
    }
}
