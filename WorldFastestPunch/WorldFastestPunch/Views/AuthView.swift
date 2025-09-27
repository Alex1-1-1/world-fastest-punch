import SwiftUI

struct AuthView: View {
    @StateObject private var apiService = APIService.shared
    @State private var isLoginMode = true
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 32) {
                    // ヘッダー
                    VStack(spacing: 16) {
                        // ロゴ
                        Image(systemName: "fist.raised.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.orange)
                        
                        Text("世界一速いパンチ")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                        
                        Text(isLoginMode ? "アカウントにログインして投稿を開始しましょう" : "アカウントを作成してパンチを競い合いましょう")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 40)
                    
                    // ログインフォーム
                    VStack(spacing: 24) {
                        // メールアドレス
                        VStack(alignment: .leading, spacing: 8) {
                            Text("メールアドレス")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            HStack {
                                Image(systemName: "envelope")
                                    .foregroundColor(.gray)
                                    .frame(width: 20)
                                
                                TextField("メールアドレスを入力", text: $email)
                                    .textFieldStyle(PlainTextFieldStyle())
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                            }
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(12)
                        }
                        
                        // パスワード
                        VStack(alignment: .leading, spacing: 8) {
                            Text("パスワード")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            HStack {
                                Image(systemName: "lock")
                                    .foregroundColor(.gray)
                                    .frame(width: 20)
                                
                                SecureField("パスワードを入力", text: $password)
                                    .textFieldStyle(PlainTextFieldStyle())
                            }
                            .padding()
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(12)
                        }
                        
                        // 新規登録時の追加フィールド
                        if !isLoginMode {
                            // ユーザー名
                            VStack(alignment: .leading, spacing: 8) {
                                Text("ユーザー名")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                HStack {
                                    Image(systemName: "person")
                                        .foregroundColor(.gray)
                                        .frame(width: 20)
                                    
                                    TextField("ユーザー名を入力", text: $username)
                                        .textFieldStyle(PlainTextFieldStyle())
                                        .autocapitalization(.none)
                                        .disableAutocorrection(true)
                                }
                                .padding()
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(12)
                            }
                            
                            // パスワード確認
                            VStack(alignment: .leading, spacing: 8) {
                                Text("パスワード確認")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                
                                HStack {
                                    Image(systemName: "lock")
                                        .foregroundColor(.gray)
                                        .frame(width: 20)
                                    
                                    SecureField("パスワードを再入力", text: $confirmPassword)
                                        .textFieldStyle(PlainTextFieldStyle())
                                }
                                .padding()
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(12)
                            }
                        }
                        
                        // ログイン/登録ボタン
                        Button(action: handleAuth) {
                            HStack {
                                if isLoading {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                        .foregroundColor(.white)
                                } else {
                                    Image(systemName: isLoginMode ? "arrow.right.square" : "person.badge.plus")
                                }
                                Text(isLoading ? "処理中..." : (isLoginMode ? "ログイン" : "新規登録"))
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(canSubmit ? Color.orange : Color.gray)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(!canSubmit || isLoading)
                        
                        // パスワードリセット（ログインモードのみ）
                        if isLoginMode {
                            Button("パスワードを忘れた場合") {
                                // パスワードリセット機能（後で実装）
                                alertMessage = "パスワードリセット機能は準備中です"
                                showingAlert = true
                            }
                            .font(.caption)
                            .foregroundColor(.blue)
                        }
                    }
                    .padding(.horizontal, 32)
                    
                    // 区切り線
                    HStack {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 1)
                        Text("または")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding(.horizontal, 16)
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 1)
                    }
                    .padding(.horizontal, 32)
                    
                    // ソーシャルログイン
                    VStack(spacing: 16) {
                        // Googleログイン
                        Button(action: {
                            // Googleログイン機能（後で実装）
                            alertMessage = "Googleログイン機能は準備中です"
                            showingAlert = true
                        }) {
                            HStack {
                                Image(systemName: "globe")
                                    .foregroundColor(.blue)
                                Text("Googleでログイン")
                                    .foregroundColor(.blue)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(12)
                        }
                        
                        // Appleログイン
                        Button(action: {
                            // Appleログイン機能（後で実装）
                            alertMessage = "Appleログイン機能は準備中です"
                            showingAlert = true
                        }) {
                            HStack {
                                Image(systemName: "applelogo")
                                    .foregroundColor(.black)
                                Text("Appleでログイン")
                                    .foregroundColor(.black)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.black.opacity(0.1))
                            .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal, 32)
                    
                    // モード切り替え
                    HStack {
                        Text(isLoginMode ? "アカウントをお持ちでない方は" : "既にアカウントをお持ちの方は")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Button(isLoginMode ? "こちら" : "こちら") {
                            withAnimation {
                                isLoginMode.toggle()
                                clearForm()
                            }
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                    }
                    .padding(.horizontal, 32)
                    
                    // 利用規約
                    Text("ログインすることで、利用規約およびプライバシーポリシーに同意したものとみなされます。")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                    
                    Spacer(minLength: 40)
                }
            }
            .navigationBarHidden(true)
            .alert("認証結果", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    private var canSubmit: Bool {
        if isLoginMode {
            return !email.isEmpty && !password.isEmpty
        } else {
            return !email.isEmpty && !password.isEmpty && !username.isEmpty && password == confirmPassword
        }
    }
    
    private func clearForm() {
        email = ""
        password = ""
        username = ""
        confirmPassword = ""
    }
    
    private func handleAuth() {
        guard canSubmit else { 
            print("❌ フォームバリデーションエラー: 必須フィールドが入力されていません")
            return 
        }
        
        print("🚀 認証処理開始")
        print("📧 メール: \(email)")
        print("🔐 パスワード: \(password)")
        if !isLoginMode {
            print("👤 ユーザー名: \(username)")
        }
        
        isLoading = true
        
        Task {
            do {
                if isLoginMode {
                    // ログイン処理
                    print("🔑 ログイン処理を開始")
                    let authResponse = try await apiService.login(email: email, password: password).async()
                    print("✅ ログイン成功: \(authResponse)")
                    await MainActor.run {
                        alertMessage = "ログインに成功しました！"
                        showingAlert = true
                    }
                } else {
                    // 新規登録処理
                    print("📝 新規登録処理を開始")
                    let authResponse = try await apiService.register(email: email, password: password, username: username).async()
                    print("✅ 新規登録成功: \(authResponse)")
                    await MainActor.run {
                        alertMessage = "アカウントが作成されました！"
                        showingAlert = true
                    }
                }
            } catch {
                print("❌ 認証エラー発生")
                print("❌ エラータイプ: \(type(of: error))")
                print("❌ エラーメッセージ: \(error.localizedDescription)")
                print("❌ エラーの詳細: \(error)")
                
                // より詳細なエラー情報を取得
                if let urlError = error as? URLError {
                    print("🌐 URLエラー: \(urlError.localizedDescription)")
                    print("🌐 エラーコード: \(urlError.code.rawValue)")
                }
                
                await MainActor.run {
                    alertMessage = "エラーが発生しました: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
            await MainActor.run {
                isLoading = false
            }
        }
    }
}

#Preview {
    AuthView()
}