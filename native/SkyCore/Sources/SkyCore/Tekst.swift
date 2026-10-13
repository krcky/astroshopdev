// Natpisi za sat (Astrodial) na jeziku uredjaja. Tabela je GENERISANA iz recnika
// aplikacije (`scripts/native/skycore-recnik.ts`), pa sat i aplikacija zovu stvari isto.
import SwiftUI

public enum Tekst {
  /// Prvi od zeljenih jezika uredjaja koji imamo; inace engleski.
  static let jezik: String = {
    for l in Locale.preferredLanguages {
      let kod = String(l.prefix(2))
      if RECNIK[kod] != nil { return kod }
    }
    return "en"
  }()

  /// Lokal za datume i sate na jeziku natpisa (srpski latinicom, kao u aplikaciji).
  public static let locale = Locale(identifier: jezik == "sr" ? "sr-Latn" : jezik)

  public static func t(_ kljuc: String) -> String { RECNIK[jezik]?[kljuc] ?? RECNIK["en"]?[kljuc] ?? kljuc }
  public static func sign(_ index: Int) -> String { t("sign.\(index)") }
  public static func planet(_ p: Planet) -> String { t("planet.\(p.rawValue)") }
  /// Faza po indeksu 0—7 (0 = mlad Mesec).
  public static func phase(_ index: Int) -> String { t("phase.\(index)") }

  /// Naslov dogadjaja bez padeza: "Mesec → Strelac", "Bez kursa", "Pun Mesec", "Pluton D".
  public static func title(_ e: SatEvent) -> String {
    switch e {
    case let .moonSign(_, sign): return "\(planet(.moon)) → \(self.sign(sign))"
    case .voc: return t("ui.voc")
    case let .phase(_, q): return phase(q * 2)
    case let .ingress(_, body, sign): return "\(planet(body)) → \(self.sign(sign))"
    case let .station(_, body, retro): return "\(planet(body)) \(retro ? "R" : "D")"
    }
  }

  /// Planeta ciji simbol stoji uz dogadjaj.
  public static func glyph(_ e: SatEvent) -> Planet {
    switch e {
    case .moonSign, .voc, .phase: return .moon
    case let .ingress(_, body, _), let .station(_, body, _): return body
    }
  }

  /// Sat i minut danas, inace dan i mesec.
  public static func when(_ date: Date, now: Date = .now) -> String {
    Calendar.current.isDate(date, inSameDayAs: now) || date.timeIntervalSince(now) < 12 * 3600
      ? date.formatted(Date.FormatStyle(date: .omitted, time: .shortened).locale(locale))
      : date.formatted(.dateTime.day().month(.abbreviated).locale(locale))
  }
}

/// Mesec u fazi: taman disk i osvetljeni deo (desno dok raste, levo dok opada).
public struct MoonPhaseView: View {
  let angle: Double

  public init(angle: Double) { self.angle = angle }

  public var body: some View {
    Canvas { ctx, size in
      let r = min(size.width, size.height) / 2
      let c = CGPoint(x: size.width / 2, y: size.height / 2)
      ctx.fill(Path(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r)), with: .color(boja(0x1C1C22)))
      ctx.fill(mesecOsvetljen(c, r, angle), with: .color(Brend.svetlaLila))
    }
    .aspectRatio(1, contentMode: .fit)
  }
}

/// Prsten napretka (0—1) od vrha u smeru kazaljke, sa sadrzajem u sredini.
public struct Prsten<Sadrzaj: View>: View {
  let deo: Double
  let boja: Color
  let debljina: CGFloat
  let sadrzaj: Sadrzaj

  public init(_ deo: Double, boja: Color = Brend.lila, debljina: CGFloat = 5, @ViewBuilder sadrzaj: () -> Sadrzaj) {
    self.deo = deo
    self.boja = boja
    self.debljina = debljina
    self.sadrzaj = sadrzaj()
  }

