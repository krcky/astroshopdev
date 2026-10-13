// Krug neba — isti crtez kao `components/natal-wheel.tsx` u aplikaciji, u
// SwiftUI Canvas-u. Mere i boje su iz `lib/wheel.ts` i `lib/tocak-stil.ts`:
// kad se RASPORED tocka u aplikaciji promeni, ista izmena ide i ovde.
import SwiftUI

public struct WheelStyle: Sendable {
  public enum Theme: Sendable { case light, dark }
  public enum Detail: Sendable {
    /// Kao u aplikaciji: kuce sa brojevima, crtice, tacke, natpisi ASC i MC.
    case full
    /// Mali widget: krupniji znaci i planete, bez brojeva kuca, crtica i tacaka.
    case compact
  }

  public var theme: Theme
  public var detail: Detail
  /// Jedna boja (zakljucani ekran, obojeni brojcanici): bez ispuna, znak bez kruga.
  public var monochrome: Bool
  /// Always-On: prigusene boje, tanje linije.
  public var dimmed: Bool

  public init(theme: Theme = .light, detail: Detail = .full, monochrome: Bool = false, dimmed: Bool = false) {
    self.theme = theme
    self.detail = detail
    self.monochrome = monochrome
    self.dimmed = dimmed
  }
}

func boja(_ hex: UInt32, _ alpha: Double = 1) -> Color {
  Color(.sRGB, red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255,
        blue: Double(hex & 0xFF) / 255, opacity: alpha)
}

/// Brend boje (`theme/tokens.ts`).
public enum Brend {
  public static let indigo = boja(0x403F98)
  public static let lila = boja(0xB39DDB)
  public static let svetlaLila = boja(0xF3F4FA)
}

struct Boje {
  let disk: Color, line: Color, ink: Color, muted: Color, ugao: Color, tick: Color
  let tense = boja(0xF8B3C3), easy = boja(0x7ACCEA)

  init(_ s: WheelStyle) {
    if s.monochrome {
      disk = .clear; line = .primary.opacity(0.35); ink = .primary; muted = .primary.opacity(0.6)
      ugao = .primary; tick = .primary.opacity(0.25)
    } else if s.theme == .dark {
      disk = .clear; line = boja(0x3C3C44); ink = .white; muted = boja(0x9C9CA6)
      ugao = Brend.lila; tick = boja(0x2E2E34)
    } else {
      disk = .white; line = boja(0xD8D8D8); ink = boja(0x141414); muted = boja(0x8A8A8A)
      ugao = Brend.indigo; tick = boja(0xECECEC)
    }
  }
}

/// Poluprecnici i velicine, u jedinicama viewBox-a (`WHEEL_R` i `LABEL` u `wheel.ts`).
struct Mere {
  var outer = 174.0, zodiacIn = 144.0, planet = 116.0, houseRing = 88.0, houseNum = 32.0, hub = 22.0
  var znak = 22.0, glif = 19.5, glifIzv = 17.0, minSep = 9.5, okvir = 30.0
  var tackaPlanete = 2.2, debljina = 1.0

  static let full = Mere()
  /// Mali widget (~150 pt): sve sto ostaje mora biti citljivo, pa je krupnije.
  static let compact = Mere(zodiacIn: 132, planet: 104, houseRing: 76, houseNum: 0, hub: 0,
                            znak: 32, glif: 30, minSep: 17, okvir: 3, tackaPlanete: 3.2, debljina: 1.8)
}

public struct SkyWheelView: View {
  let sky: Sky
  let style: WheelStyle

  public init(sky: Sky, style: WheelStyle = WheelStyle()) {
    self.sky = sky
    self.style = style
  }

  public var body: some View {
    Canvas(rendersAsynchronously: false) { ctx, size in
      crtaj(&ctx, strana: min(size.width, size.height), size: size)
    }
    .aspectRatio(1, contentMode: .fit)
  }

