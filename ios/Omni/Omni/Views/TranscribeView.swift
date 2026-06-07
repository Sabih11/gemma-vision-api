import SwiftUI
import AVFoundation

final class AudioRecorder: NSObject, ObservableObject, AVAudioRecorderDelegate {
    private var recorder: AVAudioRecorder?
    @Published var isRecording = false
    @Published var lastFileURL: URL?

    func start() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: .defaultToSpeaker)
        try session.setActive(true)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("rec-\(Int(Date().timeIntervalSince1970)).m4a")
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
        ]
        let rec = try AVAudioRecorder(url: url, settings: settings)
        rec.delegate = self
        rec.record()
        recorder = rec
        lastFileURL = url
        isRecording = true
    }

    func stop() {
        recorder?.stop()
        recorder = nil
        isRecording = false
    }
}

struct TranscribeView: View {
    @ObservedObject var historyVM: HistoryViewModel
    @StateObject var recorder = AudioRecorder()
    @State private var fileURL: URL?
    @State private var transcript: String = ""
    @State private var loading = false
    @State private var error: String?
    @State private var showImporter = false
    @State private var showShare = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("AUDIO").font(.system(.caption2, design: .monospaced)).padding(.horizontal, 6).padding(.vertical, 3)
                        .background(Color(red: 1.0, green: 0.14, blue: 0)).foregroundColor(.white)
                    Text("Audio Transcribe").font(.system(.title2, design: .default).weight(.bold))
                    Spacer()
                    Text("Whisper-1").font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                }

                VStack(spacing: 16) {
                    Button {
                        if recorder.isRecording {
                            recorder.stop()
                            fileURL = recorder.lastFileURL
                        } else {
                            try? recorder.start()
                        }
                    } label: {
                        ZStack {
                            Circle().fill(recorder.isRecording ? Color(red: 1.0, green: 0.14, blue: 0) : .black)
                                .frame(width: 80, height: 80)
                            Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                    Text(recorder.isRecording ? "RECORDING… TAP TO STOP" : "TAP MIC OR PICK A FILE")
                        .font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)

                    Button("Pick audio file") { showImporter = true }
                        .font(.system(.subheadline).weight(.bold))
                        .underline()
                }
                .frame(maxWidth: .infinity, minHeight: 200)
                .padding(20)
                .background(Color(.systemGray6))
                .overlay(Rectangle().stroke(Color.black, lineWidth: 2))

                if let url = fileURL {
                    HStack {
                        Image(systemName: "music.note")
                        Text(url.lastPathComponent).font(.system(.subheadline).weight(.bold)).lineLimit(1)
                        Spacer()
                        Button {
                            fileURL = nil
                        } label: { Image(systemName: "xmark") }
                    }
                    .padding(10)
                    .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                }

                Button {
                    Task { await submit() }
                } label: {
                    Text(loading ? "Transcribing…" : "Transcribe")
                        .font(.system(.subheadline).weight(.bold)).tracking(1.5)
                        .padding(.horizontal, 18).padding(.vertical, 14)
                        .frame(maxWidth: .infinity)
                        .foregroundColor(.white)
                        .background(Color(red: 1.0, green: 0.14, blue: 0))
                        .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                }
                .disabled(fileURL == nil || loading)
                .shadow(color: .black, radius: 0, x: 4, y: 4)

                if let error { Text(error).foregroundColor(.red).font(.system(.caption, design: .monospaced)) }

                if !transcript.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("TRANSCRIPT").font(.system(.caption2, design: .monospaced)).foregroundColor(.gray)
                            Spacer()
                            Button {
                                showShare = true
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "square.and.arrow.up")
                                    Text("Share").font(.system(.caption).weight(.bold)).tracking(1)
                                }
                                .padding(.horizontal, 10).padding(.vertical, 6)
                                .foregroundColor(.white)
                                .background(Color(red: 0.145, green: 0.827, blue: 0.4))
                                .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                            }
                        }
                        Text(transcript).font(.system(.body))
                    }
                    .padding(14)
                    .background(Color(.systemGray6))
                    .overlay(Rectangle().stroke(Color.black, lineWidth: 2))
                    .shadow(color: .black, radius: 0, x: 4, y: 4)
                    .sheet(isPresented: $showShare) {
                        ShareSheet(activityItems: [transcript])
                    }
                }
            }
            .padding(16)
        }
        .fileImporter(isPresented: $showImporter, allowedContentTypes: [.audio], allowsMultipleSelection: false) { res in
            switch res {
            case .success(let urls):
                if let u = urls.first { fileURL = u }
            case .failure(let e):
                error = "\(e)"
            }
        }
    }

    func submit() async {
        guard let url = fileURL else { return }
        loading = true; error = nil; transcript = ""
        defer { loading = false }
        do {
            _ = url.startAccessingSecurityScopedResource()
            defer { url.stopAccessingSecurityScopedResource() }
            let resp = try await APIClient.shared.transcribe(fileURL: url)
            transcript = resp.text
            await historyVM.refresh()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "\(error)"
        }
    }
}
