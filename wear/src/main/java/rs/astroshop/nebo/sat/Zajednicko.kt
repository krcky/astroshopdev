package rs.astroshop.nebo.sat

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import rs.astroshop.nebo.core.Place
import rs.astroshop.nebo.core.Planet
import rs.astroshop.nebo.core.SIGN_SHAPES
import rs.astroshop.nebo.core.Sky
import rs.astroshop.nebo.core.chartAngle
import rs.astroshop.nebo.core.spreadAngles
import rs.astroshop.nebo.crtez.SkyWheelCrtez
import rs.astroshop.nebo.crtez.Stil
import kotlin.math.cos
import kotlin.math.sin

/** Mesto posmatranja na satu: stize sa telefona (`MestoSaTelefona`), cuva se ovde. */
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

object Slike {
    /** Krug neba na crnoj (providnoj) podlozi, `px` piksela — za plocicu. */
    fun krug(sky: Sky, px: Int): Bitmap {
        val b = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888)
        SkyWheelCrtez.crtaj(Canvas(b), sky, 0f, 0f, px.toFloat(), Stil(tamno = true, zbijeno = true))
        return b
    }

    /**
     * Najmanji prikaz (komplikacija): prsten od 12 znakova u boji elementa i planete kao
     * tacke — Sunce prazan krug sa tackom, Mesec srp. Isto sto `SkyDialView` u Swift-u.
     */
    fun brojcanik(sky: Sky, px: Int): Bitmap {
        val b = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888)
        val c = Canvas(b)
        c.scale(px / 100f, px / 100f)
        val leva = sky.houses?.ascendant ?: 0.0
        fun tacka(r: Float, ugao: Double): FloatArray {
            val a = Math.toRadians(ugao)
            return floatArrayOf((50 + r * cos(a)).toFloat(), (50 - r * sin(a)).toFloat())
        }
        val potez = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE; strokeWidth = 7f }
        val oval = RectF(6f, 6f, 94f, 94f)
        SIGN_SHAPES.forEachIndexed { i, znak ->
            potez.color = znak.color.toInt()
            // Ugao na platnu ide u smeru kazaljke, a krug suprotno — otud minus.
            c.drawArc(oval, (-chartAngle(i * 30 + 1.6, leva)).toFloat(), -26.8f, false, potez)
        }
        val ispuna = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
        sky.houses?.let {
            potez.color = 0xFF3C3C44.toInt(); potez.strokeWidth = 1.2f
            val a = tacka(38f, 180.0); val d = tacka(38f, 0.0)
            c.drawLine(a[0], a[1], d[0], d[1], potez)
        }
        val uglovi = spreadAngles(sky.planets.map { chartAngle(it.longitude, leva) }, 15.0)
        sky.planets.forEachIndexed { i, p ->
            val veliko = p.planet == Planet.SUN || p.planet == Planet.MOON
            val pos = tacka(if (veliko) 27f else 30f, uglovi[i])
            when (p.planet) {
                Planet.SUN -> {
                    potez.color = 0xFFFFFFFF.toInt(); potez.strokeWidth = 2f
                    c.drawCircle(pos[0], pos[1], 6f, potez)
                    ispuna.color = 0xFFFFFFFF.toInt(); c.drawCircle(pos[0], pos[1], 1.8f, ispuna)
                }
                Planet.MOON -> {
                    val sloj = c.saveLayer(pos[0] - 8, pos[1] - 8, pos[0] + 8, pos[1] + 8, null)
                    ispuna.color = 0xFFFFFFFF.toInt(); c.drawCircle(pos[0], pos[1], 6.5f, ispuna)
                    ispuna.xfermode = android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.DST_OUT)
                    c.drawCircle(pos[0] + 4.5f, pos[1] - 1f, 6.5f, ispuna)
                    ispuna.xfermode = null
                    c.restoreToCount(sloj)
                }
                else -> { ispuna.color = 0xFFB39DDB.toInt(); c.drawCircle(pos[0], pos[1], 2.6f, ispuna) }
            }
        }
        return b
    }
}
