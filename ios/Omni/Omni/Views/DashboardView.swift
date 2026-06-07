import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var auth: AuthManager
    @State private var selected: Int = 0
    @StateObject var historyVM = HistoryViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Header
                HStack {
                    HStack(spacing: 10) {
                        Rectangle().fill(.black).frame(width: 32, height: 32)
                            .overlay(Text("O").foregroundColor(.white).font(.system(size: 18, weight: .black)))
                        VStack(alignment: .leading, spacing: 2) {
                            Text("OMNI.").font(.system(size: 18, weight: .black)).tracking(-1)
                            Text("MULTIMODAL · AI").font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                        }
                    }
                    Spacer()
                    if let u = auth.user {
                        VStack(alignment: .trailing) {
                            Text(u.name ?? u.email).font(.system(.subheadline, design: .default).weight(.bold))
                            Text(u.email).font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                        }
                    }
                    Button {
                        Task { await auth.logout() }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .padding(10)
                            .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                    }
                    .foregroundColor(.black)
                }
                .padding(.horizontal, 16).padding(.vertical, 12)
                .background(Color.white)
                .overlay(Rectangle().frame(height: 2).foregroundColor(.black), alignment: .bottom)

                Picker("Mode", selection: $selected) {
                    Text("Image").tag(0)
                    Text("Audio").tag(1)
                    Text("History").tag(2)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 16).padding(.top, 12)

                Group {
                    switch selected {
                    case 0: VisionView(historyVM: historyVM)
                    case 1: TranscribeView(historyVM: historyVM)
                    default: HistoryView(vm: historyVM)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                .background(Color.white)
            }
            .background(Color.white.ignoresSafeArea())
            .task { await historyVM.refresh() }
        }
    }
}