  public var body: some View {
    ZStack {
      Circle().stroke(.primary.opacity(0.18), lineWidth: debljina)
      Circle().trim(from: 0, to: max(0.001, min(1, deo)))
        .stroke(boja, style: StrokeStyle(lineWidth: debljina, lineCap: .round))
        .rotationEffect(.degrees(-90))
      sadrzaj
    }
    .padding(debljina / 2)
  }
}

/// Osvetljeni deo Meseca za ugao faze, u krugu poluprecnika `r` oko `c` (desno dok raste, levo dok opada).
func mesecOsvetljen(_ c: CGPoint, _ r: Double, _ angle: Double) -> Path {
  let raste = norm360(angle) < 180
  let k = cos(angle * .pi / 180)
  let strana: Double = raste ? 1 : -1
  var p = Path()
  let n = 24
  for i in 0...n {
    let y = -r + 2 * r * Double(i) / Double(n)
    let x = max(0, r * r - y * y).squareRoot()
    let tacka = CGPoint(x: c.x + strana * x, y: c.y + y)
    if i == 0 { p.move(to: tacka) } else { p.addLine(to: tacka) }
  }
  for i in stride(from: n, through: 0, by: -1) {
    let y = -r + 2 * r * Double(i) / Double(n)
    p.addLine(to: CGPoint(x: c.x + strana * k * max(0, r * r - y * y).squareRoot(), y: c.y + y))
  }
  p.closeSubpath()
  return p
}

/// Krug Mesecevih mena: 30 lunarnih dana ukrug, od prvog na vrhu u smeru kazaljke, svaki sa
/// svojim izgledom Meseca; tekuci dan je veci i u prstenu. U sredini mesto za broj dana.
///
/// TRIDESET, ne 28: od mladog do mladog Meseca prodje 29,5 dana, pa lunarni dan ide od 1 do 30
/// (kao u aplikaciji, `moon.ts`). Sa 28 polja poslednja dva dana ne bi imala svoje mesto.
public struct MoonWheelView<Sredina: View>: View {
  public static var DANA: Int { 30 }
  let lunarDay: Int
  let sredina: Sredina

  public init(lunarDay: Int, @ViewBuilder sredina: () -> Sredina) {
    self.lunarDay = lunarDay
    self.sredina = sredina()
  }

  public var body: some View {
    ZStack {
      Canvas { ctx, size in
        let strana = min(size.width, size.height)
        let c = CGPoint(x: size.width / 2, y: size.height / 2)
        let n = Double(Self.DANA)
        // Mali Mesec staje u svoj luk; tekuci je za polovinu veci.
        let r = strana / 2 * 0.085
        let R = strana / 2 - r * 1.7
        for i in 0..<Self.DANA {
          let ugao = (Double(i) / n) * 2 * .pi - .pi / 2
          let p = CGPoint(x: c.x + R * cos(ugao), y: c.y + R * sin(ugao))
          let tekuci = i + 1 == lunarDay
          let rr = tekuci ? r * 1.5 : r
          // Izgled Meseca na sredini tog dana (sinodicki mesec 29,53 dana).
          let faza = (Double(i) + 0.5) / 29.530588 * 360
          ctx.fill(Path(ellipseIn: CGRect(x: p.x - rr, y: p.y - rr, width: 2 * rr, height: 2 * rr)), with: .color(boja(0x26262E)))
          ctx.fill(mesecOsvetljen(p, rr, faza), with: .color(tekuci ? .white : Brend.svetlaLila.opacity(0.8)))
          if tekuci {
            let o = rr + 2.5
            ctx.stroke(Path(ellipseIn: CGRect(x: p.x - o, y: p.y - o, width: 2 * o, height: 2 * o)), with: .color(Brend.lila), lineWidth: 1.5)
          }
        }
      }
      sredina
    }
    .aspectRatio(1, contentMode: .fit)
  }
}
