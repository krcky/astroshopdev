import SkyCore
import SwiftUI
import WidgetKit

/// Komplikacije "Nebo sada". Apple ne dozvoljava tudje brojcanike, pa je ovo
/// nacin da krug stoji na brojcaniku: kruzna, pravougaona (i Smart Stack),
/// ugaona i jedan red teksta. Dodir otvara aplikaciju na satu.
struct NeboKomplikacija: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "nebo", provider: NeboProvider()) { entry in
      NeboPrikaz(entry: entry)
    }
    .configurationDisplayName(Text("widget.ime", comment: "Ime komplikacije"))
    .description(Text("widget.opis", comment: "Opis komplikacije"))
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryCorner, .accessoryInline])
  }
}

@main
struct AstroShopKomplikacije: WidgetBundle {
  var body: some Widget {
    NeboKomplikacija()
  }
}
