import SkyCore
import SwiftUI
import WatchConnectivity
import WidgetKit

@main
struct NeboSatApp: App {
  @WKApplicationDelegateAdaptor(Veza.self) private var veza

  var body: some Scene {
    WindowGroup {
      NeboEkran().environmentObject(veza)
    }
  }
}

/// Mesto posmatranja stize sa telefona (`modules/nebo-widget` -> WatchConnectivity,
/// `updateApplicationContext`): sistem cuva poslednju vrednost i isporuci je kad
/// se sat sledeci put probudi, pa aplikacija na satu radi i bez telefona u blizini.
/// Sat je cuva u svojoj grupi, da je vide i komplikacije.
final class Veza: NSObject, WKApplicationDelegate, WCSessionDelegate, ObservableObject {
  @Published var mesto: Place? = SharedPlace.read()

  func applicationDidFinishLaunching() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    primi(session.receivedApplicationContext)
  }

  func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
    primi(context)
  }

  private func primi(_ context: [String: Any]) {
    // Prazan kontekst = telefon jos nista nije poslao; ne brisati ono sto sat vec zna.
    guard context["nebo"] != nil else { return }
    let novo: Place? = (context["lat"] as? Double).flatMap { lat in
      (context["lon"] as? Double).map { Place(latitude: lat, longitude: $0) }
    }
    SharedPlace.write(novo)
    WidgetCenter.shared.reloadAllTimelines()
    DispatchQueue.main.async { self.mesto = novo }
  }
}
