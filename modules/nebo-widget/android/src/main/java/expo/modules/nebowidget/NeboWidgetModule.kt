package expo.modules.nebowidget

import android.content.Context
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import rs.astroshop.nebo.core.Place
import rs.astroshop.nebo.widget.Mesto
import rs.astroshop.nebo.widget.NeboWidgetProvider

/**
 * Veza aplikacije i widgeta "Nebo sada" (isto ime i isti poziv kao na iOS-u).
 * Widget racuna nebo sam; aplikacija mu javlja samo MESTO posmatranja.
 */
class NeboWidgetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NeboWidget")

    Function("postaviMesto") { latitude: Double?, longitude: Double? ->
      val context = appContext.reactContext ?: return@Function
      Mesto.upisi(context, if (latitude != null && longitude != null) Place(latitude, longitude) else null)
      NeboWidgetProvider.osveziSve(context)
      posaljiSatu(context, latitude, longitude)
    }
  }

  /**
   * Isto mesto ide i na Wear OS sat (`wear/`, `MestoSaTelefona`) kroz sloj podataka:
   * sistem cuva poslednju vrednost i isporuci je kad se sat poveze. Telefon bez Google
   * Play usluga ili bez sata to tiho preskace.
   */
  private fun posaljiSatu(context: Context, latitude: Double?, longitude: Double?) {
    try {
      val zahtev = PutDataMapRequest.create("/nebo/mesto")
      if (latitude != null && longitude != null) {
        zahtev.dataMap.putDouble("lat", latitude)
        zahtev.dataMap.putDouble("lon", longitude)
      }
      Wearable.getDataClient(context).putDataItem(zahtev.asPutDataRequest().setUrgent())
    } catch (_: Throwable) {
    }
  }
}
