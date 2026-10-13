// Mali citac SVG putanja — samo apsolutne komande koje nasi oblici imaju
// (M L H V C Q Z). Znakovi dolaze iz `znak-oblici.ts`, simboli iz fonta.
import SwiftUI

func parseSVGPath(_ d: String) -> Path {
  var path = Path()
  var brojevi: [Double] = []
  var komanda: Character = " "
  var tekuca = CGPoint.zero
  var broj = ""

  func zavrsiBroj() {
    if !broj.isEmpty, let v = Double(broj) { brojevi.append(v) }
    broj = ""
  }
  func izvrsi() {
    zavrsiBroj()
    var i = 0
    func p(_ k: Int) -> CGPoint { CGPoint(x: brojevi[i + k], y: brojevi[i + k + 1]) }
    switch komanda {
    case "M":
      var prvi = true
      while i + 1 < brojevi.count {
        tekuca = p(0)
        if prvi { path.move(to: tekuca) } else { path.addLine(to: tekuca) }
        prvi = false
        i += 2
      }
    case "L":
      while i + 1 < brojevi.count { tekuca = p(0); path.addLine(to: tekuca); i += 2 }
    case "H":
      while i < brojevi.count { tekuca.x = brojevi[i]; path.addLine(to: tekuca); i += 1 }
    case "V":
      while i < brojevi.count { tekuca.y = brojevi[i]; path.addLine(to: tekuca); i += 1 }
    case "C":
      while i + 5 < brojevi.count { tekuca = p(4); path.addCurve(to: tekuca, control1: p(0), control2: p(2)); i += 6 }
    case "Q":
      while i + 3 < brojevi.count { tekuca = p(2); path.addQuadCurve(to: tekuca, control: p(0)); i += 4 }
    case "Z":
      path.closeSubpath()
    default: break
    }
    brojevi = []
  }

  for c in d {
    if c.isLetter && c != "e" {
      izvrsi()
      komanda = Character(c.uppercased())
      precondition(c.isUppercase, "relativne SVG komande nisu podrzane: \(c)")
    } else if c == "-" {
      if !broj.isEmpty && broj.last != "e" { zavrsiBroj() }
      broj.append(c)
    } else if c == "," || c == " " {
      zavrsiBroj()
    } else {
      broj.append(c)
    }
  }
  izvrsi()
  return path
}

/// Oblici se citaju jednom — widget crta isti krug i do sto puta po osvezavanju.
enum Oblici {
  static let znaci: [Path] = SIGN_SHAPES.map { parseSVGPath($0.d) }
  static let simboli: [String: Path] = GLYPH_SHAPES.mapValues { parseSVGPath($0.d) }
}
