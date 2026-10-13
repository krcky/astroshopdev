// PREPIS `src/lib/points.ts`. Konvencije su izabrane i proverene (pravilo 16):
// cvor je PRAVI (iz ugaonog momenta Meseca), Lilit je SREDNJI apogej, "R" na
// cvoru se RACUNA. Menja se tamo, pa ovde.
import Foundation
#if canImport(CAstronomy)
import CAstronomy
#endif

public func trueNodeLongitude(at date: Date) -> Double {
  let t = astroTime(date)
  let h = 0.001
  func eqj(_ time: astro_time_t) -> [Double] {
    let v = Astronomy_GeoMoon(time)
    return [v.x, v.y, v.z]
  }
  let p = eqj(t)
  let pre = eqj(Astronomy_AddDays(t, -h))
  let posle = eqj(Astronomy_AddDays(t, h))
  let v = (0..<3).map { (posle[$0] - pre[$0]) / (2 * h) }

  // Ugaoni moment r x v — normala na orbitalnu ravan. Rotira se tek ON, ne polozaji.
  var H = astro_vector_t()
  H.status = ASTRO_SUCCESS
  H.x = p[1] * v[2] - p[2] * v[1]
  H.y = p[2] * v[0] - p[0] * v[2]
  H.z = p[0] * v[1] - p[1] * v[0]
  H.t = t
  var tt = t
  let ect = Astronomy_RotateVector(Astronomy_Rotation_EQJ_ECT(&tt), H)
  return norm360(atan2(ect.x, -ect.y) * 180 / .pi)
}

/// Brzina cvora u stepenima po danu. Negativno = unazad.
public func nodeSpeed(at date: Date) -> Double {
  let dt = 0.5
  let pre = trueNodeLongitude(at: date.addingTimeInterval(-(dt / 2) * 86400))
  let posle = trueNodeLongitude(at: date.addingTimeInterval((dt / 2) * 86400))
  return angleDelta(posle, pre) / dt
}

public func meanLilithLongitude(at date: Date) -> Double {
  let T = astroTime(date).tt / 36525
  let perigej = 83.3532465 + 4069.0137287 * T - 0.0103200 * T * T
    - (T * T * T) / 80053 + (T * T * T * T) / 18999000
  return norm360(perigej + 180)
}

/// Dnevna karta: ASC + Mesec - Sunce. Nocna: ASC + Sunce - Mesec.
public func partOfFortuneLongitude(ascendant: Double, sun: Double, moon: Double, dayChart: Bool) -> Double {
  dayChart ? norm360(ascendant + moon - sun) : norm360(ascendant + sun - moon)
}

public enum PointKey: String, Sendable { case northNode, lilith, fortune }

public struct SkyPoint: Sendable {
  public let key: PointKey
  public let longitude: Double
  /// Samo cvor.
  public let retrograde: Bool
}
