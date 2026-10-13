// Komplikacije Astrodial-a (sat): Mesec u znaku, planetarni sat, ascendent i sledeci
// dogadjaj. Svaka otvara SVOJU stranu aplikacije (`astrodial://moon` …). Krug je u
// `NeboWidgetKit.swift`.
#if os(watchOS)
import SwiftUI
import WidgetKit

public struct SatEntry: TimelineEntry {
  public let date: Date
  public let moon: MoonNow
  public let hour: PlanetaryHour?
  /// Ascendent; `nil` bez mesta.
  public let ascendant: Double?
  public let next: SatEvent?
}

/// Unosi unapred, racunati na satu. `korak` je gust za ascendent (ide ~1° na 4 minuta),
/// redak za ostalo; dogadjaji se traze JEDNOM po vremenskoj liniji, pa se za svaki unos
/// uzima prvi koji tek dolazi.
public struct SatProvider: TimelineProvider {
  let korak: TimeInterval
  let broj: Int

  public init(korak: TimeInterval = 15 * 60, broj: Int = 96) {
    self.korak = korak
    self.broj = broj
  }

  private func unos(_ t: Date, _ mesto: Place?, _ dogadjaji: [SatEvent]) -> SatEntry {
    SatEntry(
      date: t, moon: moonNow(at: t),
      hour: mesto.flatMap { planetaryHour(at: t, place: $0) },
      ascendant: mesto.map { computeHouses(at: t, latitude: $0.latitude, longitude: $0.longitude).ascendant },
      next: dogadjaji.first { $0.at > t })
  }

  public func placeholder(in context: Context) -> SatEntry { unos(.now, SharedPlace.read(), []) }

  public func getSnapshot(in context: Context, completion: @escaping (SatEntry) -> Void) {
    completion(unos(.now, SharedPlace.read(), upcomingEvents(at: .now, days: 3)))
  }

  public func getTimeline(in context: Context, completion: @escaping (Timeline<SatEntry>) -> Void) {
    let mesto = SharedPlace.read()
    let pocetak = Date(timeIntervalSince1970: (Date.now.timeIntervalSince1970 / korak).rounded(.down) * korak)
    let dogadjaji = upcomingEvents(at: pocetak)
    let unosi = (0..<broj).map { unos(pocetak.addingTimeInterval(Double($0) * korak), mesto, dogadjaji) }
    completion(Timeline(entries: unosi, policy: .atEnd))
  }
}

/// Mesec u znaku: prsten se puni dok Mesec prelazi znak.
@available(watchOS 10.0, *)
public struct MesecKomplikacija: View {
  let e: SatEntry
  @Environment(\.widgetFamily) private var family
  public init(entry: SatEntry) { e = entry }

  public var body: some View {
    let eo = FillStyle(eoFill: SIGN_SHAPES[e.moon.sign].evenOdd)
    Group {
      switch family {
      case .accessoryInline:
        Text("☽\u{FE0E} \(Tekst.sign(e.moon.sign)) \(Int(e.moon.degree))° → \(Tekst.when(e.moon.ingressAt, now: e.date))")
      case .accessoryCorner:
        SignGlyph(e.moon.sign).fill(.primary, style: eo).scaleEffect(1.5)
          .widgetLabel { ProgressView(value: e.moon.progress) { Text("☽\u{FE0E} \(Int(e.moon.degree))°") } }
      default:
        Prsten(e.moon.progress, boja: .primary, debljina: 4) {
          VStack(spacing: 0) {
            PlanetGlyph(.moon).fill(.primary).frame(width: 15, height: 15)
            HStack(spacing: 1) {
              SignGlyph(e.moon.sign).fill(.primary, style: eo).frame(width: 13, height: 13).scaleEffect(1.3)
              Text("\(Int(e.moon.degree))°").font(.system(size: 11, weight: .bold, design: .rounded))
            }
          }
        }
      }
    }
    .containerBackground(for: .widget) { Color.black }
    .widgetURL(URL(string: "astrodial://moon"))
  }
}

/// Lunarni dan: broj dana od mladog Meseca (1—30) i izgled Meseca.
@available(watchOS 10.0, *)
public struct LunarKomplikacija: View {
  let e: SatEntry
  @Environment(\.widgetFamily) private var family
  public init(entry: SatEntry) { e = entry }

