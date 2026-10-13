import SkyCore
import SwiftUI
import WidgetKit

/// Widget "Nebo sada". Racun, unosi i prikaz su u SkyCore (`NeboWidgetKit.swift`),
/// zajednicki sa komplikacijama na satu; ovde je samo sta telefon nudi.
struct NeboWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "nebo", provider: NeboProvider()) { entry in
      NeboPrikaz(entry: entry)
        // Kroz kapiju aplikacije (`app/index.tsx`), ne pravo na tab — pravilo 11.
        .widgetURL(URL(string: "astroshop:///?tab=sky"))
    }
    .configurationDisplayName(Text("widget.ime", comment: "Ime widgeta u galeriji"))
    .description(Text("widget.opis", comment: "Opis widgeta u galeriji"))
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}

@main
struct AstroShopWidgets: WidgetBundle {
  var body: some Widget {
    NeboWidget()
  }
}
