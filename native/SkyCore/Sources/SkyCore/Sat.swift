// PREPIS `src/lib/sat.ts` — racun za Astrodial (sat): Mesec u znaku, Mesec bez
// kursa, planetarni sat i naredni dogadjaji. Menja se TAMO, pa ovde i u Kotlin-u;
// `npm run check:skycore` poredi sa `golden.json`. Trazenje trenutka je ista
// bisekcija, korak po korak, kao u TS-u — ne funkcije biblioteke.
// Vremena su u milisekundama od 1970 (Double), kao u TS-u.
import Foundation
#if canImport(CAstronomy)
import CAstronomy
#endif

private let SAT_MS = 3_600_000.0
private let DAN_MS = 86_400_000.0

private func lon(_ p: Planet, _ ms: Double) -> Double {
  eclipticLongitude(p.body, Astronomy_TimeFromDays((ms / 1000 - 946_728_000.0) / 86400.0))
}

private func znak(_ p: Planet, _ ms: Double) -> Int { Int((lon(p, ms) / 30).rounded(.down)) }

private func bisekcija(_ lo0: Double, _ hi0: Double, tacnost: Double = 500, _ uslov: (Double) -> Bool) -> Double {
  var lo = lo0, hi = hi0
  while hi - lo > tacnost {
    let mid = (lo + hi) / 2
    if uslov(mid) { hi = mid } else { lo = mid }
  }
  return hi
}

func sledeciUlazak(_ p: Planet, _ ms: Double, korak: Double, dana: Double) -> (at: Double, sign: Int)? {
  let z0 = znak(p, ms)
  var t = ms
  while t < ms + dana * DAN_MS {
    if znak(p, t + korak) != z0 {
      let at = bisekcija(t, t + korak) { znak(p, $0) != z0 }
      return (at, znak(p, at))
    }
    t += korak
  }
  return nil
}

public struct MoonNow: Sendable {
  /// 0 = Ovan … 11 = Ribe.
  public let sign: Int
  /// Stepen u znaku, 0—30.
  public let degree: Double
  /// Kad je usao u ovaj znak i kad ulazi u sledeci.
  public let enteredAt: Date
  public let ingressAt: Date
  /// Koliko je znaka presao, po vremenu (0—1).
  public let progress: Double
  public let phaseAngle: Double
  /// Osvetljeni deo, 0—1.
  public let illumination: Double
  /// Indeks faze 0—7 (0 = mlad Mesec).
  public let phase: Int
}

private func ms(_ d: Date) -> Double { d.timeIntervalSince1970 * 1000 }
private func datum(_ ms: Double) -> Date { Date(timeIntervalSince1970: ms / 1000) }

public func moonNow(at date: Date) -> MoonNow {
  let t0 = ms(date)
  let l = lon(.moon, t0)
  let sign = Int((l / 30).rounded(.down))
  var t = t0
  while znak(.moon, t - SAT_MS) == sign { t -= SAT_MS }
  let usao = bisekcija(t - SAT_MS, t) { znak(.moon, $0) == sign }
  let izlazi = sledeciUlazak(.moon, t0, korak: SAT_MS, dana: 4)!.at
  let faza = moonPhaseAngle(at: date)
  return MoonNow(
    sign: sign, degree: l - Double(sign) * 30, enteredAt: datum(usao), ingressAt: datum(izlazi),
    progress: (t0 - usao) / (izlazi - usao), phaseAngle: faza,
    illumination: (1 - cos(faza * .pi / 180)) / 2,
    phase: Int((norm360(faza + 22.5) / 45).rounded(.down)))
}

public struct VoidOfCourse: Sendable {
  public let start: Date
  public let end: Date
  public let active: Bool
}

private let ASPEKT_UGLOVI: [Double] = [0, 60, 90, 120, 180, 240, 270, 300]

/// Mesec bez kursa: od poslednjeg tacnog glavnog aspekta u tekucem znaku do ulaska u sledeci.
public func voidOfCourse(at date: Date, moon: MoonNow? = nil) -> VoidOfCourse {
  let m = moon ?? moonNow(at: date)
  let usao = ms(m.enteredAt), izlazi = ms(m.ingressAt)
  let korak = SAT_MS / 2
  var poslednji = usao
  for p in Planet.allCases where p != .moon {
    func rast(_ t: Double) -> Double { norm360(lon(.moon, t) - lon(p, t)) }
    var t = usao
    while t < izlazi {
      let kraj = min(t + korak, izlazi)
      let a = rast(t), b = rast(kraj)
      for cilj in ASPEKT_UGLOVI {
        let da = angleDelta(a, cilj), db = angleDelta(b, cilj)
        if da < 0, db >= 0, db - da < 90 {
          let at = bisekcija(t, kraj) { angleDelta(rast($0), cilj) >= 0 }
          if at > poslednji { poslednji = at }
        }
      }
      t += korak
    }
  }
  return VoidOfCourse(start: datum(poslednji), end: m.ingressAt, active: ms(date) >= poslednji)
}

private let HALDEJSKI: [Planet] = [.saturn, .jupiter, .mars, .sun, .venus, .mercury, .moon]
private let VLADAR_DANA: [Planet] = [.sun, .moon, .mars, .mercury, .jupiter, .venus, .saturn]

public struct PlanetaryHour: Sendable {
  public let ruler: Planet
  public let next: Planet
  public let start: Date
  public let end: Date
  /// 0—23 (0—11 dan, 12—23 noc).
  public let index: Int
  public let day: Bool
  public let sunrise: Date
  public let sunset: Date
  /// Koliko je sata proslo (0—1) u trenutku `at`.
  public func progress(at date: Date) -> Double {
    max(0, min(1, date.timeIntervalSince(start) / end.timeIntervalSince(start)))
  }
}