  private func crtaj(_ ctx: inout GraphicsContext, strana: Double, size: CGSize) {
    let m = style.detail == .full ? Mere.full : Mere.compact
    let c = Boje(style)
    let full = style.detail == .full
    let view = 2 * (180 + m.okvir)
    let k = strana / view
    ctx.translateBy(x: (size.width - strana) / 2, y: (size.height - strana) / 2)
    ctx.scaleBy(x: k, y: k)
    ctx.translateBy(x: m.okvir, y: m.okvir)
    if style.dimmed { ctx.opacity = 0.7 }

    let centar = CGPoint(x: 180, y: 180)
    let houses = sky.houses
    // Bez mesta levo je 0° Ovna (`levaTacka`), i nema kuca, ASC ni MC.
    let leva = houses?.ascendant ?? 0
    func at(_ lon: Double, _ r: Double) -> CGPoint { polar(centar, r, chartAngle(lon, leva)) }
    func linija(_ a: CGPoint, _ b: CGPoint) -> Path { Path { $0.move(to: a); $0.addLine(to: b) } }
    func krug(_ r: Double, _ p: CGPoint = CGPoint(x: 180, y: 180)) -> Path {
      Path(ellipseIn: CGRect(x: p.x - r, y: p.y - r, width: 2 * r, height: 2 * r))
    }

    // --- prstenovi ---
    ctx.fill(krug(m.outer), with: .color(c.disk))
    ctx.stroke(krug(m.outer), with: .color(c.line), lineWidth: m.debljina)
    ctx.stroke(krug(m.zodiacIn), with: .color(c.line), lineWidth: m.debljina)

    // --- crtice na 5° i 10° (samo pun prikaz) ---
    if full {
      var d5 = Path(), d10 = Path()
      for deg in stride(from: 0, to: 360, by: 5) {
        let deset = deg % 10 == 0
        let a = at(Double(deg), m.zodiacIn), b = at(Double(deg), m.zodiacIn - (deset ? 8 : 4))
        if deset { d10.move(to: a); d10.addLine(to: b) } else { d5.move(to: a); d5.addLine(to: b) }
      }
      ctx.stroke(d5, with: .color(c.tick), lineWidth: 0.6)
      ctx.stroke(d10, with: .color(c.tick), lineWidth: 1)
    }

    // --- granice znakova + ikonice ---
    for (i, znak) in SIGN_SHAPES.enumerated() {
      let start = Double(i) * 30
      ctx.stroke(linija(at(start, m.zodiacIn), at(start, m.outer)), with: .color(c.line), lineWidth: m.debljina)
      let mid = at(start + 15, (m.outer + m.zodiacIn) / 2)
      // Jednobojno: samo znak, malo veci, jer krug u boji elementa tu ne postoji.
      let velicina = style.monochrome ? m.znak * 1.25 : m.znak
      var g = ctx
      g.translateBy(x: mid.x - velicina / 2, y: mid.y - velicina / 2)
      g.scaleBy(x: velicina / SIGN_VIEWBOX, y: velicina / SIGN_VIEWBOX)
      if !style.monochrome {
        g.fill(Path(ellipseIn: CGRect(x: 0, y: 0, width: 2 * SIGN_CENTER, height: 2 * SIGN_CENTER)), with: .color(boja(znak.color)))
      }
      g.fill(Oblici.znaci[i], with: .color(style.monochrome ? c.ink : .white), style: FillStyle(eoFill: znak.evenOdd))
    }

    // --- kuspide i ose ---
    if let houses {
      let ose = oseKarte(ascendant: houses.ascendant, midheaven: houses.midheaven)
      for cusp in houses.cusps where !naOsi(cusp, ose) {
        ctx.stroke(linija(at(cusp, m.hub), at(cusp, m.zodiacIn)), with: .color(c.line), lineWidth: 0.8 * m.debljina)
      }
      for lon in ose {
        ctx.stroke(linija(at(lon, m.hub), at(lon, m.zodiacIn)), with: .color(c.ink), lineWidth: 1.4 * m.debljina)
      }
      if m.hub > 0 {
        ctx.fill(krug(m.hub), with: .color(c.disk))
        ctx.stroke(krug(m.hub), with: .color(c.line), lineWidth: 1)
      }
    }

    // --- aspekti ---
    for a in sky.aspects {
      let (color, width, dash): (Color, Double, [CGFloat]) = {
        switch a.kind {
        case .conjunction: return (c.muted, 1.45, [4.4, 4.4])
        case .sextile: return (c.easy, 1.6, [5.8, 4.4])
        case .trine: return (c.easy, 2.2, [])
        case .square: return (c.tense, 2.2, [])
        case .opposition: return (c.tense, 2.5, [])
        }
      }()
      var g = ctx
      g.opacity = ctx.opacity * (0.65 + 0.35 * (1 - a.orb / a.kind.orb))
      g.stroke(linija(at(a.a.longitude, m.houseRing), at(a.b.longitude, m.houseRing)),
               with: .color(style.monochrome ? c.ink.opacity(0.5) : color),
               style: StrokeStyle(lineWidth: width * m.debljina, lineCap: .round, dash: dash.map { $0 * m.debljina }))
    }

    // --- brojevi kuca ---
    if let houses, full {
      for i in 0..<12 {
        let cusp = houses.cusps[i]
        let n = at(cusp + norm360(houses.cusps[(i + 1) % 12] - cusp) / 2, m.houseNum)
        ctx.fill(krug(5.5, n), with: .color(c.disk))
        ctx.draw(Text("\(i + 1)").font(.system(size: 8.5, design: .rounded)).foregroundColor(c.muted), at: n)
      }
    }

    // --- planete i tacke ---
    struct Simbol { let key: String; let lon: Double; let retro: Bool; let izvedena: Bool }
    var simboli = sky.planets.map { Simbol(key: $0.key, lon: $0.longitude, retro: $0.retrograde, izvedena: false) }
    if full { simboli += sky.points.map { Simbol(key: $0.key.rawValue, lon: $0.longitude, retro: $0.retrograde, izvedena: true) } }
    let minSep = full ? (simboli.count > 11 ? 8.5 : 9.5) : m.minSep
    let uglovi = spreadAngles(simboli.map { chartAngle($0.lon, leva) }, minSep: minSep)

    for (s, ugao) in zip(simboli, uglovi) {
      let pos = polar(centar, m.planet, ugao)
      let b = s.izvedena ? c.muted : c.ink
      let glif = s.izvedena ? m.glifIzv : m.glif
      let unutra = at(s.lon, m.zodiacIn - 7)
      ctx.stroke(linija(at(s.lon, m.zodiacIn), unutra), with: .color(b), lineWidth: (s.izvedena ? 0.9 : 1.2) * m.debljina)
      ctx.stroke(linija(unutra, polar(centar, m.planet + glif * 0.31, ugao)), with: .color(c.line), lineWidth: 0.7 * m.debljina)
      if !s.izvedena { ctx.fill(krug(m.tackaPlanete, at(s.lon, m.houseRing)), with: .color(b)) }

      if let oblik = Oblici.simboli[s.key], let mera = GLYPH_SHAPES[s.key] {
        // Kao SVG tekst u aplikaciji: sredina po sirini znaka, osnovna linija 0,353 visine ispod sredine.
        let r = glif / GLYPH_EM
        var g = ctx
        g.translateBy(x: pos.x - mera.advance * r / 2, y: pos.y + glif * 0.353)
        g.scaleBy(x: r, y: r)
        g.fill(oblik, with: .color(b))
      }
      if s.retro {
        let p = CGPoint(x: pos.x + glif * 0.64, y: pos.y + glif * 0.45)
        ctx.draw(Text("R").font(.system(size: glif * 0.45, weight: .medium, design: .rounded)).foregroundColor(c.muted), at: p)
      }
    }

    // --- ASC i MC van kruga ---
    if let houses, full {
      for (natpis, lon) in [("ASC", houses.ascendant), ("MC", houses.midheaven)] {
        ctx.stroke(linija(at(lon, m.outer), at(lon, m.outer + 7)), with: .color(c.ugao), lineWidth: 1.5)
        ctx.draw(Text(natpis).font(.system(size: 9.5, weight: .bold, design: .rounded)).foregroundColor(c.ugao),
                 at: at(lon, m.outer + 17))
      }
    }
  }
}

