import SwiftUI
import PhotosUI

struct VisionView: View {
    @ObservedObject var historyVM: HistoryViewModel
    @State private var image: UIImage?
    @State private var pickerItem: PhotosPickerItem?
    @State private var question = "Describe this image in detail."
    @State private var result: String = ""
    @State private var loading = false
    @State private var error: String?
    @State private var showShare = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("IMAGE").font(.system(.caption2, design: .monospaced)).padding(.horizontal, 6).padding(.vertical, 3)
                        .background(Color(red: 0, green: 0.18, blue: 0.65)).foregroundColor(.white)
                    Text("Image Recognition").font(.system(.title2, design: .default).weight(.bold))
                    Spacer()
                    Text("Gemma Vision").font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                }

                PhotosPicker(selection: $pickerItem, matching: .images) {
                    if let img = image {
                        Image(uiImage: img).resizable().scaledToFit().frame(maxHeight: 240)
                            .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                    } else {
                        VStack(spacing: 8) {
                            Image(systemName: "photo")
                            Text("Pick image").font(.system(.subheadline, design: .default).weight(.bold)).tracking(1)
                        }
                        .frame(maxWidth: .infinity, minHeight: 180)
                        .overlay(Rectangle().stroke(Color.black, style: StrokeStyle(lineWidth: 2, dash: [6])))
                        .background(Color(.systemGray6))
                    }
                }
                .onChange(of: pickerItem) { _, new in
                    guard let new else { return }
                    Task {
                        if let data = try? await new.loadTransferable(type: Data.self), let img = UIImage(data: data) {
                            image = img
                        }
                    }
                }

                TextEditor(text: $question)
                    .frame(minHeight: 110)
                    .padding(8)
                    .overlay(Rectangle().stroke(Color.black, lineWidth: 2))

                Button {
                    Task { await submit() }
                } label: {
                    HStack {
                        Image(systemName: "paperplane.fill")
                        Text(loading ? "Analyzing…" : "Analyze image").font(.system(.subheadline, design: .default).weight(.bold)).tracking(1.5)
                    }
                    .padding(.horizontal, 18).padding(.vertical, 14)
                    .frame(maxWidth: .infinity)
                    .foregroundColor(.white)
                    .background(Color(red: 0, green: 0.18, blue: 0.65))
                    .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                }
                .disabled(image == nil || loading)
                .shadow(color: .black, radius: 0, x: 4, y: 4)

                if let error { Text(error).foregroundColor(.red).font(.system(.caption, design: .monospaced)) }

                if !result.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("RESULT").font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                            Spacer()
                            Button {
                                showShare = true
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "square.and.arrow.up")
                                    Text("Share").font(.system(.caption, design: .default).weight(.bold)).tracking(1)
                                }
                                .padding(.horizontal, 10).padding(.vertical, 6)
                                .foregroundColor(.white)
                                .background(Color(red: 0.145, green: 0.827, blue: 0.4))
                                .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                            }
                        }
                        Text(result).font(.system(.body))
                    }
                    .padding(14)
                    .background(Color(.systemGray6))
                    .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                    .shadow(color: .black, radius: 0, x: 4, y: 4)
                    .sheet(isPresented: $showShare) {
                        ShareSheet(activityItems: [result])
                    }
                }
            }
            .padding(16)
        }
    }

    func submit() async {
        guard let img = image else { return }
        loading = true; error = nil; result = ""
        defer { loading = false }
        do {
            let resp = try await APIClient.shared.askImage(question: question, image: img)
            result = resp.result
            await historyVM.refresh()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "\(error)"
        }
    }
}