private func suncevDogadjaj(_ smer: astro_direction_t, _ odMs: Double, _ place: Place) -> Double? {
  let r = Astronomy_SearchRiseSetEx(
    BODY_SUN, Astronomy_MakeObserver(place.latitude, place.longitude, 0), smer,
    Astronomy_TimeFromDays((odMs / 1000 - 946_728_000.0) / 86400.0), 2, 0)
  guard r.status == ASTRO_SUCCESS else { return nil }
  return (r.time.ut * 86400 + 946_728_000.0) * 1000
}

/// Planetarni sat nad mestom; `nil` gde Sunce tog dana ne izlazi ili ne zalazi.
public func planetaryHour(at date: Date, place: Place) -> PlanetaryHour? {
  let t = ms(date)
  guard var izlazak = suncevDogadjaj(DIRECTION_RISE, t - 1.5 * DAN_MS, place), izlazak <= t else { return nil }
  while true {
    guard let sledeci = suncevDogadjaj(DIRECTION_RISE, izlazak + 60_000, place) else { return nil }
    if sledeci > t { break }
    izlazak = sledeci
  }
  guard let zalazak = suncevDogadjaj(DIRECTION_SET, izlazak, place),
        let sutra = suncevDogadjaj(DIRECTION_RISE, izlazak + 60_000, place), zalazak <= sutra else { return nil }

  let day = t < zalazak
  let pocetak = day ? izlazak : zalazak
  let duzina = (day ? zalazak - izlazak : sutra - zalazak) / 12
  let uDelu = min(11, Int(((t - pocetak) / duzina).rounded(.down)))
  let index = (day ? 0 : 12) + uDelu
  // Dan u nedelji po MESNOM vremenu izlaska (duzina / 15 sati); 1.1.1970. je cetvrtak.
  let dana = Int(((izlazak + place.longitude * 240_000) / DAN_MS).rounded(.down))
  let dan = (((dana + 4) % 7) + 7) % 7
  let prvi = HALDEJSKI.firstIndex(of: VLADAR_DANA[dan])!
  return PlanetaryHour(
    ruler: HALDEJSKI[(prvi + index) % 7], next: HALDEJSKI[(prvi + index + 1) % 7],
    start: datum(pocetak + Double(uDelu) * duzina), end: datum(pocetak + Double(uDelu + 1) * duzina),
    index: index, day: day, sunrise: datum(izlazak), sunset: datum(zalazak))
}

public enum SatEvent: Sendable, Identifiable {
  case moonSign(at: Date, sign: Int)
  case voc(at: Date)
  /// 0 mlad, 1 prva cetvrt, 2 pun, 3 poslednja cetvrt.
  case phase(at: Date, quarter: Int)
  case ingress(at: Date, body: Planet, sign: Int)
  case station(at: Date, body: Planet, retrograde: Bool)

  public var at: Date {
    switch self {
    case let .moonSign(at, _), let .voc(at), let .phase(at, _), let .ingress(at, _, _), let .station(at, _, _): return at
    }
  }
  public var id: String { "\(self)" }
}

private func brzina(_ p: Planet, _ ms: Double) -> Double { angleDelta(lon(p, ms + DAN_MS / 2), lon(p, ms)) / 0.5 }

/// Naredni dogadjaji po vremenu: Mesec (znak, bez kursa, cetvrti) i planete (ulazak u znak, stanica).
public func upcomingEvents(at date: Date, days: Double = 30) -> [SatEvent] {
  let t0 = ms(date)
  var out: [(Double, SatEvent)] = []
  let moon = moonNow(at: date)
  out.append((ms(moon.ingressAt), .moonSign(at: moon.ingressAt, sign: (moon.sign + 1) % 12)))
  let voc = voidOfCourse(at: date, moon: moon)
  if ms(voc.start) > t0 { out.append((ms(voc.start), .voc(at: voc.start))) }

  func faza(_ t: Double) -> Double { moonPhaseAngle(at: datum(t)) }
  let korakFaze = 6 * SAT_MS
  var t = t0
  while t < t0 + days * DAN_MS {
    let q0 = Int((faza(t) / 90).rounded(.down))
    if Int((faza(t + korakFaze) / 90).rounded(.down)) != q0 {
      let at = bisekcija(t, t + korakFaze) { Int((faza($0) / 90).rounded(.down)) != q0 }
      out.append((at, .phase(at: datum(at), quarter: (q0 + 1) % 4)))
    }
    t += korakFaze
  }

  for p in Planet.allCases where p != .moon {
    if let u = sledeciUlazak(p, t0, korak: DAN_MS, dana: days) {
      out.append((u.at, .ingress(at: datum(u.at), body: p, sign: u.sign)))
    }
    if p == .sun { continue }
    var d = t0
    while d < t0 + days * DAN_MS {
      let r0 = brzina(p, d) < 0
      if (brzina(p, d + DAN_MS) < 0) != r0 {
        let at = bisekcija(d, d + DAN_MS, tacnost: 30_000) { (brzina(p, $0) < 0) != r0 }
        out.append((at, .station(at: datum(at), body: p, retrograde: !r0)))
        break
      }
      d += DAN_MS
    }
  }
  // Stabilno, kao `sort` u JS-u.
  return out.enumerated().sorted { $0.element.0 != $1.element.0 ? $0.element.0 < $1.element.0 : $0.offset < $1.offset }.map(\.element.1)
}
