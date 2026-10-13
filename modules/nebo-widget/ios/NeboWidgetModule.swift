import ExpoModulesCore
import WidgetKit

/// Veza aplikacije i widgeta "Nebo sada".
///
/// Widget racuna nebo sam (SkyCore), ali za kuce i ascendent mora da zna MESTO
/// posmatranja — isto ono koje je izabrano na tabu "Nebo". Aplikacija ga upisuje
/// u deljeni App Group, a widget ga odatle cita (`SharedPlace` u native/SkyCore).
/// Sat je ZASEBNA aplikacija (`watch/`) i odavde ne dobija nista.
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
    }
  }

}
