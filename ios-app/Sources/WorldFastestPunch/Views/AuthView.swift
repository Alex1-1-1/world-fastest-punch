import SwiftUI

struct AuthView: View {
    @EnvironmentObject var apiService: APIService
    @State private var isLoginMode = true
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var isLoading = false
    @State private var errorMessage = ""
    @State private var showAlert = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // アプリタイトル
                VStack(spacing: 10) {
                    Image(systemName: "fist.raised")
                        .font(.system(size: 60))
                        .foregroundColor(.orange)
                    
                    Text("世界一速いパンチ")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Text("あなたのパンチの瞬間を投稿して、世界一速いパンチを競いましょう！")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                .padding(.top, 40)
                
                Spacer()
                
                // 認証フォーム
                VStack(spacing: 16) {
                    // モード切り替え
                    Picker("認証モード", selection: $isLoginMode) {
                        Text("ログイン").tag(true)
                        Text("新規登録").tag(false)
                    }
                    .pickerStyle(SegmentedPickerStyle())
                    .padding(.horizontal)
                    
                    // 入力フィールド
                    VStack(spacing: 12) {
                        TextField("メールアドレス", text: $email)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        if !isLoginMode {
                            TextField("ユーザー名", text: $username)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .autocapitalization(.none)
                        }
                        
                        SecureField("パスワード", text: $password)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                    }
                    .padding(.horizontal)
                    
                    // エラーメッセージ
                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                            .padding(.horizontal)
                    }
                    
                    // 認証ボタン
                    Button(action: performAuth) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            }
                            Text(isLoginMode ? "ログイン" : "新規登録")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(isLoading || email.isEmpty || password.isEmpty || (!isLoginMode && username.isEmpty))
                    .padding(.horizontal)
                }
                
                Spacer()
            }
            .navigationBarHidden(true)
        }
        .alert("エラー", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func performAuth() {
        isLoading = true
        errorMessage = ""
        
        let publisher: AnyPublisher<AuthResponse, Error>
        
        if isLoginMode {
            publisher = apiService.login(email: email, password: password)
        } else {
            publisher = apiService.register(email: email, password: password, username: username)
        }
        
        publisher
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                        showAlert = true
                    }
                },
                receiveValue: { _ in
                    // 認証成功時の処理はAPIServiceで自動的に行われる
                }
            )
            .store(in: &apiService.cancellables)
    }
}

#Preview {
    AuthView()
        .environmentObject(APIService.shared)
}
