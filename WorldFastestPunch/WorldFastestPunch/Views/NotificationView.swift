import SwiftUI

struct NotificationView: View {
    @StateObject private var apiService = APIService.shared
    @State private var notifications: [Notification] = []
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            VStack {
                if isLoading {
                    ProgressView("読み込み中...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if notifications.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "bell")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("通知はありません")
                            .font(.title2)
                            .foregroundColor(.gray)
                        
                        Text("パンチを投稿すると、ここに通知が表示されます")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(notifications) { notification in
                                NotificationCardView(notification: notification) {
                                    markAsRead(notification)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("通知")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                await loadNotifications()
            }
            .onAppear {
                Task {
                    await loadNotifications()
                }
            }
        }
    }
    
    @MainActor
    private func loadNotifications() async {
        isLoading = true
        do {
            let fetchedNotifications = try await apiService.getNotifications().async()
            notifications = fetchedNotifications
        } catch {
            print("Error loading notifications: \(error)")
        }
        isLoading = false
    }
    
    private func markAsRead(_ notification: Notification) {
        Task {
            do {
                _ = try await apiService.markNotificationAsRead(notificationId: notification.id).async()
                await MainActor.run {
                    // 通知を更新
                    if let index = notifications.firstIndex(where: { $0.id == notification.id }) {
                        notifications[index] = Notification(
                            id: notification.id,
                            type: notification.type,
                            title: notification.title,
                            message: notification.message,
                            isRead: true,
                            createdAt: notification.createdAt
                        )
                    }
                }
            } catch {
                print("Error marking notification as read: \(error)")
            }
        }
    }
}

struct NotificationCardView: View {
    let notification: Notification
    let onMarkAsRead: () -> Void
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // 通知アイコン
            Image(systemName: notificationIcon)
                .font(.title2)
                .foregroundColor(notificationColor)
                .frame(width: 30)
            
            // 通知内容
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(notification.title)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    if !notification.isRead {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 8, height: 8)
                    }
                }
                
                Text(notification.message)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                
                HStack {
                    Text(formatDate(notification.createdAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    if !notification.isRead {
                        Button("既読") {
                            onMarkAsRead()
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(notification.isRead ? Color.clear : Color.blue.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(notification.isRead ? Color.clear : Color.blue.opacity(0.3), lineWidth: 1)
        )
    }
    
    private var notificationIcon: String {
        switch notification.type {
        case "APPROVAL":
            return "checkmark.circle"
        case "REJECTION":
            return "xmark.circle"
        case "RANKING":
            return "trophy"
        default:
            return "bell"
        }
    }
    
    private var notificationColor: Color {
        switch notification.type {
        case "APPROVAL":
            return .green
        case "REJECTION":
            return .red
        case "RANKING":
            return .yellow
        default:
            return .blue
        }
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            displayFormatter.locale = Locale(identifier: "ja_JP")
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

#Preview {
    NotificationView()
}

