import Foundation

@MainActor
final class HistoryViewModel: ObservableObject {
    @Published var items: [HistoryItem] = []
    @Published var loading: Bool = false
    @Published var error: String?

    func refresh() async {
        loading = true; defer { loading = false }
        do { items = try await APIClient.shared.history() }
        catch { self.error = "\(error)" }
    }

    func delete(_ item: HistoryItem) async {
        do {
            try await APIClient.shared.deleteHistory(id: item.id)
            items.removeAll { $0.id == item.id }
        } catch { self.error = "\(error)" }
    }
}
