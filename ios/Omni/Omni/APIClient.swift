import Foundation
import UIKit

final class APIClient {
    static let shared = APIClient()
    private init() {}

    var sessionToken: String? {
        get { KeychainStore.shared.read(key: "session_token") }
        set {
            if let v = newValue { KeychainStore.shared.save(key: "session_token", value: v) }
            else { KeychainStore.shared.delete(key: "session_token") }
        }
    }

    private func authedRequest(path: String, method: String = "GET") -> URLRequest {
        var req = URLRequest(url: Config.apiBaseURL.appendingPathComponent(path))
        req.httpMethod = method
        if let t = sessionToken {
            req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        return req
    }

    private func parse<T: Decodable>(_ data: Data, _ resp: URLResponse) throws -> T {
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw APIError(message: "HTTP \( (resp as? HTTPURLResponse)?.statusCode ?? -1 ): \(body)")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // MARK: Auth
    func exchangeSession(sessionId: String) async throws -> AuthResponse {
        var req = authedRequest(path: "auth/google", method: "POST")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONEncoder().encode(["session_id": sessionId])
        let (data, resp) = try await URLSession.shared.data(for: req)
        let auth: AuthResponse = try parse(data, resp)
        sessionToken = auth.session_token
        return auth
    }

    func me() async throws -> User {
        let req = authedRequest(path: "auth/me")
        let (data, resp) = try await URLSession.shared.data(for: req)
        return try parse(data, resp)
    }

    func logout() async {
        let req = authedRequest(path: "auth/logout", method: "POST")
        _ = try? await URLSession.shared.data(for: req)
        sessionToken = nil
    }

    // MARK: Multipart helper
    private func multipart(path: String, fields: [String: String], files: [(name: String, filename: String, mime: String, data: Data)]) async throws -> Data {
        let boundary = "----OmniBoundary\(UUID().uuidString)"
        var req = authedRequest(path: path, method: "POST")
        req.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        var body = Data()
        let lb = "\r\n".data(using: .utf8)!
        for (k, v) in fields {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(k)\"\r\n\r\n".data(using: .utf8)!)
            body.append(v.data(using: .utf8)!)
            body.append(lb)
        }
        for f in files {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(f.name)\"; filename=\"\(f.filename)\"\r\n".data(using: .utf8)!)
            body.append("Content-Type: \(f.mime)\r\n\r\n".data(using: .utf8)!)
            body.append(f.data)
            body.append(lb)
        }
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        req.httpBody = body
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError(message: "HTTP \((resp as? HTTPURLResponse)?.statusCode ?? -1): \(String(data: data, encoding: .utf8) ?? "")")
        }
        return data
    }

    // MARK: Endpoints
    func askImage(question: String, image: UIImage) async throws -> AskResponse {
        guard let jpeg = image.jpegData(compressionQuality: 0.85) else {
            throw APIError(message: "Failed to encode image")
        }
        let data = try await multipart(
            path: "ask",
            fields: ["question": question],
            files: [(name: "image", filename: "photo.jpg", mime: "image/jpeg", data: jpeg)]
        )
        return try JSONDecoder().decode(AskResponse.self, from: data)
    }

    func transcribe(fileURL: URL) async throws -> TranscribeResponse {
        let bytes = try Data(contentsOf: fileURL)
        let filename = fileURL.lastPathComponent
        let mime = mimeFor(ext: fileURL.pathExtension.lowercased())
        let data = try await multipart(
            path: "transcribe",
            fields: [:],
            files: [(name: "audio", filename: filename, mime: mime, data: bytes)]
        )
        return try JSONDecoder().decode(TranscribeResponse.self, from: data)
    }

    func history() async throws -> [HistoryItem] {
        let req = authedRequest(path: "history")
        let (data, resp) = try await URLSession.shared.data(for: req)
        return try parse(data, resp)
    }

    func deleteHistory(id: String) async throws {
        let req = authedRequest(path: "history/\(id)", method: "DELETE")
        let (_, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError(message: "Delete failed")
        }
    }

    private func mimeFor(ext: String) -> String {
        switch ext {
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        case "m4a": return "audio/m4a"
        case "mp4": return "audio/mp4"
        case "webm": return "audio/webm"
        case "ogg": return "audio/ogg"
        case "flac": return "audio/flac"
        default: return "application/octet-stream"
        }
    }
}
