/*
 * Slika za SISTEMSKI splash: assets/images/splash-krug.png.
 *
 * Crta PRVI KADAR `assets/lottie/logo-krug.json` — isti krug kojim uvod
 * (`components/uvod.tsx`) pocinje. Sistemski splash i uvod moraju biti ista slika
 * na istom mestu i u istoj velicini: splash se skloni u trenutku kad se uvod
 * iscrta, pa bi svaka razlika bila skok na prvom kadru. Zato se slika ne izvozi
 * iz brend SVG-a nego se crta iz istog JSON-a koji crta i Lottie.
 *
 * Na kadru 0 su sve rotacije nula i svaki sloj ima `a == p`, pa se sve crta u
 * koordinatama kompozicije. Sloj "Zraci" se preskace: on i "Lice" nose ISTU
 * grupu "sunce" (razdvojenu kruznim maskama), pa je njihov zbir na kadru 0 samo
 * jedno sunce — a dvostruko crtanje bi potamnelo ivice.
 *
 * Swift, a ne Python, jer na masini nema biblioteke za crtanje (PIL), a
 * CoreGraphics je deo sistema.
 *
 * Pokreni: swift scripts/logo/build-splash.swift
 */
import AppKit
import CoreGraphics
import Foundation

// `#filePath` je relativan kad se skripta pokrene relativnom putanjom — razresava se prema radnom folderu.
let cwd = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
let here = URL(fileURLWithPath: #filePath, relativeTo: cwd).absoluteURL.deletingLastPathComponent()
let root = here.appendingPathComponent("../..").standardized
let src = root.appendingPathComponent("assets/lottie/logo-krug.json")
let dst = root.appendingPathComponent("assets/images/splash-krug.png")

/** Izlazna velicina u pikselima. Krug je u uvodu 180pt (`UVOD_KRUG`), pa je ovo 5x — dovoljno i za xxxhdpi (4x). */
let PX = 900

let json = try JSONSerialization.jsonObject(with: Data(contentsOf: src)) as! [String: Any]
let comp = (json["w"] as! NSNumber).doubleValue
let layers = json["layers"] as! [[String: Any]]
let scale = Double(PX) / comp

let space = CGColorSpace(name: CGColorSpace.sRGB)!
let ctx = CGContext(data: nil, width: PX, height: PX, bitsPerComponent: 8, bytesPerRow: 0, space: space,
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
// Lottie ima y nadole, CoreGraphics nagore.
ctx.translateBy(x: 0, y: CGFloat(PX))
ctx.scaleBy(x: CGFloat(scale), y: CGFloat(-scale))
ctx.setShouldAntialias(true)

func num(_ a: Any?) -> Double { (a as! NSNumber).doubleValue }
func pt(_ a: Any) -> CGPoint { let p = a as! [Any]; return CGPoint(x: num(p[0]), y: num(p[1])) }
func color(_ c: [Any]) -> CGColor { CGColor(colorSpace: space, components: c.map { CGFloat(num($0)) })! }

/** Lottie putanja (v, i, o, c) -> CGPath; `i` i `o` su relativni prema temenu. */
func path(_ k: [String: Any]) -> CGPath {
  let v = (k["v"] as! [Any]).map(pt), ins = (k["i"] as! [Any]).map(pt), outs = (k["o"] as! [Any]).map(pt)
  let p = CGMutablePath()
  p.move(to: v[0])
  let n = v.count, closed = (k["c"] as? Bool) ?? true
  for j in 0..<(closed ? n : n - 1) {
    let a = v[j], b = v[(j + 1) % n]
    let c1 = CGPoint(x: a.x + outs[j].x, y: a.y + outs[j].y)
    let c2 = CGPoint(x: b.x + ins[(j + 1) % n].x, y: b.y + ins[(j + 1) % n].y)
    p.addCurve(to: b, control1: c1, control2: c2)
  }
  if closed { p.closeSubpath() }
  return p
}

func draw(group items: [[String: Any]]) {
  let shapes = CGMutablePath()
  var ellipses: [CGRect] = []
  for it in items {
    switch it["ty"] as! String {
    case "sh": shapes.addPath(path((it["ks"] as! [String: Any])["k"] as! [String: Any]))
    case "el":
      let c = pt((it["p"] as! [String: Any])["k"]!), s = pt((it["s"] as! [String: Any])["k"]!)
      ellipses.append(CGRect(x: c.x - s.x / 2, y: c.y - s.y / 2, width: s.x, height: s.y))
    case "fl":
      ctx.addPath(shapes)
      ctx.setFillColor(color((it["c"] as! [String: Any])["k"] as! [Any]))
      // `r` 2 = even-odd (tako ga pise build-krug.py), 1 = nonzero.
      ctx.fillPath(using: num(it["r"] ?? 1) == 2 ? .evenOdd : .winding)
    case "st":
      ctx.setStrokeColor(color((it["c"] as! [String: Any])["k"] as! [Any]))
      ctx.setLineWidth(CGFloat(num((it["w"] as! [String: Any])["k"])))
      for e in ellipses { ctx.strokeEllipse(in: e) }
    case "gr": draw(group: it["it"] as! [[String: Any]])
    default: break
    }
  }
}

// Slojevi idu odozgo nadole, pa se crtaju obrnutim redom.
for l in layers.reversed() where (l["ty"] as! NSNumber).intValue == 4 {
  if (l["nm"] as? String) == "Zraci" { continue }
  for g in l["shapes"] as! [[String: Any]] {
    draw(group: (g["ty"] as! String) == "gr" ? g["it"] as! [[String: Any]] : [g])
  }
}

let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try rep.representation(using: .png, properties: [:])!.write(to: dst)
print("splash-krug.png \(PX)x\(PX), kompozicija \(Int(comp))")
