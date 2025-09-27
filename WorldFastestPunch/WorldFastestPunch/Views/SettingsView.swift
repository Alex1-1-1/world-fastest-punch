import SwiftUI
import PhotosUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var apiService = APIService.shared
    @State private var userProfile: UserProfile?
    @State private var username: String = ""
    @State private var email: String = ""
    @State private var bio: String = ""
    @State private var profileImage: UIImage?
    @State private var isShowingImagePicker = false
    @State private var isSaving = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    init(userProfile: UserProfile?) {
        self._userProfile = State(initialValue: userProfile)
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // プロフィール画像
                    VStack(spacing: 16) {
                        Text("プロフィール画像")
                            .font(.headline)
                        
                        Button(action: {
                            isShowingImagePicker = true
                        }) {
                            if let profileImage = profileImage {
                                Image(uiImage: profileImage)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(width: 120, height: 120)
                                    .clipShape(Circle())
                                    .overlay(
                                        Circle()
                                            .stroke(Color.orange, lineWidth: 3)
                                    )
                            } else {
                                Circle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 120, height: 120)
                                    .overlay(
                                        VStack(spacing: 8) {
                                            Image(systemName: "camera")
                                                .font(.system(size: 30))
                                                .foregroundColor(.gray)
                                            Text("画像を選択")
                                                .font(.caption)
                                                .foregroundColor(.gray)
                                        }
                                    )
                            }
                        }
                        
                        if profileImage != nil {
                            Button("画像を削除") {
                                profileImage = nil
                            }
                            .font(.caption)
                            .foregroundColor(.red)
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(16)
                    
                    // ユーザー情報フォーム
                    VStack(spacing: 16) {
                        Text("ユーザー情報")
                            .font(.headline)
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("ユーザー名")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            TextField("ユーザー名を入力", text: $username)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("メールアドレス")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            TextField("メールアドレスを入力", text: $email)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("自己紹介")
                                .font(.subheadline)
                                .fontWeight(.medium)
                            
                            TextField("自己紹介を入力", text: $bio, axis: .vertical)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .lineLimit(3...6)
                        }
                    }
                    .padding()
                    .background(Color.gray.opacity(0.05))
                    .cornerRadius(16)
                    
                    // 保存ボタン
                    Button(action: saveProfile) {
                        HStack {
                            if isSaving {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .foregroundColor(.white)
                            } else {
                                Image(systemName: "checkmark")
                            }
                            Text(isSaving ? "保存中..." : "保存")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(canSave ? Color.orange : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!canSave || isSaving)
                    
                    Spacer(minLength: 20)
                }
                .padding()
            }
            .navigationTitle("設定")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("キャンセル") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $isShowingImagePicker) {
                ImagePicker(selectedImage: $profileImage)
            }
            .alert("保存結果", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .onAppear {
                loadProfileData()
            }
        }
    }
    
    private var canSave: Bool {
        !username.isEmpty && !email.isEmpty
    }
    
    private func loadProfileData() {
        username = apiService.currentUser?.username ?? ""
        email = apiService.currentUser?.email ?? ""
        bio = userProfile?.bio ?? ""
    }
    
    private func saveProfile() {
        guard canSave else { return }
        
        isSaving = true
        
        Task {
            do {
                let imageData = profileImage?.jpegData(compressionQuality: 0.8)
                let updatedProfile = try await apiService.updateProfile(
                    bio: bio,
                    username: username,
                    email: email,
                    profileImage: imageData
                ).async()
                
                await MainActor.run {
                    userProfile = updatedProfile
                    alertMessage = "設定が保存されました！"
                    showingAlert = true
                }
            } catch {
                await MainActor.run {
                    alertMessage = "保存に失敗しました: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
            isSaving = false
        }
    }
}

#Preview {
    SettingsView(userProfile: nil)
}

