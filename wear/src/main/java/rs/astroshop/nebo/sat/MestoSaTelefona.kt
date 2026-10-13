package rs.astroshop.nebo.sat

import android.content.ComponentName
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import rs.astroshop.nebo.core.Place

/**
 * Mesto posmatranja stize sa telefona kroz sloj podataka (`/nebo/mesto`, upisuje ga
 * `NeboWidgetModule` u telefonskoj aplikaciji). Sistem cuva poslednju vrednost i isporuci
 * je kad se sat poveze, pa telefon ne mora biti u blizini. Bez mesta krug je bez kuca.
 */
class MestoSaTelefona : WearableListenerService() {
    override fun onDataChanged(events: DataEventBuffer) {
        for (e in events) {
            if (e.dataItem.uri.path != "/nebo/mesto") continue
            if (e.type == DataEvent.TYPE_DELETED) {
                Mesto.upisi(this, null)
            } else {
                val m = DataMapItem.fromDataItem(e.dataItem).dataMap
                Mesto.upisi(this, if (m.containsKey("lat") && m.containsKey("lon")) Place(m.getDouble("lat"), m.getDouble("lon")) else null)
            }
            TileService.getUpdater(this).requestUpdate(NeboPlocica::class.java)
            ComplicationDataSourceUpdateRequester.create(this, ComponentName(this, NeboKomplikacija::class.java)).requestUpdateAll()
        }
    }
}
