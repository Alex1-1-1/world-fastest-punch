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
    
    private var tokenRefreshTimer: Timer?
    
    // MARK: - JWT Token Utilities
    private func decodeJWTToken(_ token: String) -> [String: Any]? {
        let parts = token.components(separatedBy: ".")
        guard parts.count == 3 else { return nil }
        
        let payload = parts[1]
        let paddedPayload = payload.padding(toLength: ((payload.count + 3) / 4) * 4, withPad: "=", startingAt: 0)
        
        guard let data = Data(base64Encoded: paddedPayload) else { return nil }
        
        do {
            return try JSONSerialization.jsonObject(with: data) as? [String: Any]
        } catch {
            print("❌ JWTデコードエラー: \(error)")
            return nil
        }
    }
    
    private func getTokenExpirationTime(_ token: String) -> Date? {
        guard let payload = decodeJWTToken(token),
              let exp = payload["exp"] as? TimeInterval else { return nil }
        
        return Date(timeIntervalSince1970: exp)
    }
    
    private func logTokenInfo(_ token: String, tokenType: String) {
        guard let payload = decodeJWTToken(token) else {
            print("❌ \(tokenType)トークンのデコードに失敗")
            return
        }
        
        if let exp = payload["exp"] as? TimeInterval {
            let expirationDate = Date(timeIntervalSince1970: exp)
            let timeRemaining = expirationDate.timeIntervalSinceNow
            
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
            
            print("🔑 \(tokenType)トークン情報:")
            print("   📅 有効期限: \(formatter.string(from: expirationDate))")
            print("   ⏰ 残り時間: \(Int(timeRemaining / 60))分\(Int(timeRemaining.truncatingRemainder(dividingBy: 60)))秒")
            
            if timeRemaining < 0 {
                print("   ⚠️ トークンは期限切れです")
            } else if timeRemaining < 300 { // 5分未満
                print("   🚨 トークンの有効期限が近づいています")
            }
        }
        
        if let iat = payload["iat"] as? TimeInterval {
            let issuedDate = Date(timeIntervalSince1970: iat)
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
            print("   📝 発行日時: \(formatter.string(from: issuedDate))")
        }
    }
    
    private init() {
        loadAuthToken()
        // 既に認証済みの場合はタイマーを開始
        if isAuthenticated && authToken != nil && refreshToken != nil {
            print("🔄 既存の認証状態を検出、タイマーを開始")
            print("   🔑 認証状態: \(isAuthenticated)")
            print("   🔑 アクセストークン: \(authToken != nil ? "存在" : "なし")")
            print("   🔑 リフレッシュトークン: \(refreshToken != nil ? "存在" : "なし")")
            startTokenRefreshTimer()
        } else {
            print("⏹️ 認証情報が不足しているため、タイマーを開始しません")
            print("   🔑 認証状態: \(isAuthenticated)")
            print("   🔑 アクセストークン: \(authToken != nil ? "存在" : "なし")")
            print("   🔑 リフレッシュトークン: \(refreshToken != nil ? "存在" : "なし")")
        }
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
            self.refreshToken = testResponse.refresh
            
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
                self?.refreshToken = response.refresh
                self?.startTokenRefreshTimer()
                
                // トークン情報をログ出力
                self?.logTokenInfo(response.access, tokenType: "アクセス")
                if let refresh = response.refresh {
                    self?.logTokenInfo(refresh, tokenType: "リフレッシュ")
                }
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
            self.refreshToken = testResponse.refresh
            
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
                self?.refreshToken = response.refresh
                self?.startTokenRefreshTimer()
                
                // トークン情報をログ出力
                self?.logTokenInfo(response.access, tokenType: "アクセス")
                if let refresh = response.refresh {
                    self?.logTokenInfo(refresh, tokenType: "リフレッシュ")
                }
            })
            .eraseToAnyPublisher()
    }
    
    func logout() {
        authToken = nil
        currentUser = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: "auth_token")
        UserDefaults.standard.removeObject(forKey: "refresh_token")
        stopTokenRefreshTimer()
    }
    
    // MARK: - Token Refresh Timer
    private func startTokenRefreshTimer() {
        // 既存のタイマーを停止
        stopTokenRefreshTimer()
        
        // 認証済みの場合のみタイマーを開始
        guard isAuthenticated, let token = authToken, refreshToken != nil else { 
            print("❌ 認証情報が不足しているため、タイマーを開始できません")
            return 
        }
        
        // 現在のトークン情報をログ出力
        logTokenInfo(token, tokenType: "現在のアクセス")
        
        // テスト用: 2分間隔でトークンをリフレッシュ（本番では25分間隔に変更）
        let refreshInterval: TimeInterval = 2 * 60 // 2分間隔（テスト用）
        tokenRefreshTimer = Timer.scheduledTimer(withTimeInterval: refreshInterval, repeats: true) { [weak self] _ in
            self?.refreshTokenInBackground()
        }
        
        print("🔄 トークンリフレッシュタイマーを開始（\(Int(refreshInterval/60))分間隔）")
    }
    
    private func stopTokenRefreshTimer() {
        tokenRefreshTimer?.invalidate()
        tokenRefreshTimer = nil
        print("⏹️ トークンリフレッシュタイマーを停止")
    }
    
    private func refreshTokenInBackground() {
        guard let refresh = refreshToken else {
            print("❌ リフレッシュトークンがありません")
            DispatchQueue.main.async {
                self.logout()
            }
            return
        }
        
        // 現在のアクセストークンの残り時間を確認
        if let currentToken = authToken {
            logTokenInfo(currentToken, tokenType: "リフレッシュ前のアクセス")
        }
        
        print("🔄 バックグラウンドでトークンをリフレッシュ")
        
        let refreshRequest = ["refresh": refresh]
        
        performRequest(
            endpoint: "/api/token/refresh/",  // 正しいエンドポイントに修正
            method: "POST",
            body: refreshRequest,
            responseType: RefreshResponse.self
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completion in
                switch completion {
                case .finished:
                    print("✅ バックグラウンドトークンリフレッシュ成功")
                case .failure(let error):
                    print("❌ バックグラウンドトークンリフレッシュ失敗: \(error)")
                    // リフレッシュに失敗した場合でもタイマーは継続
                    // 次回のリフレッシュを試行するため、ログアウトはしない
                    print("🔄 次回のリフレッシュを試行します")
                }
            },
            receiveValue: { [weak self] response in
                self?.authToken = response.access
                self?.saveAuthToken(response.access)
                print("✅ 新しいアクセストークンを保存")
                
                // 新しいトークン情報をログ出力
                self?.logTokenInfo(response.access, tokenType: "新しいアクセス")
            }
        )
        .store(in: &cancellables)
    }
    
    // MARK: - Token Refresh
    private var refreshToken: String? {
        get { UserDefaults.standard.string(forKey: "refresh_token") }
        set { 
            if let newValue = newValue {
                UserDefaults.standard.set(newValue, forKey: "refresh_token")
            } else {
                UserDefaults.standard.removeObject(forKey: "refresh_token")
            }
        }
    }
    
    func refreshAuthToken() -> AnyPublisher<RefreshResponse, Error> {
        guard let refresh = refreshToken else {
            return Fail(error: APIError.authenticationFailed)
                .eraseToAnyPublisher()
        }
        
        let refreshRequest = ["refresh": refresh]
        
        return performRequest(
            endpoint: "/api/token/refresh/",  // 正しいエンドポイントに修正
            method: "POST",
            body: refreshRequest,
            responseType: RefreshResponse.self
        )
        .handleEvents(receiveOutput: { [weak self] response in
            self?.authToken = response.access
            self?.saveAuthToken(response.access)
            print("✅ 新しいアクセストークンを保存")
            
            // 新しいトークン情報をログ出力
            self?.logTokenInfo(response.access, tokenType: "新しいアクセス")
        })
        .eraseToAnyPublisher()
    }
    
    // MARK: - Auto Token Refresh
    func performRequestWithAutoRefresh<T: Codable>(
        endpoint: String,
        method: String,
        body: Codable? = nil,
        responseType: T.Type
    ) -> AnyPublisher<T, Error> {
        return performRequest(
            endpoint: endpoint,
            method: method,
            body: body,
            responseType: responseType
        )
        .catch { error -> AnyPublisher<T, Error> in
            if case APIError.authenticationFailed = error {
                print("🔄 トークンリフレッシュを試行")
                return self.refreshAuthToken()
                    .flatMap { _ in
                        self.performRequest(
                            endpoint: endpoint,
                            method: method,
                            body: body,
                            responseType: responseType
                        )
                    }
                    .eraseToAnyPublisher()
            }
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }
    
    // MARK: - Submissions
    func getSubmissions() -> AnyPublisher<[Submission], Error> {
        return performRequestWithAutoRefresh(
            endpoint: "/api/submissions/",
            method: "GET",
            responseType: SubmissionsResponse.self
        )
        .map { $0.results }
        .eraseToAnyPublisher()
    }
    
    func getMySubmissions() -> AnyPublisher<[Submission], Error> {
        return performRequestWithAutoRefresh(
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
        return performRequestWithAutoRefresh(
            endpoint: "/api/profile/",
            method: "GET",
            responseType: UserProfile.self
        )
        .handleEvents(receiveOutput: { [weak self] profile in
            // プロフィール情報を取得したら、currentUserを更新
            DispatchQueue.main.async {
                if let self = self {
                    // 既存のcurrentUserがある場合は、プロフィール情報で更新
                    if let existingUser = self.currentUser {
                        self.currentUser = User(
                            id: existingUser.id,
                            username: profile.username,
                            email: profile.email,
                            isActive: existingUser.isActive,
                            dateJoined: existingUser.dateJoined,
                            lastLogin: existingUser.lastLogin
                        )
                    } else {
                        // currentUserがない場合は、プロフィール情報から作成
                        self.currentUser = User(
                            id: profile.id ?? 0,
                            username: profile.username,
                            email: profile.email,
                            isActive: true,
                            dateJoined: "",
                            lastLogin: nil
                        )
                    }
                    print("✅ プロフィール情報でcurrentUserを更新: \(profile.username)")
                }
            }
        })
        .eraseToAnyPublisher()
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
                    
                    // 401エラーの場合、認証エラーをログ出力（自動リフレッシュに委ねる）
                    if httpResponse.statusCode == 401 {
                        print("🔒 認証エラー: トークンが無効または期限切れ")
                    }
                }
            })
            .tryMap { data, response -> Data in
                if let httpResponse = response as? HTTPURLResponse {
                    // 401エラーの場合、認証エラーを投げる
                    if httpResponse.statusCode == 401 {
                        throw APIError.authenticationFailed
                    }
                }
                return data
            }
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
        // refresh_tokenも読み込む
        if let refresh = UserDefaults.standard.string(forKey: "refresh_token") {
            refreshToken = refresh
        }
    }
}

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case networkError(String)
    case authenticationFailed
    
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
        case .authenticationFailed:
            return "認証に失敗しました。再度ログインしてください。"
        }
    }
}