/// Najmanji prikaz (kruzna komplikacija, zakljucani ekran): prsten od 12 znakova
/// i planete kao tacke — Sunce prazan krug sa tackom, Mesec srp, ostale tacke.
public struct SkyDialView: View {
  let sky: Sky
  let style: WheelStyle

  public init(sky: Sky, style: WheelStyle = WheelStyle(theme: .dark)) {
    self.sky = sky
    self.style = style
  }

  public var body: some View {
    Canvas(rendersAsynchronously: false) { ctx, size in
      let strana = min(size.width, size.height)
      let k = strana / 100
      ctx.translateBy(x: (size.width - strana) / 2, y: (size.height - strana) / 2)
      ctx.scaleBy(x: k, y: k)
      if style.dimmed { ctx.opacity = 0.7 }
      let c = Boje(style)
      let centar = CGPoint(x: 50, y: 50)
      let leva = sky.houses?.ascendant ?? 0
      func at(_ lon: Double, _ r: Double) -> CGPoint { polar(centar, r, chartAngle(lon, leva)) }

      // Prsten: 12 lukova sa razmakom, u boji elementa (jednobojno: naizmenicno jace i slabije).
      for (i, znak) in SIGN_SHAPES.enumerated() {
        let a0 = chartAngle(Double(i) * 30 + 1.6, leva), a1 = chartAngle(Double(i) * 30 + 28.4, leva)
        var luk = Path()
        // Ugao na ekranu ide suprotno od kazaljke, a y nadole — otud minus i `clockwise: true`.
        luk.addArc(center: centar, radius: 44, startAngle: .degrees(-a0), endAngle: .degrees(-a1), clockwise: true)
        let b: Color = style.monochrome ? c.ink.opacity(i % 2 == 0 ? 0.9 : 0.45) : boja(znak.color)
        ctx.stroke(luk, with: .color(b), style: StrokeStyle(lineWidth: 7, lineCap: .butt))
      }
      if let houses = sky.houses {
        // Osa ASC—DSC, sa tackom na ascendentu.
        var osa = Path()
        osa.move(to: at(houses.ascendant, 38)); osa.addLine(to: at(houses.ascendant + 180, 38))
        ctx.stroke(osa, with: .color(c.line), lineWidth: 1.2)
      }

      let uglovi = spreadAngles(sky.planets.map { chartAngle($0.longitude, leva) }, minSep: 15)
      for (p, ugao) in zip(sky.planets, uglovi) {
        let pos = polar(centar, p.planet == .sun || p.planet == .moon ? 27 : 30, ugao)
        func krug(_ r: Double) -> Path { Path(ellipseIn: CGRect(x: pos.x - r, y: pos.y - r, width: 2 * r, height: 2 * r)) }
        switch p.planet {
        case .sun:
          ctx.stroke(krug(6), with: .color(c.ink), lineWidth: 2)
          ctx.fill(krug(1.8), with: .color(c.ink))
        case .moon:
          // Srp: pun krug iz kog je izbrisan pomeren krug (u svom sloju, da ne brise prsten ispod).
          ctx.drawLayer { sloj in
            sloj.fill(krug(6.5), with: .color(c.ink))
            sloj.blendMode = .destinationOut
            sloj.fill(Path(ellipseIn: CGRect(x: pos.x - 6.5 + 4.5, y: pos.y - 6.5 - 1, width: 13, height: 13)), with: .color(.black))
          }
        default:
          ctx.fill(krug(2.6), with: .color(style.monochrome ? c.ink.opacity(0.75) : c.ugao))
        }
      }
    }
    .aspectRatio(1, contentMode: .fit)
  }
}
