import SkyCore
import SwiftUI
import WidgetKit

/// Komplikacije "Nebo sada". Apple ne dozvoljava tudje brojcanike, pa je ovo
/// nacin da krug stoji na brojcaniku: kruzna, pravougaona (i Smart Stack),
/// ugaona i jedan red teksta. Dodir otvara aplikaciju na satu.
struct NeboKomplikacija: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "nebo", provider: NeboProvider()) { entry in
      NeboPrikaz(entry: entry).widgetURL(URL(string: "astrodial://wheel"))
    }
    .configurationDisplayName(Text("widget.ime", comment: "Ime komplikacije"))
    .description(Text("widget.opis", comment: "Opis komplikacije"))
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryCorner, .accessoryInline])
  }
}

struct MesecWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "mesec", provider: SatProvider()) { MesecKomplikacija(entry: $0) }
      .configurationDisplayName(Text(verbatim: Tekst.planet(.moon)))
      .description(Text(verbatim: "\(Tekst.planet(.moon)) → \(Tekst.sign(0)), \(Tekst.sign(1)) …"))
      .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryInline])
  }
}

struct SatWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "sat", provider: SatProvider()) { SatKomplikacija(entry: $0) }
      .configurationDisplayName(Text(verbatim: Tekst.t("ui.planetaryHour")))
      .description(Text(verbatim: Tekst.t("ui.planetaryHour")))
      .supportedFamilies([.accessoryCircular, .accessoryCorner])
  }
}

struct AscWidget: Widget {
  var body: some WidgetConfiguration {
    // Ascendent ide ~1° na 4 minuta, pa gusci raspored: 5 minuta, 8 sati unapred.
    StaticConfiguration(kind: "asc", provider: SatProvider(korak: 5 * 60, broj: 96)) { AscKomplikacija(entry: $0) }
      .configurationDisplayName(Text(verbatim: "ASC"))
      .description(Text(verbatim: "ASC"))
      .supportedFamilies([.accessoryCircular, .accessoryCorner])
  }
}

struct SledeceWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "sledece", provider: SatProvider()) { SledeceKomplikacija(entry: $0) }
      .configurationDisplayName(Text(verbatim: Tekst.t("ui.next")))
      .description(Text(verbatim: Tekst.t("ui.next")))
      .supportedFamilies([.accessoryRectangular, .accessoryInline])
  }
}

@main
struct AstroShopKomplikacije: WidgetBundle {
  var body: some Widget {
    NeboKomplikacija()
    MesecWidget()
    SatWidget()
    AscWidget()
    SledeceWidget()
  }
}
