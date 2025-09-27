import SwiftUI

// MARK: - Safe AsyncImage
struct SafeAsyncImage: View {
    let url: URL?
    let contentMode: ContentMode
    let frame: (width: CGFloat?, height: CGFloat?)
    
    init(
        url: URL?,
        contentMode: ContentMode = .fit,
        frame: (width: CGFloat?, height: CGFloat?) = (nil, nil)
    ) {
        self.url = url
        self.contentMode = contentMode
        self.frame = frame
    }
    
    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
                    .frame(
                        width: frame.width,
                        height: frame.height
                    )
            case .failure(_):
                // エラー時のフォールバック
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(
                        width: frame.width,
                        height: frame.height
                    )
                    .overlay(
                        Image(systemName: "photo")
                            .font(.title2)
                            .foregroundColor(.gray)
                    )
            case .empty:
                // 読み込み中
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(
                        width: frame.width,
                        height: frame.height
                    )
                    .overlay(
                        ProgressView()
                    )
            @unknown default:
                // 未知の状態
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(
                        width: frame.width,
                        height: frame.height
                    )
            }
        }
    }
}

// MARK: - Safe Profile Image
struct SafeProfileImage: View {
    let url: URL?
    let size: CGFloat
    
    init(url: URL?, size: CGFloat = 100) {
        self.url = url
        self.size = size
    }
    
    var body: some View {
        SafeAsyncImage(
            url: url,
            contentMode: .fill,
            frame: (width: size, height: size)
        )
        .clipShape(Circle())
    }
}

// MARK: - Safe Submission Image
struct SafeSubmissionImage: View {
    let url: URL?
    let height: CGFloat
    
    init(url: URL?, height: CGFloat = 150) {
        self.url = url
        self.height = height
    }
    
    var body: some View {
        SafeAsyncImage(
            url: url,
            contentMode: .fill,
            frame: (width: nil, height: height)
        )
        .clipped()
        .cornerRadius(12)
    }
}
