import AVFoundation
import ExpoModulesCore
import Photos
import UIKit

/**
 * VIDEO DNEVNE PRICE (Ivan, 30.9.2026): cela prica sa svim pokretima kao MP4 za deljenje.
 *
 * `PlatnoVidea` je obican pogled; React u njega crta karticu za deljenje (360 × 640 pt).
 * JS postavi sat animacija na trenutak kadra, sacekaj da se kadar nacrta, pa pozove
 * `kadar(redni)`: pogled se iscrta u CVPixelBuffer (1080 × 1920) i preda AVAssetWriter-u,
 * koji ga hardverski kodira u H.264. Sve je JAVNI API (UIKit + AVFoundation).
 *
 * Nista od ovoga ne ide na mrezu. Expo Go modul nema (`components/prica/platno-videa.tsx`).
 */
public final class VideoPriceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VideoPrice")

    // "Sačuvaj u Fotografije" (Ivan, 30.9.2026): trajna kopija van aplikacije. Trazi se SAMO dozvola za
    // DODAVANJE (`.addOnly`, NSPhotoLibraryAddUsageDescription) — aplikacija ne vidi ostale fotografije.
    AsyncFunction("sacuvajUFotografije") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri), url.isFileURL, FileManager.default.fileExists(atPath: url.path) else {
        promise.reject(VideoPriceGreska("Nema fajla: \(uri)"))
        return
      }
      PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
        guard status == .authorized || status == .limited else {
          promise.resolve("bez-dozvole")
          return
        }
        PHPhotoLibrary.shared().performChanges({
          _ = PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
        }) { uspelo, greska in
          if uspelo {
            promise.resolve("sacuvano")
          } else {
            promise.reject(VideoPriceGreska(greska?.localizedDescription ?? "Video nije sacuvan"))
          }
        }
      }
    }

    View(PlatnoVideaView.self) {
      AsyncFunction("pocni") { (view: PlatnoVideaView, uri: String, sirina: Int, visina: Int, fps: Int, bitrate: Int) throws in
        try view.pocni(uri: uri, sirina: sirina, visina: visina, fps: fps, bitrate: bitrate)
      }.runOnQueue(.main)

      // Vraca koliko je kadar trajao (ms) — za merenje i za usporavanje kad korisnik koristi app.
      AsyncFunction("kadar") { (view: PlatnoVideaView, redni: Int, nacin: String) throws -> Double in
        try view.kadar(redni: redni, nacin: nacin)
      }.runOnQueue(.main)

      AsyncFunction("zavrsi") { (view: PlatnoVideaView, promise: Promise) in
        view.zavrsi(promise)
      }.runOnQueue(.main)

      AsyncFunction("otkazi") { (view: PlatnoVideaView) in
        view.otkazi()
      }.runOnQueue(.main)
    }
  }
}

final class VideoPriceGreska: Exception, @unchecked Sendable {
  private let poruka: String
  init(_ poruka: String) {
    self.poruka = poruka
    super.init()
  }
  override var reason: String { poruka }
}

