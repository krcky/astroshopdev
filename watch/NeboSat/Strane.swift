import SkyCore
import SwiftUI

/// Zaglavlje strane: ime levo (sat je sistemski, gore desno).
private struct Naslov: View {
  let tekst: String
  var body: some View {
    Text(tekst).font(.system(size: 15, weight: .semibold, design: .rounded)).foregroundStyle(Brend.lila)
      .frame(maxWidth: .infinity, alignment: .leading)
  }
}

/// Strana 2 — Mesec: faza, znak sa trakom napretka, kad ulazi u sledeci, Mesec bez kursa.
struct StranaMesec: View {
  let s: Slika

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Naslov(tekst: Tekst.planet(.moon))
      HStack(spacing: 10) {
        MoonPhaseView(angle: s.moon.phaseAngle).frame(width: 44, height: 44)
        VStack(alignment: .leading, spacing: 0) {
          Text(Tekst.phase(s.moon.phase)).font(.system(size: 13, design: .rounded)).foregroundStyle(.secondary)
          Text("\(Int((s.moon.illumination * 100).rounded()))%").font(.system(size: 24, weight: .bold, design: .rounded))
        }
      }
      HStack(spacing: 6) {
        SignIcon(s.moon.sign).frame(width: 20, height: 20)
        Text("\(Tekst.sign(s.moon.sign)) \(Int(s.moon.degree))°").font(.system(size: 17, weight: .semibold, design: .rounded))
      }
      ProgressView(value: s.moon.progress).tint(Brend.lila)
      HStack {
        Text("→ \(Tekst.sign((s.moon.sign + 1) % 12))").foregroundStyle(.secondary)
        Spacer()
        Text(Tekst.when(s.moon.ingressAt, now: s.date)).fontWeight(.semibold)
      }
      .font(.system(size: 13, design: .rounded))
      HStack {
        Text(Tekst.t("ui.voc")).fontWeight(.semibold).foregroundStyle(Brend.lila)
        Spacer()
        // Dok traje: do kada. Pre toga: od kada.
        Text(s.voc.active ? "\(Tekst.t("ui.until")) \(Tekst.when(s.voc.end, now: s.date))" : Tekst.when(s.voc.start, now: s.date))
          .fontWeight(.semibold)
      }
      .font(.system(size: 13, design: .rounded))
      .padding(.horizontal, 10).padding(.vertical, 6)
      .background(s.voc.active ? Brend.indigo.opacity(0.55) : Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
    }
    .lineLimit(1).minimumScaleFactor(0.7)
    .padding(.horizontal, 8)
  }
}

/// Strana 3 — Sat: vladar planetarnog sata, sledeci, ascendent i MC, izlazak i zalazak Sunca.
struct StranaSat: View {
  let s: Slika
  let sky: Sky

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Naslov(tekst: Tekst.t("ui.hour"))
      if let h = s.hour {
        HStack(spacing: 10) {
          Prsten(h.progress(at: s.date)) {
            PlanetGlyph(h.ruler).fill(.primary).padding(11)
          }
          .frame(width: 54, height: 54)
          VStack(alignment: .leading, spacing: 0) {
            Text(Tekst.t("ui.planetaryHour")).font(.system(size: 12, design: .rounded)).foregroundStyle(.secondary)
            Text(Tekst.planet(h.ruler)).font(.system(size: 21, weight: .bold, design: .rounded))
            Text("\(Tekst.t("ui.until")) \(Tekst.when(h.end, now: s.date))").font(.system(size: 13, design: .rounded))
          }
        }
        HStack(spacing: 5) {
          Text(Tekst.t("ui.then")).foregroundStyle(.secondary)
          PlanetGlyph(h.next).fill(.primary).frame(width: 14, height: 14)
          Text(Tekst.planet(h.next)).fontWeight(.semibold)
        }
        .font(.system(size: 13, design: .rounded))
      } else {
        Text(Tekst.t("ui.noSun")).font(.system(size: 13, design: .rounded)).foregroundStyle(.secondary).lineLimit(2)
      }
      if let houses = sky.houses {
        HStack(spacing: 6) {
          ugao("ASC", houses.ascendant)
          ugao("MC", houses.midheaven)
        }
      }
      if let h = s.hour {
        HStack {
          Label(Tekst.when(h.sunrise, now: s.date), systemImage: "sunrise.fill")
          Spacer()
          Label(Tekst.when(h.sunset, now: s.date), systemImage: "sunset.fill")
        }
        .font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(.secondary)
      }
    }
    .lineLimit(1).minimumScaleFactor(0.7)
    .padding(.horizontal, 8)
  }

  private func ugao(_ ime: String, _ lon: Double) -> some View {
    let p = signFromLongitude(lon)
    return HStack(spacing: 5) {
      Text(ime).font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(Brend.lila)
      SignIcon(p.signIndex).frame(width: 16, height: 16)
      Text("\(p.deg)°").font(.system(size: 15, weight: .semibold, design: .rounded))
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 6)
    .background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
  }
}

/// Strana 4 — Sledece: dogadjaji po vremenu, pa sve planete, pa izbor mesta.
struct StranaSledece: View {
  let s: Slika
  let sky: Sky
  let grad: String

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 6) {
        Naslov(tekst: Tekst.t("ui.next"))
        ForEach(s.events) { e in
          HStack(spacing: 8) {
            PlanetGlyph(Tekst.glyph(e)).fill(.primary).frame(width: 18, height: 18)
            Text(Tekst.title(e)).font(.system(size: 14, weight: .semibold, design: .rounded))
            Spacer(minLength: 4)
            Text(Tekst.when(e.at, now: s.date)).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(Brend.lila)
          }
          .lineLimit(1).minimumScaleFactor(0.7)
          .padding(.horizontal, 10).padding(.vertical, 8)
          .background(Color.white.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
        }
        NeboLista(sky: sky).padding(.top, 8).padding(.horizontal, 4)
        NavigationLink { IzborMesta() } label: {
          Label(grad, systemImage: "mappin.and.ellipse")
        }
        .padding(.top, 6)
      }
      .padding(.horizontal, 8)
    }
  }
}
