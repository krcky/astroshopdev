// Slika astrologa za tab "Pitaj" — glava i ramena u kvadratu, za krug u aplikaciji.
//
//   swift scripts/boban-krug.swift [izlaz.png] [--pregled pregled.png]
//
// Izvor je `files/boban-vujovic-2.svg` (Ivan, 29.9.2026): Sketch-ov SVG koji u sebi
// nosi PNG 564x896 sa PROVIDNOM pozadinom. Skripta izvuce PNG, iseče kvadrat oko
// glave i sacuva ga providnog — boju kruga daje aplikacija (`astrolog-slika.tsx`).
// Vrh kvadrata je iznad slike (dopunjen providnim), da kosa ne dodiruje ivicu kruga.
// `--pregled` crta isti kvadrat u sivom krugu, samo za proveru kadra.
import AppKit
import Foundation

let izvor = "files/boban-vujovic-2.svg"
let args = CommandLine.arguments.dropFirst()
let izlaz = args.first(where: { !$0.hasPrefix("--") }) ?? "assets/images/boban-vujovic.png"
let pregled: String? = {
  guard let i = args.firstIndex(of: "--pregled"), args.index(after: i) < args.endIndex else { return nil }
  return args[args.index(after: i)]
}()

// Kadar u pikselima izvora: kvadrat stranice STRANA, gornji levi ugao (X, Y).
// Oci su na ~150, brada na ~330, sredina lica na ~285.
let STRANA = 430.0
let X = 70.0
let Y = -36.0
/// Izlaz: 3x za krug od 128pt je 384 — manje od izvora, pa se samo smanjuje.
let IZLAZ = 384

let svg = try String(contentsOfFile: izvor, encoding: .utf8)
guard let r = svg.range(of: "base64,"),
      let kraj = svg[r.upperBound...].firstIndex(of: "\""),
      let podaci = Data(base64Encoded: String(svg[r.upperBound..<kraj])),
      let slika = NSBitmapImageRep(data: podaci)?.cgImage
else { fatalError("u \(izvor) nema PNG-a") }

func nacrtaj(uKrug: Bool) -> NSBitmapImageRep {
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: IZLAZ, pixelsHigh: IZLAZ,
                             bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                             colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  let ctx = NSGraphicsContext(bitmapImageRep: rep)!.cgContext
  let s = Double(IZLAZ) / STRANA
  ctx.interpolationQuality = .high
  if uKrug {
    ctx.addEllipse(in: CGRect(x: 0, y: 0, width: IZLAZ, height: IZLAZ))
    ctx.clip()
    ctx.setFillColor(CGColor(red: 0.922, green: 0.922, blue: 0.922, alpha: 1)) // fillStrong #EBEBEB
    ctx.fill(CGRect(x: 0, y: 0, width: IZLAZ, height: IZLAZ))
  }
  // CoreGraphics ima y navise: donja ivica izvora je na (Y + STRANA - visina) od dna kvadrata.
  let w = Double(slika.width), h = Double(slika.height)
  ctx.draw(slika, in: CGRect(x: -X * s, y: (Y + STRANA - h) * s, width: w * s, height: h * s))
  return rep
}

func sacuvaj(_ rep: NSBitmapImageRep, _ putanja: String) {
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: putanja))
  print("upisano: \(putanja)")
}

sacuvaj(nacrtaj(uKrug: false), izlaz)
if let p = pregled { sacuvaj(nacrtaj(uKrug: true), p) }
