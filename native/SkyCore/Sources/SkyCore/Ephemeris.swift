// PREPIS `src/lib/astro.ts` i `src/lib/zodiac.ts` — isti racun, ista biblioteka
// (astronomy-engine, ovde C verzija iste verzije kao npm paket). Menja se TAMO,
// pa se prenosi ovde; `npm run check:skycore` poredi oba sa istim vrednostima.
//
// Sve longitude su u ECT (prava ekliptika datuma) — pravilo 1 iz CLAUDE.md.
// NIKAD `Astronomy_Ecliptic()`: on vraca J2000.
import Foundation
#if canImport(CAstronomy)
import CAstronomy
#endif

public func norm360(_ deg: Double) -> Double {
  let m = deg.truncatingRemainder(dividingBy: 360)
  return m < 0 ? m + 360 : m
}

/// Razlika dva ugla svedena na (-180, 180].
func angleDelta(_ a: Double, _ b: Double) -> Double {
  var d = a - b
  while d > 180 { d -= 360 }
  while d <= -180 { d += 360 }
  return d
}

/// J2000 (1.1.2000. 12:00 UTC) u Unix sekundama — od njega astronomy-engine broji dane.
private let J2000_UNIX = 946_728_000.0

func astroTime(_ date: Date) -> astro_time_t {
  Astronomy_TimeFromDays((date.timeIntervalSince1970 - J2000_UNIX) / 86400.0)
}

/// Redosled je ISTI kao `BODIES` u `astro.ts` — od njega zavisi redosled aspekata.
public enum Planet: String, CaseIterable, Sendable {
  case moon, sun, mercury, venus, mars, jupiter, saturn, uranus, neptune, pluto

  var body: astro_body_t {
    switch self {
    case .moon: return BODY_MOON
    case .sun: return BODY_SUN
    case .mercury: return BODY_MERCURY
    case .venus: return BODY_VENUS
    case .mars: return BODY_MARS
    case .jupiter: return BODY_JUPITER
    case .saturn: return BODY_SATURN
    case .uranus: return BODY_URANUS
    case .neptune: return BODY_NEPTUNE
    case .pluto: return BODY_PLUTO
    }
  }

  /// Tezina u odabiru sadrzaja (`BODIES[].weight`).
  var weight: Double {
    switch self {
    case .moon, .sun: return 1.0
    case .mercury, .venus, .mars: return 0.8
    case .jupiter, .saturn: return 0.6
    case .uranus, .neptune, .pluto: return 0.4
    }
  }
}

/// Geocentricna eklipticka longituda tela, u ekliptici datuma.
func eclipticLongitude(_ body: astro_body_t, _ time: astro_time_t) -> Double {
  var t = time
  let eqj = Astronomy_GeoVector(body, time, ABERRATION)
  let ect = Astronomy_RotateVector(Astronomy_Rotation_EQJ_ECT(&t), eqj)
  return norm360(Astronomy_SphereFromVector(ect).lon)
}

public struct SignPosition: Equatable, Sendable {
  /// 0 = Ovan … 11 = Ribe.
  public let signIndex: Int
  /// Ceo stepen i lucni minut u znaku — minuti ODSECENI, kao u aplikaciji.
  public let deg: Int
  public let min: Int
}

public let SIGN_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]

public func signFromLongitude(_ longitude: Double) -> SignPosition {
  let lon = norm360(longitude)
  let totalSec = Int((lon * 3600 + 1e-6).rounded(.down)) % (360 * 3600)
  let totalMin = totalSec / 60
  let index = totalMin / 1800
  let within = totalMin - index * 1800
  return SignPosition(signIndex: index, deg: within / 60, min: within % 60)
}

public struct PlanetPosition: Sendable {
  public let planet: Planet
  public let longitude: Double
  /// Stepeni po danu. Negativno = retrogradno.
  public let speed: Double
  public var retrograde: Bool { speed < 0 }
  public var position: SignPosition { signFromLongitude(longitude) }
  public var key: String { planet.rawValue }
}

public func planetPositions(at date: Date) -> [PlanetPosition] {
  let t0 = astroTime(date)
  let dt = 0.5
  let t1 = Astronomy_AddDays(t0, dt)
  return Planet.allCases.map { p in
    let l0 = eclipticLongitude(p.body, t0)
    let l1 = eclipticLongitude(p.body, t1)
    return PlanetPosition(planet: p, longitude: l0, speed: angleDelta(l1, l0) / dt)
  }
}

public enum AspectKind: String, CaseIterable, Sendable {
  case conjunction, sextile, square, trine, opposition

  public var angle: Double {
    switch self {
    case .conjunction: return 0
    case .sextile: return 60
    case .square: return 90
    case .trine: return 120
    case .opposition: return 180
    }
  }

  /// Najveca dozvoljena orbita, u stepenima.
  public var orb: Double {
    switch self {
    case .conjunction, .opposition: return 8
    case .sextile: return 4
    case .square, .trine: return 6
    }
  }
}

public struct Aspect: Sendable {
  public let a: PlanetPosition
  public let b: PlanetPosition
  public let kind: AspectKind
  public let orb: Double
  public let score: Double
  public var contentKey: String { "\(a.key).\(kind.rawValue).\(b.key)" }
}

public func findAspects(_ positions: [PlanetPosition]) -> [Aspect] {
  var out: [Aspect] = []
  for i in 0..<positions.count {
    for j in (i + 1)..<max(i + 1, positions.count) {
      let a = positions[i], b = positions[j]
      let separation = abs(angleDelta(a.longitude, b.longitude))
      for kind in AspectKind.allCases {
        let orb = abs(separation - kind.angle)
        if orb > kind.orb { continue }
        let tightness = 1 - orb / kind.orb
        out.append(Aspect(a: a, b: b, kind: kind, orb: orb,
                          score: tightness * ((a.planet.weight + b.planet.weight) / 2)))
        break
      }
    }
  }
  // Stabilno, kao `Array.prototype.sort` u JS-u.
  return out.enumerated().sorted { x, y in
    x.element.score != y.element.score ? x.element.score > y.element.score : x.offset < y.offset
  }.map(\.element)
}

/// Faza Meseca u stepenima (0 = mlad, 90 = prva cetvrt, 180 = pun).
public func moonPhaseAngle(at date: Date) -> Double {
  Astronomy_MoonPhase(astroTime(date)).angle
}
