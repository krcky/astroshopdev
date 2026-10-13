import ExpoModulesCore
import WatchConnectivity
import WidgetKit

/// Veza aplikacije i widgeta "Nebo sada".
///
/// Widget racuna nebo sam (SkyCore), ali za kuce i ascendent mora da zna MESTO
/// posmatranja — isto ono koje je izabrano na tabu "Nebo". Aplikacija ga upisuje
/// u deljeni App Group, a widget ga odatle cita (`SharedPlace` u native/SkyCore).
/// Isto mesto ide i na Apple Watch (WatchConnectivity): sistem cuva poslednju
/// vrednost i isporuci je kad se sat probudi, pa telefon ne mora biti u blizini.
///
/// Ime grupe se IZVODI iz bundle id-ja ("group." + id), ne pise se ovde: probni
/// build preko besplatnog Apple naloga ima drugi bundle id (`….test`), pa i
/// drugu grupu, a prava ostaje slobodna za nalog firme.
public class NeboWidgetModule: Module {
  private var grupa: UserDefaults? {
    guard let id = Bundle.main.bundleIdentifier else { return nil }
    return UserDefaults(suiteName: "group.\(id)")
  }

  public func definition() -> ModuleDefinition {
    Name("NeboWidget")

    /// Mesto posmatranja; `nil` = nema ga (odjava) — widget tada crta krug bez kuca.
    Function("postaviMesto") { (latitude: Double?, longitude: Double?) in
      guard let grupa = self.grupa else { return }
      if let latitude, let longitude {
        grupa.set(latitude, forKey: "nebo.lat")
        grupa.set(longitude, forKey: "nebo.lon")
      } else {
        grupa.removeObject(forKey: "nebo.lat")
        grupa.removeObject(forKey: "nebo.lon")
      }
      WidgetCenter.shared.reloadAllTimelines()
      self.sat.posalji(latitude: latitude, longitude: longitude)
    }
  }

  private let sat = VezaSaSatom()
}

/// Salje mesto satu. Sesija se otvara tek pri prvom slanju; ako sat nije uparen
/// ili aplikacija na njemu nije instalirana, slanje se tiho preskace.
private final class VezaSaSatom: NSObject, WCSessionDelegate {
  private var ceka: [String: Any]?

  func posalji(latitude: Double?, longitude: Double?) {
    guard WCSession.isSupported() else { return }
    // "nebo" razlikuje "mesta nema" (odjava) od praznog konteksta pre prvog slanja.
    var kontekst: [String: Any] = ["nebo": 1]
    if let latitude, let longitude {
      kontekst["lat"] = latitude
      kontekst["lon"] = longitude
    }
    let sesija = WCSession.default
    if sesija.activationState == .activated {
      try? sesija.updateApplicationContext(kontekst)
    } else {
      ceka = kontekst
      sesija.delegate = self
      sesija.activate()
    }
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    guard state == .activated, let kontekst = ceka else { return }
    ceka = nil
    try? session.updateApplicationContext(kontekst)
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) { session.activate() }
}
