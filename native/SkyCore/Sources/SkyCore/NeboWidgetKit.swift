// Zajednicki deo widgeta na telefonu i komplikacija na satu: unosi, racun
// unapred i prikaz po velicini. Target nosi samo `@main` i spisak velicina.
#if os(iOS) || os(watchOS)
import SwiftUI
import WidgetKit

public struct NeboEntry: TimelineEntry {
  public let date: Date
  public let sky: Sky
}

/// Nebo se racuna NA UREDJAJU, bez mreze: 96 trenutaka unapred (24 h na 15 min).
/// Krug je ukljesten na ascendent, koji se pomeri ~1° na 4 minuta, pa je 15 minuta
/// najvise ~4° okreta izmedju dva prikaza. Kad vreme istekne, sistem trazi novo.
public struct NeboProvider: TimelineProvider {
  public static let KORAK: TimeInterval = 15 * 60
  public static let BROJ = 96

  public init() {}

  public func placeholder(in context: Context) -> NeboEntry {
    NeboEntry(date: .now, sky: buildSky(at: .now, place: SharedPlace.read()))
  }

  public func getSnapshot(in context: Context, completion: @escaping (NeboEntry) -> Void) {
    completion(placeholder(in: context))
  }

  public func getTimeline(in context: Context, completion: @escaping (Timeline<NeboEntry>) -> Void) {
    let mesto = SharedPlace.read()
    // Od pocetka tekuce cetvrti sata, da se prikazi menjaju na :00, :15, :30, :45.
    let pocetak = Date(timeIntervalSince1970: (Date.now.timeIntervalSince1970 / Self.KORAK).rounded(.down) * Self.KORAK)
    let unosi = (0..<Self.BROJ).map { i -> NeboEntry in
      let t = pocetak.addingTimeInterval(Double(i) * Self.KORAK)
      return NeboEntry(date: t, sky: buildSky(at: t, place: mesto))
    }
    completion(Timeline(entries: unosi, policy: .atEnd))
  }
}

/// Pod se gradi i za stariji iOS (cilj aplikacije); widget targeti su iOS 17 / watchOS 10.
@available(iOS 17.0, watchOS 10.0, *)
public struct NeboPrikaz: View {
  let entry: NeboEntry
  @Environment(\.widgetFamily) private var family
  @Environment(\.colorScheme) private var shema
  @Environment(\.widgetRenderingMode) private var rezim
  @Environment(\.isLuminanceReduced) private var priguseno

  public init(entry: NeboEntry) { self.entry = entry }

  /// Obojeni pocetni ekran, zakljucani ekran i obojeni brojcanici crtaju sve jednom bojom.
  private var jednobojno: Bool { rezim != .fullColor }

  private func stil(_ detalj: WheelStyle.Detail) -> WheelStyle {
    WheelStyle(theme: shema == .dark ? .dark : .light, detail: detalj, monochrome: jednobojno, dimmed: priguseno)
  }

  public var body: some View {
    sadrzaj.containerBackground(for: .widget) { shema == .dark ? Color.black : Color.white }
  }

  @ViewBuilder private var sadrzaj: some View {
    let sky = entry.sky
    switch family {
    #if os(iOS)
    case .systemSmall:
      SkyWheelView(sky: sky, style: stil(.compact)).padding(-8)

    case .systemMedium:
      HStack(spacing: 10) {
        SkyWheelView(sky: sky, style: stil(.compact)).padding(-8)
        Grid(alignment: .leading, horizontalSpacing: 10, verticalSpacing: 6) {
          // Dve kolone po pet: licne planete levo, spore desno.
          ForEach(0..<5, id: \.self) { i in
            GridRow {
              RedPlanete(sky.planet(Self.LEVO[i]), jednobojno: jednobojno)
              RedPlanete(sky.planet(Self.DESNO[i]), jednobojno: jednobojno)
            }
          }
        }
        .frame(maxWidth: .infinity)
      }

    case .systemLarge:
      SkyWheelView(sky: sky, style: stil(.full)).padding(-12)
    #endif

    #if os(watchOS)
    case .accessoryCorner:
      // Ugao brojcanika: znak u kome je Mesec, uz luk sa njegovim stepenom.
      let mesec = sky.planet(.moon).position
      SignGlyph(mesec.signIndex).fill(.primary, style: FillStyle(eoFill: SIGN_SHAPES[mesec.signIndex].evenOdd))
        .scaleEffect(1.5)
        .widgetLabel { Label("\(mesec.deg)°", systemImage: "moon.fill") }
    #endif

    case .accessoryCircular:
      SkyDialView(sky: sky, style: WheelStyle(theme: .dark, monochrome: jednobojno, dimmed: priguseno))

    case .accessoryRectangular:
      NeboPravougaono(sky: sky, dimmed: priguseno)

    case .accessoryInline:
      // Jedan red teksta: Sunce i Mesec sa znakom — simboli, bez reci.
      let s = sky.planet(.sun).position, m = sky.planet(.moon).position
      Text("☉\u{FE0E} \(s.deg)° \(znakSlovo(s.signIndex))  ☽\u{FE0E} \(m.deg)° \(znakSlovo(m.signIndex))")

    default:
      SkyDialView(sky: sky, style: WheelStyle(theme: .dark, monochrome: jednobojno, dimmed: priguseno))
    }
  }

  static let LEVO: [Planet] = [.sun, .moon, .mercury, .venus, .mars]
  static let DESNO: [Planet] = [.jupiter, .saturn, .uranus, .neptune, .pluto]
}
#endif
