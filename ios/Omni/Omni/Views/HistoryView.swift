import SwiftUI

struct HistoryView: View {
    @ObservedObject var vm: HistoryViewModel
    @State private var shareItem: HistoryItem?

    var body: some View {
        Group {
            if vm.items.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "tray")
                    Text("NO HISTORY YET").font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List {
                    ForEach(vm.items) { item in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(item.kind.uppercased())
                                    .font(.system(.caption2, design: .monospaced))
                                    .padding(.horizontal, 6).padding(.vertical, 2)
                                    .background(color(for: item.kind))
                                    .foregroundColor(.white)
                                Text(item.created_at).font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                                Spacer()
                                Button {
                                    shareItem = item
                                } label: { Image(systemName: "square.and.arrow.up") }
                                    .foregroundColor(.black)
                            }
                            Text(item.prompt).font(.system(.subheadline).weight(.bold)).lineLimit(1)
                            Text(item.response).font(.system(.body)).foregroundColor(.secondary).lineLimit(3)
                        }
                        .padding(.vertical, 6)
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                Task { await vm.delete(item) }
                            } label: { Label("Delete", systemImage: "trash") }
                        }
                    }
                }
                .listStyle(.plain)
                .refreshable { await vm.refresh() }
            }
        }
        .task { await vm.refresh() }
        .sheet(item: $shareItem) { item in
            ShareSheet(activityItems: ["\(item.prompt)\n\n— \(item.response)"])
        }
    }

    private func color(for kind: String) -> Color {
        switch kind {
        case "image": return Color(red: 0, green: 0.18, blue: 0.65)
        case "transcribe", "audio": return Color(red: 1.0, green: 0.14, blue: 0)
        default: return .black
        }
    }
}
