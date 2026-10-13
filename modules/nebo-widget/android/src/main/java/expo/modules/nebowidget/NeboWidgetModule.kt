package expo.modules.nebowidget

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import rs.astroshop.nebo.core.Place
import rs.astroshop.nebo.widget.Mesto
import rs.astroshop.nebo.widget.NeboWidgetProvider

/**
 * Veza aplikacije i widgeta "Nebo sada" (isto ime i isti poziv kao na iOS-u).
 * Widget racuna nebo sam; aplikacija mu javlja samo MESTO posmatranja.
 * Sat (Wear OS, `wear/`) je ZASEBNA aplikacija i odavde ne dobija nista.
 */
class NeboWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NeboWidget")

    Function("postaviMesto") { latitude: Double?, longitude: Double? ->
      val context = appContext.reactContext ?: return@Function
      Mesto.upisi(context, if (latitude != null && longitude != null) Place(latitude, longitude) else null)
      NeboWidgetProvider.osveziSve(context)
    }
  }
}
