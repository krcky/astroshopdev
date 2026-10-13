package expo.modules.nebowidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import expo.modules.kotlin.modules.Module
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
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

    // Koliko widgeta "Nebo sada" je vec na ekranu — kartica "Dodaj" na tabu "Nebo" se tada ne prikazuje.
    AsyncFunction("brojWidgeta") {
      val context = appContext.reactContext ?: return@AsyncFunction 0
      AppWidgetManager.getInstance(context)
        .getAppWidgetIds(ComponentName(context, NeboWidgetProvider::class.java)).size
    }

    // Sistemski dijalog "Dodaj na pocetni ekran" (Android 8+, ako ga pokretac podrzava).
    // false = dijaloga nema, aplikacija tada pokazuje uputstvo. true NE znaci da je korisnik potvrdio.
    AsyncFunction("dodajNaEkran") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return@AsyncFunction false
      val manager = AppWidgetManager.getInstance(context)
      if (!manager.isRequestPinAppWidgetSupported) return@AsyncFunction false
      manager.requestPinAppWidget(ComponentName(context, NeboWidgetProvider::class.java), null, null)
    }
  }
}