  public var body: some View {
    Group {
      switch family {
      case .accessoryInline:
        Text("\(Tekst.t("ui.lunarDay")) \(e.moon.lunarDay) · \(Tekst.phase(e.moon.phase))")
      case .accessoryCorner:
        Text("\(e.moon.lunarDay)").font(.system(size: 22, weight: .bold, design: .rounded))
          .widgetLabel { Text(Tekst.phase(e.moon.phase)) }
      case .accessoryRectangular:
        HStack(spacing: 8) {
          MoonPhaseView(angle: e.moon.phaseAngle).frame(width: 40, height: 40)
          VStack(alignment: .leading, spacing: 0) {
            Text("\(Tekst.t("ui.lunarDay")) \(e.moon.lunarDay)").font(.system(size: 16, weight: .bold, design: .rounded))
            Text(Tekst.phase(e.moon.phase)).font(.system(size: 13, design: .rounded)).foregroundStyle(.secondary)
            Text("\(Int((e.moon.illumination * 100).rounded()))%").font(.system(size: 13, weight: .semibold, design: .rounded))
          }
          .lineLimit(1).minimumScaleFactor(0.7)
          Spacer(minLength: 0)
        }
      default:
        // Prsten = koliko je lunarnog meseca proslo; u sredini broj dana.
        Prsten(Double(e.moon.lunarDay) / 30, boja: .primary, debljina: 4) {
          VStack(spacing: -2) {
            Text("\(e.moon.lunarDay)").font(.system(size: 19, weight: .bold, design: .rounded))
            PlanetGlyph(.moon).fill(.primary).frame(width: 10, height: 10)
          }
        }
      }
    }
    .containerBackground(for: .widget) { Color.black }
    .widgetURL(URL(string: "astrodial://lunar"))
  }
}

/// Planetarni sat: simbol vladara, prsten koliko je sata proslo.
@available(watchOS 10.0, *)
public struct SatKomplikacija: View {
  let e: SatEntry
  @Environment(\.widgetFamily) private var family
  public init(entry: SatEntry) { e = entry }

  public var body: some View {
    Group {
      if let h = e.hour {
        switch family {
        case .accessoryCorner:
          PlanetGlyph(h.ruler).fill(.primary).padding(2)
            .widgetLabel { ProgressView(value: h.progress(at: e.date)) { Text(Tekst.when(h.end, now: e.date)) } }
        default:
          Prsten(h.progress(at: e.date), boja: .primary, debljina: 4) {
            PlanetGlyph(h.ruler).fill(.primary).padding(11)
          }
        }
      } else {
        // Polarni dan ili noc: planetarnih sati nema.
        Image(systemName: "sun.horizon")
      }
    }
    .containerBackground(for: .widget) { Color.black }
    .widgetURL(URL(string: "astrodial://hour"))
  }
}

/// Ascendent: znak i stepen koji upravo izlaze na istoku.
@available(watchOS 10.0, *)
public struct AscKomplikacija: View {
  let e: SatEntry
  @Environment(\.widgetFamily) private var family
  public init(entry: SatEntry) { e = entry }

  public var body: some View {
    Group {
      if let lon = e.ascendant {
        let p = signFromLongitude(lon)
        let eo = FillStyle(eoFill: SIGN_SHAPES[p.signIndex].evenOdd)
        switch family {
        case .accessoryCorner:
          SignGlyph(p.signIndex).fill(.primary, style: eo).scaleEffect(1.5)
            .widgetLabel { Text("ASC \(p.deg)°") }
        default:
          VStack(spacing: 0) {
            Text("ASC").font(.system(size: 9, weight: .bold, design: .rounded)).foregroundStyle(.secondary)
            Text("\(p.deg)°").font(.system(size: 16, weight: .bold, design: .rounded))
            SignGlyph(p.signIndex).fill(.primary, style: eo).frame(width: 13, height: 13).scaleEffect(1.3)
          }
        }
      } else {
        Text("ASC").font(.system(size: 12, weight: .bold, design: .rounded))
      }
    }
    .containerBackground(for: .widget) { Color.black }
    .widgetURL(URL(string: "astrodial://hour"))
  }
}

/// Sledeci dogadjaj na nebu — i za Smart Stack.
@available(watchOS 10.0, *)
public struct SledeceKomplikacija: View {
  let e: SatEntry
  @Environment(\.widgetFamily) private var family
  public init(entry: SatEntry) { e = entry }

  public var body: some View {
    Group {
      if let d = e.next {
        switch family {
        case .accessoryInline:
          Text("\(Tekst.title(d)) · \(Tekst.when(d.at, now: e.date))")
        default:
          HStack(spacing: 8) {
            PlanetGlyph(Tekst.glyph(d)).fill(.primary).frame(width: 26, height: 26)
            VStack(alignment: .leading, spacing: 1) {
              Text(Tekst.when(d.at, now: e.date)).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(.secondary)
              Text(Tekst.title(d)).font(.system(size: 16, weight: .bold, design: .rounded)).lineLimit(2).minimumScaleFactor(0.7)
            }
            Spacer(minLength: 0)
          }
        }
      } else {
        Text("—")
      }
    }
    .containerBackground(for: .widget) { Color.black }
    .widgetURL(URL(string: "astrodial://next"))
  }
}
#endif
