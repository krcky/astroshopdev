// Crta krug u PNG na Mac-u, bez simulatora — za proveru izgleda:
//   swift run SkyRender <folder>
import AppKit
import SkyCore
import SwiftUI

@MainActor
func snimi(_ ime: String, _ strana: CGFloat, _ pozadina: Color, _ view: some View, u folder: String) {
  let r = ImageRenderer(content: view.frame(width: strana, height: strana).padding(8).background(pozadina))
  r.scale = 3
  guard let cg = r.cgImage else { print("nije nacrtano: \(ime)"); return }
  let png = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!
  try! png.write(to: URL(fileURLWithPath: "\(folder)/\(ime).png"))
  print("\(ime).png  \(cg.width)x\(cg.height)")
}

let folder = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
// Isti trenutak kao `check:sky`: 23.9.2026. 22:00 UTC, Beograd.
let trenutak = Date(timeIntervalSince1970: 1_790_200_800)
let beograd = Place(latitude: 44.8176, longitude: 20.4633)
let sky = buildSky(at: trenutak, place: beograd)
let bezMesta = buildSky(at: trenutak, place: nil)
let siva = Color(.sRGB, red: 0xF6 / 255, green: 0xF7 / 255, blue: 0xF8 / 255)

MainActor.assumeIsolated {
  snimi("full-light", 340, siva, SkyWheelView(sky: sky), u: folder)
  snimi("full-dark", 340, .black, SkyWheelView(sky: sky, style: WheelStyle(theme: .dark)), u: folder)
  snimi("compact-light", 142, .white, SkyWheelView(sky: sky, style: WheelStyle(detail: .compact)), u: folder)
  snimi("compact-dark", 142, .black, SkyWheelView(sky: sky, style: WheelStyle(theme: .dark, detail: .compact)), u: folder)
  snimi("compact-bez-mesta", 142, .white, SkyWheelView(sky: bezMesta, style: WheelStyle(detail: .compact)), u: folder)
  snimi("compact-mono", 142, .black, SkyWheelView(sky: sky, style: WheelStyle(theme: .dark, detail: .compact, monochrome: true)).environment(\.colorScheme, .dark), u: folder)
  snimi("dial-dark", 60, .black, SkyDialView(sky: sky), u: folder)
  snimi("dial-mono", 60, .black, SkyDialView(sky: sky, style: WheelStyle(theme: .dark, monochrome: true)).environment(\.colorScheme, .dark), u: folder)
}
