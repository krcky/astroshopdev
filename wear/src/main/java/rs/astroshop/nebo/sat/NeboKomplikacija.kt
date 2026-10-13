package rs.astroshop.nebo.sat

import android.app.PendingIntent
import android.content.Intent
import android.graphics.drawable.Icon
import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.data.SmallImage
import androidx.wear.watchface.complications.data.SmallImageComplicationData
import androidx.wear.watchface.complications.data.SmallImageType
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService
import rs.astroshop.nebo.core.Planet
import rs.astroshop.nebo.core.Sky
import rs.astroshop.nebo.core.buildSky

/**
 * Komplikacija za brojcanike: mali krug sa planetama (slika) ili Mesecev stepen i znak
 * (kratak tekst). Wear OS ne dozvoljava brojcanik koji sam racuna, pa je ovo nacin da
 * nebo stoji na brojcaniku. Sistem je osvezava na 15 minuta; dodir otvara aplikaciju.
 */
class NeboKomplikacija : SuspendingComplicationDataSourceService() {
    override fun getPreviewData(type: ComplicationType): ComplicationData? = podatak(type, buildSky(1_790_200_800_000L, null))

    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationData? =
        podatak(request.complicationType, buildSky(System.currentTimeMillis(), Mesto.procitaj(this)))

    private fun podatak(type: ComplicationType, sky: Sky): ComplicationData? {
        val otvori = PendingIntent.getActivity(this, 0, Intent(this, NeboActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val mesec = sky.planet(Planet.MOON).position
        // Znak kao Unicode slovo u tekstualnom obliku (U+FE0E), da ga sat ne nacrta kao emodzi.
        val opis = PlainComplicationText.Builder("☽ ${mesec.deg}° ${String(Character.toChars(0x2648 + mesec.signIndex))}︎").build()
        return when (type) {
            ComplicationType.SMALL_IMAGE -> SmallImageComplicationData.Builder(
                SmallImage.Builder(Icon.createWithBitmap(Slike.brojcanik(sky, 192)), SmallImageType.PHOTO).build(), opis)
                .setTapAction(otvori).build()
            ComplicationType.SHORT_TEXT -> ShortTextComplicationData.Builder(
                PlainComplicationText.Builder("${mesec.deg}° ${String(Character.toChars(0x2648 + mesec.signIndex))}︎").build(), opis)
                .setTitle(PlainComplicationText.Builder("☽︎").build())
                .setTapAction(otvori).build()
            else -> null
        }
    }
}
