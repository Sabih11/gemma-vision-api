import Foundation

enum Config {
    /// Backend base URL. Replace if deploying elsewhere.
    static let backendBaseURL: URL = URL(string: "https://db6297b9-52c0-4d8e-8803-31e1928c9911.preview.emergentagent.com")!

    static var apiBaseURL: URL { backendBaseURL.appendingPathComponent("api") }

    /// Custom URL scheme used as OAuth redirect.
    static let oauthScheme = "omni"
    static var oauthRedirect: String { "\(oauthScheme)://callback" }

    static var emergentAuthURL: URL {
        var c = URLComponents(string: "https://auth.emergentagent.com/")!
        c.queryItems = [URLQueryItem(name: "redirect", value: oauthRedirect)]
        return c.url!
    }
}
