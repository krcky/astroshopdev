// Oblici simbola za SkyCore: planete i tacke iz `assets/fonts/AstroGlyphs.ttf`
// (isti font kojim ih crta tocak u aplikaciji) kao putanje, da widget i sat ne
// nose font i ne zavise od njegove registracije.
//
//   swift scripts/native/skycore-oblici.swift   (iz korena repoa)
//
// Znakove zodijaka (`src/lib/znak-oblici.ts`) prepisuje `skycore-znaci.ts`.
import CoreText
import Foundation

let simboli: [(String, UInt32)] = [
  ("moon", 0x263D), ("sun", 0x2609), ("mercury", 0x263F), ("venus", 0x2640), ("mars", 0x2642),
  ("jupiter", 0x2643), ("saturn", 0x2644), ("uranus", 0x2645), ("neptune", 0x2646), ("pluto", 0x2647),
  ("northNode", 0x260A), ("lilith", 0x26B8), ("fortune", 0x2297),
]

let url = URL(fileURLWithPath: "assets/fonts/AstroGlyphs.ttf")
guard let opisi = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor], let opis = opisi.first else {
  fatalError("font nije procitan")
}
let font = CTFontCreateWithFontDescriptor(opis, 1000, nil)
func f(_ x: CGFloat) -> String { String(format: "%.1f", x) }

var redovi: [String] = []
var redoviKt: [String] = []
for (key, kod) in simboli {
  var znak = [UniChar](String(UnicodeScalar(kod)!).utf16)
  var glif = [CGGlyph](repeating: 0, count: znak.count)
  guard CTFontGetGlyphsForCharacters(font, &znak, &glif, znak.count), glif[0] != 0 else { fatalError("nema znaka \(key)") }
  var sirina = CGSize.zero
  CTFontGetAdvancesForGlyphs(font, .horizontal, glif, &sirina, 1)
  guard let putanja = CTFontCreatePathForGlyph(font, glif[0], nil) else { fatalError("nema putanje \(key)") }
  var d = ""
  putanja.applyWithBlock { e in
    let p = e.pointee.points
    // y se obrce: font ima y nagore, crtez nadole. Osnovna linija ostaje na 0.
    switch e.pointee.type {
    case .moveToPoint: d += "M\(f(p[0].x)) \(f(-p[0].y))"
    case .addLineToPoint: d += "L\(f(p[0].x)) \(f(-p[0].y))"
    case .addQuadCurveToPoint: d += "Q\(f(p[0].x)) \(f(-p[0].y)) \(f(p[1].x)) \(f(-p[1].y))"
    case .addCurveToPoint: d += "C\(f(p[0].x)) \(f(-p[0].y)) \(f(p[1].x)) \(f(-p[1].y)) \(f(p[2].x)) \(f(-p[2].y))"
    case .closeSubpath: d += "Z"
    @unknown default: break
    }
  }
  redovi.append("  \"\(key)\": GlyphShape(d: \"\(d)\", advance: \(f(sirina.width))),")
  redoviKt.append("    \"\(key)\" to GlyphShape(\"\(d)\", \(f(sirina.width))),")
}

let izlaz = """
// GENERISANO — `swift scripts/native/skycore-oblici.swift`. Ne menjati rucno.
// Simboli planeta i tacaka iz AstroGlyphs.ttf, u jedinicama fonta (em = 1000),
// y nadole, osnovna linija na 0.
struct GlyphShape { let d: String; let advance: Double }

let GLYPH_EM = 1000.0

let GLYPH_SHAPES: [String: GlyphShape] = [
\(redovi.joined(separator: "\n"))
]

"""
try! izlaz.write(toFile: "native/SkyCore/Sources/SkyCore/Glyphs.generated.swift", atomically: true, encoding: .utf8)

// Isto za Android (widget, Wear OS).
let izlazKt = """
// GENERISANO — `swift scripts/native/skycore-oblici.swift`. Ne menjati rucno.
// Simboli planeta i tacaka iz AstroGlyphs.ttf, u jedinicama fonta (em = 1000),
// y nadole, osnovna linija na 0.
package rs.astroshop.nebo.core

class GlyphShape(val d: String, val advance: Double)

const val GLYPH_EM = 1000.0

val GLYPH_SHAPES = mapOf(
\(redoviKt.joined(separator: "\n"))
)

"""
try! izlazKt.write(toFile: "modules/nebo-widget/android/src/main/java/rs/astroshop/nebo/core/Glyphs.generated.kt", atomically: true, encoding: .utf8)
print("upisano \(redovi.count) simbola (Swift i Kotlin)")
