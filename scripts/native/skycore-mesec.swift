// Slike Meseca za sat (Astrodial): ISTIH 30 ilustracija kao u aplikaciji (`assets/images/mesec/`,
// pravi ih `scripts/mesec-faze.ts`), ali SA GUBITKOM i bez providnosti — sat je uvek crn, pa se slika
// stavlja na crnu podlogu i pakuje kao HEIC (Apple Watch) odnosno JPEG (Wear OS). Ivan je to trazio
// 14.10.2026 ("da li mozes da kompresujes"); slike u `assets/` ostaju netaknute (pravilo 24).
// 30 slika: PNG 2,1 MB -> HEIC ~0,3 MB / JPEG ~0,65 MB, na oko bez razlike pri 256 px.
//
//   swift scripts/native/skycore-mesec.swift      (iz korena repoa, posle izmene slika u aplikaciji)
import AppKit
import ImageIO
import UniformTypeIdentifiers

let JACINA = 0.85

func pakuj(_ ulaz: String, _ izlaz: String, _ tip: UTType) {
  let src = NSImage(contentsOfFile: ulaz)!.cgImage(forProposedRect: nil, context: nil, hints: nil)!
  let w = src.width, h = src.height
  let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
  ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 1))
  ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.draw(src, in: CGRect(x: 0, y: 0, width: w, height: h))
  let d = CGImageDestinationCreateWithURL(URL(fileURLWithPath: izlaz) as CFURL, tip.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(d, ctx.makeImage()!, [kCGImageDestinationLossyCompressionQuality: JACINA] as CFDictionary)
  precondition(CGImageDestinationFinalize(d), "nije upisano: \(izlaz)")
}

let fm = FileManager.default
try! fm.createDirectory(atPath: "watch/NeboSat/Mesec", withIntermediateDirectories: true)
try! fm.createDirectory(atPath: "wear/src/main/res/drawable-nodpi", withIntermediateDirectories: true)
for i in 1...30 {
  let n = String(format: "%02d", i)
  pakuj("assets/images/mesec/mesec-\(n).png", "watch/NeboSat/Mesec/mesec-\(n).heic", .heic)
  pakuj("assets/images/mesec/mesec-\(n).png", "wear/src/main/res/drawable-nodpi/mesec_\(n).jpg", .jpeg)
}
print("upakovano 30 slika Meseca (HEIC za Apple Watch, JPEG za Wear OS)")
