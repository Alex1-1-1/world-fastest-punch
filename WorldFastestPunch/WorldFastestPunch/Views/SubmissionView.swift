import SwiftUI
import PhotosUI
import AVFoundation

struct SubmissionView: View {
    @StateObject private var apiService = APIService.shared
    @State private var selectedImage: UIImage?
    @State private var description = ""
    @State private var isShowingImagePicker = false
    @State private var isShowingCamera = false
    @State private var isSubmitting = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var agreedToTerms = false
    
    // カメラ許可を確認する関数
    private func ensureCameraPermission(_ completion: @escaping (Bool) -> Void) {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            completion(true)
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async { completion(granted) }
            }
        default:
            completion(false)
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // ヘッダー
                    VStack(spacing: 12) {
                        Image(systemName: "camera")
                            .font(.system(size: 50))
                            .foregroundColor(.orange)
                        
                        Text("パンチ画像を投稿")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("あなたのパンチの瞬間を投稿して、世界一速いパンチを競いましょう！")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    
                    // 注意事項
                    VStack(alignment: .leading, spacing: 8) {
                        Text("⚠️ 投稿時の注意事項")
                            .font(.headline)
                            .foregroundColor(.orange)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("• 血、殴られている人、公序良俗に反する内容は禁止です")
                            Text("• 画像は2MB以下、JPEG/PNG形式のみ対応")
                            Text("• 投稿された画像は透かしが入り、管理者による判定が必要です")
                            Text("• 不適切な内容と判断された場合は削除される場合があります")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.yellow.opacity(0.1))
                    .cornerRadius(12)
                    
                    // 画像選択
                    VStack(alignment: .leading, spacing: 12) {
                        Text("画像を選択")
                            .font(.headline)
                        
                        if let selectedImage = selectedImage {
                            VStack(spacing: 12) {
                                Image(uiImage: selectedImage)
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(maxHeight: 300)
                                    .cornerRadius(12)
                                
                                Button("変更") {
                                    self.selectedImage = nil
                                }
                                .foregroundColor(.orange)
                            }
                        } else {
                            VStack(spacing: 16) {
                                HStack(spacing: 16) {
                                    // カメラボタン
                                    Button(action: {
                                        print("カメラボタンがタップされました")
                                        print("カメラ利用可能: \(UIImagePickerController.isSourceTypeAvailable(.camera))")
                                        
                                        guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
                                            print("カメラが利用できないため、写真ライブラリを開きます")
                                            isShowingImagePicker = true
                                            return
                                        }
                                        
                                        print("カメラ許可を確認中...")
                                        ensureCameraPermission { granted in
                                            print("カメラ許可結果: \(granted)")
                                            if granted {
                                                print("カメラを開きます")
                                                isShowingCamera = true
                                            } else {
                                                print("カメラ許可が拒否されました")
                                                alertMessage = "カメラへのアクセスが許可されていません。設定アプリから許可してください。"
                                                showingAlert = true
                                            }
                                        }
                                    }) {
                                        VStack(spacing: 8) {
                                            Image(systemName: UIImagePickerController.isSourceTypeAvailable(.camera) ? "camera" : "photo.on.rectangle")
                                                .font(.system(size: 30))
                                                .foregroundColor(.green)
                                            Text(UIImagePickerController.isSourceTypeAvailable(.camera) ? "カメラで撮影" : "写真ライブラリ")
                                                .font(.caption)
                                                .foregroundColor(.green)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding()
                                        .background(Color.green.opacity(0.1))
                                        .cornerRadius(12)
                                    }
                                    
                                    // ライブラリボタン
                                    Button(action: {
                                        isShowingImagePicker = true
                                    }) {
                                        VStack(spacing: 8) {
                                            Image(systemName: "photo.on.rectangle")
                                                .font(.system(size: 30))
                                                .foregroundColor(.blue)
                                            Text("ライブラリから選択")
                                                .font(.caption)
                                                .foregroundColor(.blue)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding()
                                        .background(Color.blue.opacity(0.1))
                                        .cornerRadius(12)
                                    }
                                }
                                
                                VStack(spacing: 4) {
                                    Text("対応形式: JPEG, PNG\nファイルサイズ: 2MB以下")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .multilineTextAlignment(.center)
                                    
                                    if !UIImagePickerController.isSourceTypeAvailable(.camera) {
                                        Text("※ シミュレーターでは写真ライブラリから選択します")
                                            .font(.caption2)
                                            .foregroundColor(.orange)
                                            .multilineTextAlignment(.center)
                                    }
                                }
                            }
                        }
                    }
                    
                    // 説明文
                    VStack(alignment: .leading, spacing: 8) {
                        Text("説明文（オプション）")
                            .font(.headline)
                        
                        TextField("パンチについて説明してください", text: $description, axis: .vertical)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .lineLimit(3...6)
                    }
                    
                    // 利用規約同意
                    HStack {
                        Button(action: {
                            agreedToTerms.toggle()
                        }) {
                            Image(systemName: agreedToTerms ? "checkmark.square.fill" : "square")
                                .foregroundColor(agreedToTerms ? .orange : .gray)
                        }
                        
                        Text("上記の注意事項を理解し、利用規約に同意します")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    // 投稿ボタン
                    Button(action: submitSubmission) {
                        HStack {
                            if isSubmitting {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .foregroundColor(.white)
                            } else {
                                Image(systemName: "paperplane")
                            }
                            Text(isSubmitting ? "投稿中..." : "投稿する")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(canSubmit ? Color.orange : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!canSubmit || isSubmitting)
                    
                    Spacer(minLength: 20)
                }
                .padding()
            }
            .navigationTitle("投稿")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $isShowingImagePicker) {
                ImagePicker(selectedImage: $selectedImage)
            }
            .sheet(isPresented: $isShowingCamera) {
                CameraView(selectedImage: $selectedImage)
            }
            .alert("投稿結果", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    private var canSubmit: Bool {
        selectedImage != nil && agreedToTerms
    }
    
    private func submitSubmission() {
        guard let image = selectedImage,
              let imageData = image.jpegData(compressionQuality: 0.8) else {
            return
        }
        
        isSubmitting = true
        
        Task {
            do {
                let submission = try await apiService.createSubmission(
                    image: imageData,
                    description: description,
                    username: apiService.currentUser?.username ?? "ユーザー",
                    email: apiService.currentUser?.email ?? "user@example.com"
                ).async()
                
                await MainActor.run {
                    alertMessage = "投稿が完了しました！管理者による判定をお待ちください。"
                    showingAlert = true
                    resetForm()
                }
            } catch {
                await MainActor.run {
                    alertMessage = "投稿に失敗しました: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
            isSubmitting = false
        }
    }
    
    private func resetForm() {
        selectedImage = nil
        description = ""
        agreedToTerms = false
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            
            guard let provider = results.first?.itemProvider else { return }
            
            if provider.canLoadObject(ofClass: UIImage.self) {
                provider.loadObject(ofClass: UIImage.self) { image, _ in
                    DispatchQueue.main.async {
                        self.parent.selectedImage = image as? UIImage
                    }
                }
            }
        }
    }
}

// MARK: - Camera View
struct CameraView: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.dismiss) private var dismiss
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.allowsEditing = true
        
        // カメラが利用可能かチェック
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            picker.sourceType = .camera
        } else {
            picker.sourceType = .photoLibrary
        }
        
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView
        
        init(_ parent: CameraView) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.editedImage] as? UIImage ?? info[.originalImage] as? UIImage {
                parent.selectedImage = image
            }
            parent.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    SubmissionView()
}