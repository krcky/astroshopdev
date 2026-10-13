import SkyCore
import SwiftUI

/// Sest strana, prevlacenjem nagore: krug, planete, Mesec, krug Mesecevih mena, Sat, Sledece. Na PRVOJ kruna pomera
/// vreme — zarez je 15 minuta, pa brz okret prelazi dane; dok je vreme pomereno pise koje je,
/// a dodir na taj natpis vraca na sada. Strelica u uglovima NEMA (Ivan, 14.10.2026: prekrivale su znake).
/// Komplikacije otvaraju svoju stranu (`astrodial://moon` …).
struct NeboEkran: View {
  @EnvironmentObject private var mesto: Mesto
  @StateObject private var stanje = Stanje()
  /// Pomeraj od sadasnjeg trenutka, u cetvrtima sata.
  @State private var pomeraj = 0.0
  /// Pocetna strana; argument pri pokretanju (`-strana moon`) sluzi proveri u simulatoru, gde `openurl` ne radi.
  @State private var strana = UserDefaults.standard.string(forKey: "strana") ?? "wheel"
  @Environment(\.isLuminanceReduced) private var priguseno

  private var pomereno: Bool { pomeraj.rounded() != 0 }

  var body: some View {
    NavigationStack {
      // Dok je sadasnjost, sve se osvezava svakog minuta; pomereno vreme stoji.
      TimelineView(.periodic(from: .now, by: 60)) { vreme in
        let trenutak = vreme.date.addingTimeInterval(pomeraj.rounded() * 15 * 60)
        let sky = buildSky(at: trenutak, place: mesto.grad?.place)

        TabView(selection: $strana) {
          // Natpis sa pomerenim vremenom je PREKO kruga (`overlay`), da ne menja njegovu velicinu ni mesto.
          SkyWheelView(sky: sky, style: WheelStyle(theme: .dark, detail: .compact, dimmed: priguseno))
            // Krug je kvadrat u sredini raspolozivog prostora; bez okvira bi se, kad je prostor visi nego
            // sirok, poravnao ulevo i izasao preko desne ivice.
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .ignoresSafeArea(.container, edges: .bottom)
            .overlay(alignment: .bottom) {
              if pomereno {
                Button { withAnimation { pomeraj = 0 } } label: {
                  HStack(spacing: 4) {
                    Image(systemName: "arrow.uturn.backward")
                    Text(trenutak, format: .dateTime.day().month(.abbreviated).hour().minute().locale(Tekst.locale))
                  }
                  .font(.system(size: 12, weight: .semibold, design: .rounded))
                  .padding(.horizontal, 8).padding(.vertical, 3)
                  .background(.black.opacity(0.75), in: Capsule())
                  .overlay(Capsule().stroke(Brend.lila.opacity(0.6), lineWidth: 1))
                }
                .buttonStyle(.plain)
                .foregroundStyle(Brend.lila)
              }
          }
          .focusable()
          .digitalCrownRotation($pomeraj, from: -96 * 366, through: 96 * 366, by: 1,
                                sensitivity: .medium, isContinuous: false, isHapticFeedbackEnabled: true)
          .tag("wheel")

          StranaPlanete(sky: sky).tag("planets")

          Group {
            if let s = stanje.slika { StranaMesec(s: s) } else { ProgressView() }
          }
          .tag("moon")

          Group {
            if let s = stanje.slika { StranaLuna(s: s) } else { ProgressView() }
          }
          .tag("lunar")

          Group {
            if let s = stanje.slika { StranaSat(s: s, sky: sky) } else { ProgressView() }
          }
          .tag("hour")

          Group {
            if let s = stanje.slika { StranaSledece(s: s, grad: mesto.grad?.name ?? "—") } else { ProgressView() }
          }
          .tag("next")
        }
        .tabViewStyle(.verticalPage)
        .background(.black)
        .onAppear { stanje.osvezi(trenutak, grad: mesto.grad) }
        .onChange(of: trenutak) { _, novo in stanje.osvezi(novo, grad: mesto.grad) }
        .onChange(of: mesto.izabrana) { _, _ in stanje.osvezi(trenutak, grad: mesto.grad) }
      }
      .onOpenURL { url in
        if let ime = url.host, ["wheel", "planets", "moon", "lunar", "hour", "next"].contains(ime) { strana = ime }
      }
    }
  }
}

/// Izbor mesta: "prati sat" (grad vremenske zone sata) ili grad sa spiska, po delovima sveta.
struct IzborMesta: View {
  @EnvironmentObject private var mesto: Mesto

  var body: some View {
    List {
      Button { mesto.izaberi(nil) } label: {
        HStack {
          VStack(alignment: .leading) {
            Label(Tekst.t("ui.followWatch"), systemImage: "clock")
            Text(Zones.current?.name ?? "—").font(.footnote).foregroundStyle(.secondary)
          }
          Spacer()
          if mesto.izabrana == nil { Image(systemName: "checkmark").foregroundStyle(Brend.lila) }
        }
      }
      ForEach(Zones.regions, id: \.name) { deo in
        NavigationLink(Tekst.t("region.\(deo.name)")) {
          List(deo.cities) { grad in
            Button { mesto.izaberi(grad.id) } label: {
              HStack {
                Text(grad.name)
                Spacer()
                if mesto.izabrana == grad.id { Image(systemName: "checkmark").foregroundStyle(Brend.lila) }
              }
            }
          }
          .navigationTitle(Tekst.t("region.\(deo.name)"))
        }
      }
    }
    .navigationTitle(Tekst.t("ui.place"))
  }
}
