import SkyCore
import SwiftUI

/// Ono sto strane Mesec, Sat i Sledece prikazuju. Racuna se VAN glavne niti (trazenje
/// Meseca bez kursa i dogadjaja za 30 dana traje), najvise jednom u minutu.
struct Slika {
  let date: Date
  let moon: MoonNow
  let voc: VoidOfCourse
  let hour: PlanetaryHour?
  let events: [SatEvent]
}

@MainActor
final class Stanje: ObservableObject {
  @Published var slika: Slika?
  private var kljuc = ""
  private var poslednje = Date.distantPast

  func osvezi(_ date: Date, grad: ZoneCity?) {
    let novi = grad?.id ?? "-"
    guard novi != kljuc || abs(date.timeIntervalSince(poslednje)) >= 55 else { return }
    kljuc = novi
    poslednje = date
    let place = grad?.place
    Task.detached(priority: .userInitiated) {
      let moon = moonNow(at: date)
      let s = Slika(
        date: date, moon: moon, voc: voidOfCourse(at: date, moon: moon),
        hour: place.flatMap { planetaryHour(at: date, place: $0) },
        events: upcomingEvents(at: date))
      await MainActor.run { self.slika = s }
    }
  }
}
