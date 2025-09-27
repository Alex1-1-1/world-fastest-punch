import Foundation
import Combine

// MARK: - API Service
class APIService: ObservableObject {
    static let shared = APIService()
    
    private let baseURL = "https://world-fastest-punch.onrender.com"
    var cancellables = Set<AnyCancellable>()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var authToken: String?
    
    private init() {
        loadAuthToken()
    }
    
    // MARK: - Authentication
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, Error> {
        print("🔍 ログイン処理開始: \(email)")
        
        // テスト用の認証（Djangoバックエンドが利用できない場合）
        if email == "test@example.com" && password == "password" {
            print("🧪 テスト認証を使用")
            let testUser = User(
                id: 1,
                username: "testuser",
                email: "test@example.com",
                isActive: true,
                dateJoined: "2024-01-01T00:00:00Z",
                lastLogin: "2024-01-01T00:00:00Z"
            )
            let testResponse = AuthResponse(
                access: "test_token_12345",
                refresh: "test_refresh_12345",
                user: testUser
            )
            
            print("✅ テストユーザー作成完了: \(testUser)")
            print("✅ テストレスポンス作成完了: \(testResponse)")
            
            self.authToken = testResponse.access
            self.currentUser = testResponse.user
            self.isAuthenticated = true
            self.saveAuthToken(testResponse.access)
            
            print("✅ 認証状態更新完了")
            
            return Just(testResponse)
                .setFailureType(to: Error.self)
                .eraseToAnyPublisher()
        }
        
        print("🌐 本番API認証を試行")
        
        let loginRequest = LoginRequest(email: email, password: password)
        
            return performRequest(
                endpoint: "/api/auth/jwt/login/",
                method: "POST",
                body: loginRequest,
                responseType: AuthResponse.self
            )
            .receive(on: DispatchQueue.main)
            .handleEvents(receiveOutput: { [weak self] response in
                self?.authToken = response.access
                self?.currentUser = response.user
                self?.isAuthenticated = true
                self?.saveAuthToken(response.access)
            })
            .eraseToAnyPublisher()
    }
    
    func register(email: String, password: String, username: String) -> AnyPublisher<AuthResponse, Error> {
        print("🔍 新規登録処理開始: \(email), \(username)")
        
        // テスト用の新規登録（Djangoバックエンドが利用できない場合）
        if email.hasSuffix("@test.com") {
            print("🧪 テスト新規登録を使用")
            let testUser = User(
                id: Int.random(in: 1000...9999),
                username: username,
                email: email,
                isActive: true,
                dateJoined: "2024-01-01T00:00:00Z",
                lastLogin: "2024-01-01T00:00:00Z"
            )
            let testResponse = AuthResponse(
                access: "test_token_\(Int.random(in: 10000...99999))",
                refresh: "test_refresh_\(Int.random(in: 10000...99999))",
                user: testUser
            )
            
            print("✅ テストユーザー作成完了: \(testUser)")
            print("✅ テストレスポンス作成完了: \(testResponse)")
            
            self.authToken = testResponse.access
            self.currentUser = testResponse.user
            self.isAuthenticated = true
            self.saveAuthToken(testResponse.access)
            
            print("✅ 認証状態更新完了")
            
            return Just(testResponse)
                .setFailureType(to: Error.self)
                .eraseToAnyPublisher()
        }
        
        print("🌐 本番API新規登録を試行")
        
        let registerRequest = RegisterRequest(email: email, password: password, username: username)
        
            return performRequest(
                endpoint: "/api/auth/jwt/register/",
                method: "POST",
                body: registerRequest,
                responseType: AuthResponse.self
            )
            .receive(on: DispatchQueue.main)
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
            responseType: SubmissionsResponse.self
        )
        .map { $0.results }
        .eraseToAnyPublisher()
    }
    
    func getMySubmissions() -> AnyPublisher<[Submission], Error> {
        return performRequest(
            endpoint: "/api/submissions/",
            method: "GET",
            responseType: SubmissionsResponse.self
        )
        .map { response in
            // 現在のユーザーの投稿のみをフィルタリング
            response.results.filter { submission in
                submission.userUsername == self.currentUser?.username
            }
        }
        .eraseToAnyPublisher()
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
            responseType: NotificationsResponse.self
        )
        .map { $0.results }
        .eraseToAnyPublisher()
    }
    
    func markNotificationAsRead(notificationId: Int) -> AnyPublisher<Notification, Error> {
        return performRequest(
            endpoint: "/api/notifications/\(notificationId)/read/",
            method: "PATCH",
            responseType: Notification.self
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
            print("❌ 無効なURL: \(baseURL)\(endpoint)")
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }
        
        print("🌐 API リクエスト: \(method) \(url)")
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            print("🔑 認証トークン設定済み")
        }
        
        if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                request.httpBody = try JSONEncoder().encode(body)
                print("📦 リクエストボディ: \(String(data: request.httpBody!, encoding: .utf8) ?? "nil")")
            } catch {
                print("❌ リクエストボディエンコードエラー: \(error)")
                return Fail(error: error)
                    .eraseToAnyPublisher()
            }
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .handleEvents(receiveOutput: { data, response in
                if let httpResponse = response as? HTTPURLResponse {
                    print("📡 レスポンス: \(httpResponse.statusCode)")
                    print("📄 レスポンスデータ: \(String(data: data, encoding: .utf8) ?? "nil")")
                }
            })
            .map(\.data)
            .decode(type: responseType, decoder: JSONDecoder())
            .handleEvents(receiveCompletion: { completion in
                switch completion {
                case .finished:
                    print("✅ リクエスト成功")
                case .failure(let error):
                    print("❌ リクエスト失敗: \(error)")
                }
            })
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
