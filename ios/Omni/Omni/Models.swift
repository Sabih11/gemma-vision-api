import Foundation

struct User: Codable, Identifiable, Equatable {
    let user_id: String
    let email: String
    let name: String?
    let picture: String?
    var id: String { user_id }
}

struct AuthResponse: Codable {
    let user: User
    let session_token: String
}

struct AskResponse: Codable {
    let result: String
    let model: String
}

struct TranscribeResponse: Codable {
    let text: String
    let id: String
}

struct HistoryItem: Codable, Identifiable, Equatable {
    let id: String
    let user_id: String
    let kind: String
    let prompt: String
    let response: String
    let created_at: String
}

struct APIError: Error, LocalizedError {
    let message: String
    var errorDescription: String? { message }
}
