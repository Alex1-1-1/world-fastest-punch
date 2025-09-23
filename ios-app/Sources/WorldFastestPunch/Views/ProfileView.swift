import SwiftUI
import PhotosUI

struct ProfileView: View {
    @EnvironmentObject var apiService: APIService
    @State private var profile: UserProfile?
    @State private var isLoading = false
    @State private var isEditing = false
    @State private var errorMessage = ""
    @State private var showAlert = false
    @State private var showImagePicker = false
    @State private var selectedImage: UIImage?
    
    // 編集用の状態
    @State private var editBio = ""
    @State private var editUsername = ""
    @State private var editEmail = ""
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    VStack {
                        ProgressView("読み込み中...")
                        Spacer()
                    }
                } else if let profile = profile {
                    ScrollView {
                        VStack(spacing: 20) {
                            // プロフィール画像
                            VStack(spacing: 16) {
                                AsyncImage(url: URL(string: profile.profileImage ?? "")) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Image(systemName: "person.circle.fill")
                                        .font(.system(size: 80))
                                        .foregroundColor(.gray)
                                }
                                .frame(width: 100, height: 100)
                                .clipShape(Circle())
                                .overlay(
                                    Circle()
                                        .stroke(Color.orange, lineWidth: 3)
                                )
                                
                                if isEditing {
                                    Button("画像を変更") {
                                        showImagePicker = true
                                    }
                                    .buttonStyle(.bordered)
                                }
                            }
                            
                            // ユーザー情報
                            VStack(spacing: 16) {
                                if isEditing {
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("ユーザー名")
                                            .font(.headline)
                                        TextField("ユーザー名", text: $editUsername)
                                            .textFieldStyle(RoundedBorderTextFieldStyle())
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("メールアドレス")
                                            .font(.headline)
                                        TextField("メールアドレス", text: $editEmail)
                                            .textFieldStyle(RoundedBorderTextFieldStyle())
                                            .keyboardType(.emailAddress)
                                            .autocapitalization(.none)
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 8) {
                                        Text("自己紹介")
                                            .font(.headline)
                                        TextField("自己紹介を入力してください", text: $editBio, axis: .vertical)
                                            .textFieldStyle(RoundedBorderTextFieldStyle())
                                            .lineLimit(3...6)
                                    }
                                } else {
                                    VStack(spacing: 12) {
                                        Text(profile.role == "ADMIN" ? "管理者" : "ユーザー")
                                            .font(.headline)
                                            .foregroundColor(.orange)
                                        
                                        if !profile.bio.isEmpty {
                                            Text(profile.bio)
                                                .font(.body)
                                                .multilineTextAlignment(.center)
                                        }
                                        
                                        Text("登録日: \(formatDate(profile.createdAt))")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(12)
                            
                            // アクションボタン
                            VStack(spacing: 12) {
                                if isEditing {
                                    Button("保存") {
                                        saveProfile()
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(.orange)
                                    
                                    Button("キャンセル") {
                                        cancelEditing()
                                    }
                                    .buttonStyle(.bordered)
                                } else {
                                    Button("編集") {
                                        startEditing()
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(.orange)
                                }
                                
                                Button("ログアウト") {
                                    apiService.logout()
                                }
                                .buttonStyle(.bordered)
                                .foregroundColor(.red)
                            }
                            
                            Spacer()
                        }
                        .padding()
                    }
                } else {
                    VStack(spacing: 20) {
                        Image(systemName: "person.circle")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("プロフィールを読み込めませんでした")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        
                        Button("再読み込み") {
                            loadProfile()
                        }
                        .buttonStyle(.bordered)
                    }
                    .padding()
                }
            }
            .navigationTitle("プロフィール")
            .onAppear {
                loadProfile()
            }
        }
        .sheet(isPresented: $showImagePicker) {
            ImagePicker(selectedImage: $selectedImage)
        }
        .alert("エラー", isPresented: $showAlert) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
    }
    
    private func loadProfile() {
        isLoading = true
        errorMessage = ""
        
        apiService.getProfile()
            .receive(on: DispatchQueue.main)
            .sink(
                receiveCompletion: { completion in
                    isLoading = false
                    if case .failure(let error) = completion {
                        errorMessage = error.localizedDescription
                        showAlert = true
                    }
                },
                receiveValue: { profile in
                    self.profile = profile
                }
            )
            .store(in: &apiService.cancellables)
    }
    
    private func startEditing() {
        guard let profile = profile else { return }
        editBio = profile.bio
        editUsername = apiService.currentUser?.username ?? ""
        editEmail = apiService.currentUser?.email ?? ""
        isEditing = true
    }
    
    private func cancelEditing() {
        isEditing = false
        selectedImage = nil
    }
    
    private func saveProfile() {
        guard let user = apiService.currentUser else { return }
        
        let imageData = selectedImage?.jpegData(compressionQuality: 0.8)
        
        apiService.updateProfile(
            bio: editBio,
            username: editUsername,
            email: editEmail,
            profileImage: imageData
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completion in
                if case .failure(let error) = completion {
                    errorMessage = error.localizedDescription
                    showAlert = true
                }
            },
            receiveValue: { updatedProfile in
                self.profile = updatedProfile
                self.isEditing = false
                self.selectedImage = nil
            }
        )
        .store(in: &apiService.cancellables)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        formatter.timeZone = TimeZone(abbreviation: "UTC")
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateFormat = "yyyy年MM月dd日"
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

#Preview {
    ProfileView()
        .environmentObject(APIService.shared)
}
