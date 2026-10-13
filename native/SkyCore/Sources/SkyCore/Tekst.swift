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

/// Krug Mesecevih mena, po uzoru na Apple-ov brojcanik "Lunar" (Ivan, 14.10.2026): spoljni prsten
/// sa BROJEVIMA lunarnih dana, unutrasnji sa izgledom Meseca za svaki dan, tekuci dan istaknut
/// (broj u beloj plocici, mena u prstenu), a u sredini mesto za veliki Mesec. Prvi dan je na vrhu,
/// dani idu u smeru kazaljke.
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
        let k = strana / 200 // crta se u krugu precnika 200
        let n = Double(Self.DANA)
        let rBroj = 91.0 * k, rMena = 73.0 * k, r = 5.6 * k
        // Tanki prstenovi izmedju brojeva, mena i sredine.
        for rr in [99.0, 82.5, 63.5] {
          ctx.stroke(Path(ellipseIn: CGRect(x: c.x - rr * k, y: c.y - rr * k, width: 2 * rr * k, height: 2 * rr * k)),
                     with: .color(.white.opacity(0.16)), lineWidth: 0.8)
        }
        for i in 0..<Self.DANA {
          let ugao = (Double(i) / n) * 2 * .pi - .pi / 2
          let tekuci = i + 1 == lunarDay
          // Crtica izmedju dana, u prstenu sa brojevima.
          let granica = ugao - .pi / n
          var crta = Path()
          crta.move(to: CGPoint(x: c.x + 82.5 * k * cos(granica), y: c.y + 82.5 * k * sin(granica)))
          crta.addLine(to: CGPoint(x: c.x + 99 * k * cos(granica), y: c.y + 99 * k * sin(granica)))
          ctx.stroke(crta, with: .color(.white.opacity(0.16)), lineWidth: 0.8)

          // Broj dana, okrenut tako da se cita duz kruga.
          var g = ctx
          g.translateBy(x: c.x + rBroj * cos(ugao), y: c.y + rBroj * sin(ugao))
          g.rotate(by: .radians(ugao + .pi / 2))
          if tekuci {
            g.fill(Path(roundedRect: CGRect(x: -8.5 * k, y: -6.5 * k, width: 17 * k, height: 13 * k), cornerRadius: 3 * k), with: .color(.white))
          }
          g.draw(Text("\(i + 1)").font(.system(size: (tekuci ? 10.5 : 9) * k, weight: tekuci ? .bold : .medium, design: .rounded))
            .foregroundColor(tekuci ? .black : .white.opacity(0.55)), at: .zero)

          // Izgled Meseca na sredini tog dana (sinodicki mesec 29,53 dana).
          let p = CGPoint(x: c.x + rMena * cos(ugao), y: c.y + rMena * sin(ugao))
          let rr = tekuci ? r * 1.25 : r
          ctx.fill(Path(ellipseIn: CGRect(x: p.x - rr, y: p.y - rr, width: 2 * rr, height: 2 * rr)), with: .color(boja(0x2A2A32)))
          ctx.fill(mesecOsvetljen(p, rr, (Double(i) + 0.5) / 29.530588 * 360), with: .color(tekuci ? .white : .white.opacity(0.72)))
          if tekuci {
            let o = rr + 2 * k
            ctx.stroke(Path(ellipseIn: CGRect(x: p.x - o, y: p.y - o, width: 2 * o, height: 2 * o)), with: .color(Brend.lila), lineWidth: 1.5)
          }
        }
      }
      // Sredina staje u unutrasnji prsten (poluprecnik 63,5 od 100).
      GeometryReader { geo in
        let strana = min(geo.size.width, geo.size.height)
        sredina
          .frame(width: strana * 0.53, height: strana * 0.53)
          .position(x: geo.size.width / 2, y: geo.size.height / 2)
      }
    }
    .aspectRatio(1, contentMode: .fit)
  }
}

/// Redni broj slike Meseca 1—30 za ugao faze — isto pravilo kao `mesecSlika` u `src/lib/moon.ts`:
/// slika n je napravljena za sredinu n-tog dana srednjeg ciklusa, bira se najbliza po uglu.
public func mesecSlika(angle: Double) -> Int {
  let a = norm360(angle)
  var najbliza = 1
  var razlika = Double.infinity
  for i in 0..<30 {
    let u = (Double(i) + 0.5) / 29.530588 * 360
    let d = min(abs(a - u), 360 - abs(a - u))
    if d < razlika { razlika = d; najbliza = i + 1 }
  }
  return najbliza
}
