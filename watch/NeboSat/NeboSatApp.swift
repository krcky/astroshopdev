import SkyCore
import SwiftUI
import WidgetKit

/// Astro Shop za Apple Watch — ZASEBNA aplikacija (samo za sat, prodaje se odvojeno od
/// telefonske; Ivan, 13.10.2026). Nebo se racuna na satu (SkyCore), bez telefona i mreze.
@main
struct NeboSatApp: App {
  @StateObject private var mesto = Mesto()

  var body: some Scene {
    WindowGroup {
      NeboEkran().environmentObject(mesto)
    }
  }
}

/// Mesto posmatranja na satu: grad vremenske zone sata (bez dozvole za lokaciju) ili
/// grad koji je korisnik izabrao. Cuva se u grupi koju aplikacija deli sa komplikacijama.
final class Mesto: ObservableObject {
  /// Rucno izabrana zona; `nil` = prati zonu sata.
  @Published var izabrana: String? = SharedPlace.chosenZone

  var grad: ZoneCity? { izabrana.flatMap(Zones.city) ?? Zones.current }

  func izaberi(_ zona: String?) {
    izabrana = zona
    SharedPlace.chosenZone = zona
    WidgetCenter.shared.reloadAllTimelines()
  }
}
