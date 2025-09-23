import SwiftUI

@main
struct WorldFastestPunchApp: App {
    @StateObject private var apiService = APIService.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(apiService)
        }
    }
}
