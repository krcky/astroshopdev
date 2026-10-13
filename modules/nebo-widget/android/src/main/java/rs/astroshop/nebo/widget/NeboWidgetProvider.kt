package rs.astroshop.nebo.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.widget.RemoteViews
import expo.modules.nebowidget.R
import rs.astroshop.nebo.core.Place
import rs.astroshop.nebo.core.buildSky
import rs.astroshop.nebo.crtez.SkyWheelCrtez
import rs.astroshop.nebo.crtez.Stil
import kotlin.math.min

/** Mesto posmatranja koje je upisala aplikacija (`NeboWidgetModule`, `src/lib/nebo-widget.ts`). */
object Mesto {
    private const val FAJL = "nebo"

    fun procitaj(context: Context): Place? {
        val p = context.getSharedPreferences(FAJL, Context.MODE_PRIVATE)
        if (!p.contains("lat") || !p.contains("lon")) return null
        return Place(Double.fromBits(p.getLong("lat", 0)), Double.fromBits(p.getLong("lon", 0)))
    }

    fun upisi(context: Context, place: Place?) {
        val e = context.getSharedPreferences(FAJL, Context.MODE_PRIVATE).edit()
        if (place != null) e.putLong("lat", place.latitude.toBits()).putLong("lon", place.longitude.toBits())
        else e.remove("lat").remove("lon")
        e.apply()
    }
}

/**
 * Widget "Nebo sada" (Android). Nebo se racuna NA TELEFONU, bez mreze (`core/SkyCore.kt`),
 * i crta u bitmapu. Jedan widget, promenljive velicine: kvadrat = krug, sirok = krug + lista
 * deset planeta, veliki = krug kao u aplikaciji. Bez reci — isti na svakom jeziku.
 *
 * OSVEZAVANJE: sistem ga zove na 30 minuta (najmanje sto Android dozvoljava), a uz to
 * ide budilnik na 15 minuta koji NE budi telefon — dok ekran spava, widget se ne crta.
 */
class NeboWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) {
        for (id in ids) nacrtaj(context, manager, id)
    }

    override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, id: Int, options: Bundle) {
        nacrtaj(context, manager, id)
    }

    override fun onEnabled(context: Context) {
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).setInexactRepeating(
            AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime() + KORAK_MS, KORAK_MS, budilnik(context))
    }

    override fun onDisabled(context: Context) {
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).cancel(budilnik(context))
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == OSVEZI) osveziSve(context)
    }

    companion object {
        private const val OSVEZI = "rs.astroshop.nebo.OSVEZI"
        private const val KORAK_MS = 15 * 60 * 1000L
        /** Najveca stranica bitmape: RemoteViews ima granicu memorije, a krug ne trazi vise. */
        private const val NAJVISE_PX = 900f

        private fun budilnik(context: Context) = PendingIntent.getBroadcast(
            context, 0, Intent(context, NeboWidgetProvider::class.java).setAction(OSVEZI),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        fun osveziSve(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            for (id in manager.getAppWidgetIds(ComponentName(context, NeboWidgetProvider::class.java))) nacrtaj(context, manager, id)
        }

        private fun nacrtaj(context: Context, manager: AppWidgetManager, id: Int) {
            val o = manager.getAppWidgetOptions(id)
            val uspravno = context.resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT
            // Uspravno je widget najuzi i najvisi sto moze biti, polozeno obrnuto.
            val wDp = (if (uspravno) o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH) else o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH)).coerceAtLeast(110)
            val hDp = (if (uspravno) o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT) else o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT)).coerceAtLeast(110)

            val views = RemoteViews(context.packageName, R.layout.nebo_widget)
            views.setImageViewBitmap(R.id.nebo_slika, slika(context, wDp, hDp))
            // Kroz kapiju aplikacije (`app/index.tsx`), ne pravo na tab — pravilo 11.
            val otvori = Intent(Intent.ACTION_VIEW, Uri.parse("astroshop:///?tab=sky")).setPackage(context.packageName)
            views.setOnClickPendingIntent(R.id.nebo_okvir, PendingIntent.getActivity(
                context, 0, otvori, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
            manager.updateAppWidget(id, views)
        }

        /** Slika widgeta velicine `wDp` x `hDp`. Javno zbog provere izgleda (`dev` snimak). */
        fun slika(context: Context, wDp: Int, hDp: Int, millis: Long = System.currentTimeMillis()): Bitmap {
            val tamno = (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
            val gustina = min(context.resources.displayMetrics.density, NAJVISE_PX / maxOf(wDp, hDp))
            val w = wDp * gustina
            val h = hDp * gustina
            val bitmap = Bitmap.createBitmap(w.toInt(), h.toInt(), Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            val sky = buildSky(millis, Mesto.procitaj(context))
            val rub = 6 * gustina
            val strana = min(w, h) - 2 * rub

            if (w >= h * 1.6f) {
                // Sirok: krug levo, lista desno.
                SkyWheelCrtez.crtaj(canvas, sky, rub, (h - strana) / 2, strana, Stil(tamno, zbijeno = true))
                val levo = rub + strana + 10 * gustina
                SkyWheelCrtez.crtajListu(canvas, sky, levo, rub + strana * 0.06f, w - levo - rub, strana * 0.88f, Stil(tamno))
            } else {
                // Veliki widget ima mesta za pun krug (kuce sa brojevima, tacke, ASC i MC).
                val zbijeno = min(wDp, hDp) < 250
                SkyWheelCrtez.crtaj(canvas, sky, (w - strana) / 2, (h - strana) / 2, strana, Stil(tamno, zbijeno))
            }
            return bitmap
        }
    }
}
