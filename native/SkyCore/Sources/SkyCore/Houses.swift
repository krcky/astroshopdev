// PREPIS `src/lib/natal.ts` (uglovi i kuce). Menja se tamo, pa ovde.
import Foundation
#if canImport(CAstronomy)
import CAstronomy
#endif

private let DEG = Double.pi / 180
private let RAD = 180 / Double.pi
private func sind(_ d: Double) -> Double { sin(d * DEG) }
private func cosd(_ d: Double) -> Double { cos(d * DEG) }
private func tand(_ d: Double) -> Double { tan(d * DEG) }
private func asind(_ x: Double) -> Double { asin(max(-1, min(1, x))) * RAD }
private func atan2d(_ y: Double, _ x: Double) -> Double { atan2(y, x) * RAD }

/// Prava nagnutost ekliptike, u stepenima.
///
/// U C verziji `e_tilt` nije javna funkcija, pa se ugao cita iz matrice
/// EQD -> ECT, koja je rotacija oko x-ose bas za taj ugao ([[1,0,0],[0,c,-s],[0,s,c]]).
public func obliquity(at date: Date) -> Double {
  var t = astroTime(date)
  let r = Astronomy_Rotation_EQD_ECT(&t)
  return atan2(-r.rot.1.2, r.rot.1.1) * RAD
}

/// RAMC — lokalno zvezdano vreme u stepenima.
public func rightAscensionMC(at date: Date, longitude: Double) -> Double {
  var t = astroTime(date)
  let gast = Astronomy_SiderealTime(&t)
  return norm360((gast + longitude / 15) * 15)
}

private func eclipticFromRA(_ ra: Double, _ eps: Double) -> Double {
  norm360(atan2d(sind(ra), cosd(ra) * cosd(eps)))
}

public func midheaven(ramc: Double, eps: Double) -> Double { eclipticFromRA(ramc, eps) }

public func ascendant(ramc: Double, latitude: Double, eps: Double) -> Double {
  norm360(atan2d(cosd(ramc), -(sind(ramc) * cosd(eps) + tand(latitude) * sind(eps))))
}

/// Placidus medjukuspide (11, 12, 2, 3) — iterativno, nema zatvorene forme.
/// `nil` kad tacka nikad ne izlazi (polarne sirine).
private func placidusIntermediate(_ ramc: Double, _ latitude: Double, _ eps: Double, house: Int) -> Double? {
  let above = house == 11 || house == 12
  let n: Double = (house == 11 || house == 3) ? 1 : 2
  var ra = ramc + (above ? n * 30 : 180 - n * 30)
  for _ in 0..<100 {
    let lambda = eclipticFromRA(ra, eps)
    let decl = asind(sind(eps) * sind(lambda))
    let t = tand(latitude) * tand(decl)
    if abs(t) > 1 { return nil }
    let ad = asind(t)
    let next = above ? ramc + (n / 3) * (90 + ad) : ramc + 180 - (n / 3) * (90 - ad)
    if abs(next - ra) < 1e-10 { ra = next; break }
    ra = next
  }
  return eclipticFromRA(ra, eps)
}

public struct Houses: Sendable {
  /// 12 kuspida, indeks 0 = 1. kuca.
  public let cusps: [Double]
  public let ascendant: Double
  public let midheaven: Double
  /// Placidus nije bio moguc (polarna sirina) — kuce su Whole Sign.
  public let fellBack: Bool

  public func house(of longitude: Double) -> Int {
    let lon = norm360(longitude)
    for i in 0..<12 {
      let start = cusps[i]
      let span = norm360(cusps[(i + 1) % 12] - start)
      if norm360(lon - start) < span { return i + 1 }
    }
    return 1
  }
}

public func computeHouses(at date: Date, latitude: Double, longitude: Double) -> Houses {
  let eps = obliquity(at: date)
  let ramc = rightAscensionMC(at: date, longitude: longitude)
  let asc = ascendant(ramc: ramc, latitude: latitude, eps: eps)
  let mc = midheaven(ramc: ramc, eps: eps)

  guard let c11 = placidusIntermediate(ramc, latitude, eps, house: 11),
        let c12 = placidusIntermediate(ramc, latitude, eps, house: 12),
        let c2 = placidusIntermediate(ramc, latitude, eps, house: 2),
        let c3 = placidusIntermediate(ramc, latitude, eps, house: 3) else {
    let start = (asc / 30).rounded(.down) * 30
    return Houses(cusps: (0..<12).map { norm360(start + Double($0) * 30) },
                  ascendant: asc, midheaven: mc, fellBack: true)
  }
  let cusps = [
    asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180),
    norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12,
  ]
  return Houses(cusps: cusps, ascendant: asc, midheaven: mc, fellBack: false)
}
