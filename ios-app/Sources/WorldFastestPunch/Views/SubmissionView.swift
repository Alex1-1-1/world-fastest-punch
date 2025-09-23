import SwiftUI
import PhotosUI
import AVFoundation

struct SubmissionView: View {
    @EnvironmentObject var apiService: APIService
    @State private var selectedImage: UIImage?
    @State private var description = ""
    @State private var isShowingImagePicker = false
    @State private var isShowingCamera = false
    @State private var isSubmitting = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // ヘッダー
                    VStack(spacing: 10) {
                        Image(systemName: "fist.raised")
                            .font(.system(size: 40))
                            .foregroundColor(.orange)
                        
                        Text("パンチ画像を投稿")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text("あなたのパンチの瞬間を投稿して、世界一速いパンチを競いましょう！")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top)
                    
                    // 注意事項
                    VStack(alignment: .leading, spacing: 8) {
                        Text("投稿時の注意事項")
                            .font(.headline)
                            .foregroundColor(.orange)
                        
                        VStack(alignment: .leading, spacing: 4) {
                            Text("• 血、殴られている人、公序良俗に反する内容は禁止です")
                            Text("• 画像は2MB以下、JPEG/PNG/TIFF形式のみ対応")
                            Text("• 投稿された画像は透かしが入り、管理者による判定が必要です")
                            Text("• 不適切な内容と判断された場合は削除される場合があります")
                        }
                        .font(.caption)
                        .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(10)
                    
                    // 画像選択
                    VStack(spacing: 16) {
                        Text("画像を選択")
                            .font(.headline)
                        
                        if let selectedImage = selectedImage {
                            Image(uiImage: selectedImage)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                                .frame(height: 200)
                                .clipped()
                                .cornerRadius(10)
                                .overlay(
                                    Button("変更") {
                                        isShowingImagePicker = true
                                    }
                                    .padding()
                                    .background(Color.black.opacity(0.7))
                                    .foregroundColor(.white)
                                    .cornerRadius(8),
                                    alignment: .bottomTrailing
                                )
                        } else {
                            VStack(spacing: 16) {
                                Image(systemName: "photo")
                                    .font(.system(size: 60))
                                    .foregroundColor(.gray)
                                
                                Text("画像を選択してください")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                                
                                HStack(spacing: 20) {
                                    Button("ファイルから選択") {
                                        isShowingImagePicker = true
                                    }
                                    .buttonStyle(.bordered)
                                    
                                    Button("カメラで撮影") {
                                        isShowingCamera = true
                                    }
                                    .buttonStyle(.bordered)
                                }
                            }
                            .frame(height: 200)
                            .frame(maxWidth: .infinity)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(10)
                        }
                    }
                    
                    // 説明文
                    VStack(alignment: .leading, spacing: 8) {
                        Text("説明文(オプション)")
                            .font(.headline)
                        
                        TextField("パンチについて説明してください", text: $description, axis: .vertical)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .lineLimit(3...6)
                    }
                    
                    // 投稿ボタン
                    Button(action: submitPunch) {
                        HStack {
                            if isSubmitting {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            }
                            Text("投稿する")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(selectedImage != nil ? Color.orange : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(selectedImage == nil || isSubmitting)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("投稿")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $isShowingImagePicker) {
            ImagePicker(selectedImage: $selectedImage)
        }
        .sheet(isPresented: $isShowingCamera) {
            CameraView(selectedImage: $selectedImage)
        }
        .alert(isSuccess ? "成功" : "エラー", isPresented: $showAlert) {
            Button("OK") {
                if isSuccess {
                    selectedImage = nil
                    description = ""
                }
            }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func submitPunch() {
        guard let image = selectedImage,
              let imageData = image.jpegData(compressionQuality: 0.8),
              let user = apiService.currentUser else {
            return
        }
        
        isSubmitting = true
        
        apiService.createSubmission(
            image: imageData,
            description: description,
            username: user.username,
            email: user.email
        )
        .receive(on: DispatchQueue.main)
        .sink(
            receiveCompletion: { completion in
                isSubmitting = false
                if case .failure(let error) = completion {
                    alertMessage = error.localizedDescription
                    isSuccess = false
                    showAlert = true
                }
            },
            receiveValue: { _ in
                alertMessage = "投稿が完了しました！管理者による判定をお待ちください。"
                isSuccess = true
                showAlert = true
            }
        )
        .store(in: &apiService.cancellables)
    }
}

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
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
            
            guard let provider = results.first?.itemProvider,
                  provider.canLoadObject(ofClass: UIImage.self) else { return }
            
            provider.loadObject(ofClass: UIImage.self) { image, _ in
                DispatchQueue.main.async {
                    self.parent.selectedImage = image as? UIImage
                }
            }
        }
    }
}

struct CameraView: UIViewControllerRepresentable {
    @Binding var selectedImage: UIImage?
    @Environment(\.presentationMode) var presentationMode
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera
        picker.allowsEditing = true
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
            parent.presentationMode.wrappedValue.dismiss()
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.presentationMode.wrappedValue.dismiss()
        }
    }
}

#Preview {
    SubmissionView()
        .environmentObject(APIService.shared)
}
