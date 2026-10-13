// Redovi pored kruga i lista planeta — BEZ RECI, pa isti na svakom jeziku.
import SwiftUI

/// Jedan red: planeta, znak u kome je, stepen (i minut) i "R" kad je retrogradna.
public struct RedPlanete: View {
  let key: String
  let longitude: Double
  let retro: Bool
  let jednobojno: Bool
  let visina: CGFloat
  let minuti: Bool

  public init(_ p: PlanetPosition, jednobojno: Bool = false, visina: CGFloat = 15, minuti: Bool = false) {
    self.init(key: p.key, longitude: p.longitude, retro: p.retrograde, jednobojno: jednobojno, visina: visina, minuti: minuti)
  }

  public init(key: String, longitude: Double, retro: Bool, jednobojno: Bool = false, visina: CGFloat = 15, minuti: Bool = false) {
    self.key = key
    self.longitude = longitude
    self.retro = retro
    self.jednobojno = jednobojno
    self.visina = visina
    self.minuti = minuti
  }

  public var body: some View {
    let pos = signFromLongitude(longitude)
    HStack(spacing: visina * 0.27) {
      PlanetGlyph(key).fill(.primary).frame(width: visina, height: visina)
      SignIcon(pos.signIndex, monochrome: jednobojno).frame(width: visina, height: visina)
      Text(minuti ? "\(pos.deg)° \(String(format: "%02d", pos.min))′" : "\(pos.deg)°")
        .font(.system(size: visina * 0.87, weight: .medium, design: .rounded))
        .monospacedDigit()
      if retro {
        Text("R").font(.system(size: visina * 0.67, weight: .semibold, design: .rounded)).foregroundStyle(.secondary)
      }
    }
    .lineLimit(1)
  }
}

/// Pravougaoni prikaz za zakljucani ekran i sat: mali krug + Sunce, Mesec i koje su planete retrogradne.
public struct NeboPravougaono: View {
  let sky: Sky
  let dimmed: Bool

  public init(sky: Sky, dimmed: Bool = false) {
    self.sky = sky
    self.dimmed = dimmed
  }

  public var body: some View {
    HStack(spacing: 8) {
      SkyDialView(sky: sky, style: WheelStyle(theme: .dark, monochrome: true, dimmed: dimmed))
      VStack(alignment: .leading, spacing: 3) {
        RedPlanete(sky.planet(.sun), jednobojno: true, visina: 14)
        RedPlanete(sky.planet(.moon), jednobojno: true, visina: 14)
        let retro = sky.planets.filter(\.retrograde)
        if !retro.isEmpty {
          HStack(spacing: 2) {
            Text("R").font(.system(size: 11, weight: .semibold, design: .rounded))
            ForEach(retro, id: \.key) { PlanetGlyph($0.planet).fill(.primary).frame(width: 12, height: 12) }
          }
        }
      }
      Spacer(minLength: 0)
    }
  }
}

/// Lista svih planeta i tacaka (druga strana na satu): simbol, znak, stepen i minut.
public struct NeboLista: View {
  let sky: Sky
  let visina: CGFloat

  public init(sky: Sky, visina: CGFloat = 18) {
    self.sky = sky
    self.visina = visina
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: visina * 0.45) {
      ForEach(Self.REDOSLED, id: \.self) { p in
        RedPlanete(sky.planet(p), visina: visina, minuti: true)
      }
      ForEach(sky.points, id: \.key) { t in
        RedPlanete(key: t.key.rawValue, longitude: t.longitude, retro: t.retrograde, visina: visina, minuti: true)
          .foregroundStyle(.secondary)
      }
    }
  }

  /// Kao u aplikaciji: Sunce pa Mesec, zatim redom od Merkura.
  static let REDOSLED: [Planet] = [.sun, .moon, .mercury, .venus, .mars, .jupiter, .saturn, .uranus, .neptune, .pluto]
}

/// Znak zodijaka kao Unicode slovo u TEKSTUALNOM obliku (U+FE0E), za jedan red teksta na satu.
public func znakSlovo(_ index: Int) -> String {
  String(UnicodeScalar(0x2648 + UInt32(index))!) + "\u{FE0E}"
}
