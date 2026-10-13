import SkyCore
import SwiftUI

/// Dve strane: krug preko celog ekrana i lista planeta. KRUNA POMERA VREME —
/// jedan zarez je 15 minuta, pa brz okret prelazi dane; dok je vreme pomereno,
/// pise koje je, a dodir na taj natpis vraca na sada. Bez reci u prikazu.
struct NeboEkran: View {
  @EnvironmentObject private var veza: Veza
  /// Pomeraj od sadasnjeg trenutka, u cetvrtima sata.
  @State private var pomeraj = 0.0
  @Environment(\.isLuminanceReduced) private var priguseno

  private var pomereno: Bool { pomeraj.rounded() != 0 }

  var body: some View {
    // Dok je sadasnjost, krug se osvezava svakog minuta; pomereno vreme stoji.
    TimelineView(.periodic(from: .now, by: 60)) { vreme in
      let trenutak = vreme.date.addingTimeInterval(pomeraj.rounded() * 15 * 60)
      let sky = buildSky(at: trenutak, place: veza.mesto)

      TabView {
        ZStack(alignment: .bottom) {
          SkyWheelView(sky: sky, style: WheelStyle(theme: .dark, detail: .compact, dimmed: priguseno))
            .padding(-6)
            .ignoresSafeArea(.container, edges: [.bottom, .horizontal])
          if pomereno {
            Button { withAnimation { pomeraj = 0 } } label: {
              HStack(spacing: 4) {
                Image(systemName: "arrow.uturn.backward")
                Text(trenutak, format: .dateTime.day().month(.abbreviated).hour().minute())
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

        ScrollView {
          NeboLista(sky: sky).frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 6)
        }
      }
      .tabViewStyle(.verticalPage)
      .background(.black)
    }
  }
}
