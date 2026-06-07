import SwiftUI

struct LoginView: View {
    @EnvironmentObject var auth: AuthManager
    @State private var manualSession: String = ""
    @State private var showManual = false

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack(spacing: 12) {
                Rectangle()
                    .fill(Color.black)
                    .frame(width: 36, height: 36)
                    .overlay(Text("O").font(.system(size: 20, weight: .black, design: .default)).foregroundColor(.white))
                Text("OMNI · V1.0").font(.system(.caption, design: .monospaced)).textCase(.uppercase).foregroundColor(.gray)
            }
            Spacer()
            Text("MULTIMODAL AI · VISION · VOICE · TEXT")
                .font(.system(.caption2, design: .monospaced)).textCase(.uppercase).foregroundColor(.gray)
            Text("OMNI.")
                .font(.system(size: 72, weight: .black))
                .tracking(-3)
            Text("See images, transcribe audio, ask anything. Sign in to start your multimodal workspace and share results to WhatsApp in one tap.")
                .font(.system(.body))
                .foregroundColor(.secondary)

            Button {
                Task { await auth.loginWithEmergent() }
            } label: {
                HStack {
                    Image(systemName: "g.circle.fill")
                    Text("CONTINUE WITH GOOGLE")
                        .font(.system(.subheadline, design: .default).weight(.bold))
                        .tracking(1.5)
                    Spacer()
                    Image(systemName: "arrow.right")
                }
                .padding(.horizontal, 20).padding(.vertical, 18)
                .foregroundColor(.white)
                .background(Color.black)
                .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
            }
            .shadow(color: .black, radius: 0, x: 4, y: 4)

            if let err = auth.error {
                Text(err).font(.system(.caption, design: .monospaced)).foregroundColor(.red)
            }

            Button(showManual ? "Hide debug" : "Paste session_id (debug)") { showManual.toggle() }
                .font(.system(.caption, design: .monospaced)).foregroundColor(.gray)

            if showManual {
                TextField("session_id", text: $manualSession)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                Button("Submit") { Task { await auth.loginWithManualSessionId(manualSession) } }
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .foregroundColor(.white).background(Color(.systemBlue))
            }
            Spacer()
            Text("POWERED BY EMERGENT AUTH · SESSIONS EXPIRE IN 7 DAYS")
                .font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
        }
        .padding(28)
        .background(Color.white.ignoresSafeArea())
    }
}
