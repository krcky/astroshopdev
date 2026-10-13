// Mesto po vremenskoj zoni — za satove, koji su ZASEBNE aplikacije i mesto ne
// dobijaju od telefona. Sat uzme grad svoje zone (bez dozvole za lokaciju), a
// korisnik moze rucno da izabere drugi. Tabela je iz tz baze
// (`scripts/native/skycore-zone.ts`).
import Foundation

public struct ZoneCity: Identifiable, Hashable, Sendable {
  /// Ime zone u tz bazi ("Europe/Belgrade").
  public let id: String
  public let latitude: Double
  public let longitude: Double

  /// Deo sveta, kako ga zove tz baza ("Europe", "America").
  public var region: String { String(id.split(separator: "/").first ?? "") }
  /// Ime grada iz imena zone ("Buenos Aires").
  public var name: String { String(id.split(separator: "/").last ?? "").replacingOccurrences(of: "_", with: " ") }
  public var place: Place { Place(latitude: latitude, longitude: longitude) }
}

public enum Zones {
  public static let all: [ZoneCity] = ZONE_PLACES.map { ZoneCity(id: $0.0, latitude: $0.1, longitude: $0.2) }
  private static let poImenu = Dictionary(uniqueKeysWithValues: all.map { ($0.id, $0) })

  public static func city(_ id: String) -> ZoneCity? { poImenu[id] }

  /// Grad zone u kojoj je uredjaj sada.
  public static var current: ZoneCity? { poImenu[TimeZone.current.identifier] }

  /// Delovi sveta redom, svaki sa gradovima po abecedi.
  public static let regions: [(name: String, cities: [ZoneCity])] = Dictionary(grouping: all, by: \.region)
    .map { (name: $0.key, cities: $0.value.sorted { $0.name < $1.name }) }
    .sorted { $0.name < $1.name }
}

extension SharedPlace {
  /// Zona koju je korisnik rucno izabrao na satu; `nil` = prati zonu sata.
  public static var chosenZone: String? {
    get { grupa?.string(forKey: "nebo.zona") }
    set {
      if let newValue { grupa?.set(newValue, forKey: "nebo.zona") } else { grupa?.removeObject(forKey: "nebo.zona") }
    }
  }

  /// Grad za sat: rucno izabran, inace grad zone sata.
  public static var watchCity: ZoneCity? { chosenZone.flatMap(Zones.city) ?? Zones.current }
}
