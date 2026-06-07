import AuthenticationServices
import Foundation
import SwiftUI

@MainActor
final class AuthManager: NSObject, ObservableObject {
    @Published var user: User?
    @Published var loading: Bool = true
    @Published var error: String?

    func bootstrap() async {
        loading = true
        defer { loading = false }
        guard APIClient.shared.sessionToken != nil else { user = nil; return }
        do { user = try await APIClient.shared.me() } catch { user = nil }
    }

    func loginWithEmergent() async {
        error = nil
        do {
            let sessionId = try await startWebAuth()
            let resp = try await APIClient.shared.exchangeSession(sessionId: sessionId)
            user = resp.user
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "\(error)"
        }
    }

    func loginWithManualSessionId(_ sessionId: String) async {
        error = nil
        do {
            let resp = try await APIClient.shared.exchangeSession(sessionId: sessionId)
            user = resp.user
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "\(error)"
        }
    }

    func logout() async {
        await APIClient.shared.logout()
        user = nil
    }

    private func startWebAuth() async throws -> String {
        try await withCheckedThrowingContinuation { (cont: CheckedContinuation<String, Error>) in
            let session = ASWebAuthenticationSession(
                url: Config.emergentAuthURL,
                callbackURLScheme: Config.oauthScheme
            ) { callback, err in
                if let err = err {
                    cont.resume(throwing: err); return
                }
                guard let cb = callback,
                      let frag = cb.fragment ?? URLComponents(url: cb, resolvingAgainstBaseURL: false)?.query
                else {
                    cont.resume(throwing: APIError(message: "Missing callback fragment"))
                    return
                }
                let pair = frag.split(separator: "&").first { $0.hasPrefix("session_id=") }
                if let p = pair {
                    let value = String(p.dropFirst("session_id=".count))
                    cont.resume(returning: value)
                } else {
                    cont.resume(throwing: APIError(message: "session_id not found"))
                }
            }
            session.presentationContextProvider = WebAuthContextProvider.shared
            session.prefersEphemeralWebBrowserSession = true
            session.start()
        }
    }
}

final class WebAuthContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = WebAuthContextProvider()
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
