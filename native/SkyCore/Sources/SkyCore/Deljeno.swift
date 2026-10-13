// Mesto posmatranja koje dele aplikacija, widget i sat.
//
// Na telefonu ga upisuje aplikacija (`modules/nebo-widget`) u App Group, a widget
// ga odatle cita. SAT JE ZASEBNA APLIKACIJA (Ivan, 13.10.2026) i telefon mu nista
// ne salje: mesto je grad vremenske zone sata ili grad izabran na satu (`Zone.swift`),
// u grupi koju sat deli sa svojim komplikacijama. Bez mesta krug je bez kuca.
import Foundation

public enum SharedPlace {
  /// Ime grupe se IZVODI iz bundle id-ja, ne pise se u kodu: aplikacija je
  /// `<id>`, njen widget (ili komplikacije sata) `<id>.widget`, a grupa `group.<id>`. Probni build sa drugim id-jem (`….test`) tako
  /// dobija svoju grupu, a prava ostaje slobodna za nalog firme.
  static var grupa: UserDefaults? {
    guard let id = Bundle.main.bundleIdentifier else { return nil }
    var delovi = id.split(separator: ".").map(String.init)
    if delovi.last == "widget" { delovi.removeLast() }
    return UserDefaults(suiteName: "group." + delovi.joined(separator: "."))
  }

  public static func read() -> Place? {
    #if os(watchOS)
    return watchCity?.place
    #else
    guard let g = grupa, g.object(forKey: "nebo.lat") != nil, g.object(forKey: "nebo.lon") != nil else { return nil }
    return Place(latitude: g.double(forKey: "nebo.lat"), longitude: g.double(forKey: "nebo.lon"))
    #endif
  }

  public static func write(_ place: Place?) {
    guard let g = grupa else { return }
    if let place {
      g.set(place.latitude, forKey: "nebo.lat")
      g.set(place.longitude, forKey: "nebo.lon")
    } else {
      g.removeObject(forKey: "nebo.lat")
      g.removeObject(forKey: "nebo.lon")
    }
  }
}
