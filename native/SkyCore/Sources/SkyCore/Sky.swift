// PREPIS `buildSky` iz `src/lib/sky.ts`: stanje neba u jednom trenutku.
import Foundation

public struct Place: Equatable, Sendable {
  public let latitude: Double
  public let longitude: Double
  public init(latitude: Double, longitude: Double) {
    self.latitude = latitude
    self.longitude = longitude
  }
}

public struct Sky: Sendable {
  public let date: Date
  public let planets: [PlanetPosition]
  /// `nil` kad mesto nije poznato: tada nema kuca, ASC ni MC, a levo je 0° Ovna
  /// (kao `bezKuca` u aplikaciji — radije priznati nego pogadjati).
  public let houses: Houses?
  /// Cvor i Lilit uvek; Tacka srece samo uz mesto (trazi ascendent).
  public let points: [SkyPoint]
  public let aspects: [Aspect]

  public func planet(_ p: Planet) -> PlanetPosition { planets.first { $0.planet == p }! }
}

public func buildSky(at date: Date, place: Place?) -> Sky {
  let planets = planetPositions(at: date)
  let houses = place.map { computeHouses(at: date, latitude: $0.latitude, longitude: $0.longitude) }
  var points = [
    SkyPoint(key: .northNode, longitude: trueNodeLongitude(at: date), retrograde: nodeSpeed(at: date) < 0),
    SkyPoint(key: .lilith, longitude: meanLilithLongitude(at: date), retrograde: false),
  ]
  if let houses {
    let sun = planets.first { $0.planet == .sun }!
    let moon = planets.first { $0.planet == .moon }!
    // Sunce iznad horizonta (kuce 7—12) = dnevna karta.
    let day = houses.house(of: sun.longitude) >= 7
    points.append(SkyPoint(
      key: .fortune,
      longitude: partOfFortuneLongitude(ascendant: houses.ascendant, sun: sun.longitude, moon: moon.longitude, dayChart: day),
      retrograde: false))
  }
  return Sky(date: date, planets: planets, houses: houses, points: points, aspects: findAspects(planets))
}