public final class PlatnoVideaView: ExpoView {
  private var writer: AVAssetWriter?
  private var ulaz: AVAssetWriterInput?
  private var adapter: AVAssetWriterInputPixelBufferAdaptor?
  private var izlaz: URL?
  private var fps: Int32 = 30
  private var sirina = 1080
  private var visina = 1920
  private let prostorBoja = CGColorSpace(name: CGColorSpace.sRGB)!

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    isUserInteractionEnabled = false
    // Kadar mora biti ceo: bez `clipsToBounds` bi senka Meseca izlazila van, a to ne ide u video.
    clipsToBounds = true
    // VoiceOver ne treba da nadje karticu koja se crta van ekrana.
    accessibilityElementsHidden = true
  }

  deinit {
    writer?.cancelWriting()
  }

  func pocni(uri: String, sirina: Int, visina: Int, fps: Int, bitrate: Int) throws {
    otkazi()
    guard let url = URL(string: uri), url.isFileURL else { throw VideoPriceGreska("Putanja nije fajl: \(uri)") }
    try? FileManager.default.removeItem(at: url)

    let w = try AVAssetWriter(outputURL: url, fileType: .mp4)
    // "moov" na pocetku fajla: Instagram i poruke pocnu da ga puste pre nego sto ceo stigne.
    w.shouldOptimizeForNetworkUse = true
    let podesavanja: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: sirina,
      AVVideoHeightKey: visina,
      AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: bitrate,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
        AVVideoExpectedSourceFrameRateKey: fps,
        AVVideoMaxKeyFrameIntervalKey: fps * 2,
      ],
      // BT.709 kao svaki HD video — bez oznake plejeri pogadjaju i boje odu u sivo.
      AVVideoColorPropertiesKey: [
        AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2,
        AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2,
        AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2,
      ],
    ]
    let u = AVAssetWriterInput(mediaType: .video, outputSettings: podesavanja)
    u.expectsMediaDataInRealTime = false
    let a = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: u, sourcePixelBufferAttributes: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
      kCVPixelBufferWidthKey as String: sirina,
      kCVPixelBufferHeightKey as String: visina,
      kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
      kCVPixelBufferCGImageCompatibilityKey as String: true,
    ])
    guard w.canAdd(u) else { throw VideoPriceGreska("Video ulaz nije prihvacen") }
    w.add(u)
    guard w.startWriting() else { throw VideoPriceGreska(w.error?.localizedDescription ?? "Pisanje videa nije pocelo") }
    w.startSession(atSourceTime: .zero)

    writer = w
    ulaz = u
    adapter = a
    izlaz = url
    self.fps = Int32(fps)
    self.sirina = sirina
    self.visina = visina
  }

  func kadar(redni: Int, nacin: String) throws -> Double {
    let t0 = CACurrentMediaTime()
    guard let writer, let ulaz, let adapter else { throw VideoPriceGreska("Video nije zapocet") }
    guard writer.status == .writing else {
      throw VideoPriceGreska("pokvaren: \(writer.error?.localizedDescription ?? "status \(writer.status.rawValue)")")
    }
    // Koder obicno odmah prima; ako ne, kratko sacekaj (najvise ~200 ms).
    var cekanje = 0
    while !ulaz.isReadyForMoreMediaData && cekanje < 100 {
      usleep(2000)
      cekanje += 1
    }
    guard ulaz.isReadyForMoreMediaData else { throw VideoPriceGreska("Koder nije spreman") }
    guard let bazen = adapter.pixelBufferPool else { throw VideoPriceGreska("Nema bafera") }

    var bafer: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, bazen, &bafer)
    guard let pb = bafer else { throw VideoPriceGreska("Bafer nije napravljen") }

    CVPixelBufferLockBaseAddress(pb, [])
    defer { CVPixelBufferUnlockBaseAddress(pb, []) }
    guard let ctx = CGContext(
      data: CVPixelBufferGetBaseAddress(pb),
      width: sirina,
      height: visina,
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(pb),
      space: prostorBoja,
      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { throw VideoPriceGreska("Platno nije napravljeno") }

    ctx.setFillColor(UIColor.white.cgColor)
    ctx.fill(CGRect(x: 0, y: 0, width: sirina, height: visina))
    // UIKit crta od gornjeg levog ugla; bitmapa pocinje od donjeg — okreni i uvecaj na 1080 × 1920.
    let b = bounds
    guard b.width > 0, b.height > 0 else { throw VideoPriceGreska("Platno nema meru") }
    ctx.translateBy(x: 0, y: CGFloat(visina))
    ctx.scaleBy(x: CGFloat(sirina) / b.width, y: -CGFloat(visina) / b.height)

    UIGraphicsPushContext(ctx)
    if nacin == "sloj" {
      layer.render(in: ctx)
    } else {
      drawHierarchy(in: b, afterScreenUpdates: false)
    }
    UIGraphicsPopContext()

    let vreme = CMTime(value: CMTimeValue(redni), timescale: fps)
    guard adapter.append(pb, withPresentationTime: vreme) else {
      throw VideoPriceGreska("pokvaren: \(writer.error?.localizedDescription ?? "kadar nije primljen")")
    }
    return (CACurrentMediaTime() - t0) * 1000
  }

  func zavrsi(_ promise: Promise) {
    guard let writer, let ulaz, let izlaz else {
      promise.reject(VideoPriceGreska("Video nije zapocet"))
      return
    }
    ulaz.markAsFinished()
    writer.finishWriting { [weak self] in
      DispatchQueue.main.async {
        if writer.status == .completed {
          promise.resolve(izlaz.absoluteString)
        } else {
          promise.reject(VideoPriceGreska(writer.error?.localizedDescription ?? "Video nije zavrsen"))
        }
        self?.ocisti(obrisiFajl: false)
      }
    }
  }

  func otkazi() {
    writer?.cancelWriting()
    ocisti(obrisiFajl: true)
  }

  private func ocisti(obrisiFajl: Bool) {
    if obrisiFajl, let izlaz { try? FileManager.default.removeItem(at: izlaz) }
    writer = nil
    ulaz = nil
    adapter = nil
    izlaz = nil
  }
}
