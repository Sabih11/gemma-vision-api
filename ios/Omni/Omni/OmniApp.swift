import SwiftUI

@main
struct OmniApp: App {
    @StateObject var auth = AuthManager()

    var body: some Scene {
        WindowGroup {
            Group {
                if auth.loading {
                    ProgressView().controlSize(.large)
                } else if auth.user != nil {
                    DashboardView()
                } else {
                    LoginView()
                }
            }
            .task { await auth.bootstrap() }
            .environmentObject(auth)
            .preferredColorScheme(.light)
            .tint(.black)
        }
    }
}
