// Pojedinacni simboli za redove pored kruga (widget, sat): planeta i znak —
// isti oblici kao na krugu.
import SwiftUI

/// Simbol planete ili tacke (`"sun"`, `"moon"`, … `"northNode"`), u boji `foregroundStyle`.
public struct PlanetGlyph: Shape {
  let key: String
  public init(_ key: String) { self.key = key }
  public init(_ planet: Planet) { self.key = planet.rawValue }

  public func path(in rect: CGRect) -> Path {
    guard let oblik = Oblici.simboli[key] else { return Path() }
    // Razmera po visini SLOVA (em), ne po obrisu: Sunce i Saturn tako ostaju u svom odnosu.
    let r = rect.height / GLYPH_EM * 1.12
    let b = oblik.boundingRect
    return oblik.applying(CGAffineTransform(translationX: rect.midX - b.midX * r, y: rect.midY - b.midY * r).scaledBy(x: r, y: r))
  }
}

/// Sam znak zodijaka, bez kruga (0 = Ovan … 11 = Ribe).
public struct SignGlyph: Shape {
  let index: Int
  public init(_ index: Int) { self.index = index }

  public func path(in rect: CGRect) -> Path {
    let r = min(rect.width, rect.height) / SIGN_VIEWBOX
    return Oblici.znaci[index].applying(
      CGAffineTransform(translationX: rect.midX - SIGN_CENTER * r, y: rect.midY - SIGN_CENTER * r).scaledBy(x: r, y: r))
  }
}

/// Ikonica znaka kao u aplikaciji: krug u boji elementa + beli znak. Jednobojno: samo znak.
public struct SignIcon: View {
  let index: Int
  let monochrome: Bool

  public init(_ index: Int, monochrome: Bool = false) {
    self.index = index
    self.monochrome = monochrome
  }

  public var body: some View {
    let eo = FillStyle(eoFill: SIGN_SHAPES[index].evenOdd)
    if monochrome {
      SignGlyph(index).fill(.primary, style: eo).scaleEffect(1.3).aspectRatio(1, contentMode: .fit)
    } else {
      ZStack {
        Circle().fill(boja(SIGN_SHAPES[index].color))
        SignGlyph(index).fill(.white, style: eo)
      }
      .aspectRatio(1, contentMode: .fit)
    }
  }
}
