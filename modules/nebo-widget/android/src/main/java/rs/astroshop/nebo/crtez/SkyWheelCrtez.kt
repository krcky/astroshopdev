package rs.astroshop.nebo.crtez

import android.graphics.Canvas
import android.graphics.DashPathEffect
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Typeface
import androidx.core.graphics.PathParser
import rs.astroshop.nebo.core.AspectKind
import rs.astroshop.nebo.core.GLYPH_EM
import rs.astroshop.nebo.core.GLYPH_SHAPES
import rs.astroshop.nebo.core.SIGN_CENTER
import rs.astroshop.nebo.core.SIGN_SHAPES
import rs.astroshop.nebo.core.SIGN_VIEWBOX
import rs.astroshop.nebo.core.Sky
import rs.astroshop.nebo.core.chartAngle
import rs.astroshop.nebo.core.naOsi
import rs.astroshop.nebo.core.norm360
import rs.astroshop.nebo.core.oseKarte
import rs.astroshop.nebo.core.signFromLongitude
import rs.astroshop.nebo.core.spreadAngles
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * Krug neba na Android platnu — isti crtez kao `natal-wheel.tsx` u aplikaciji i
 * `SkyWheelView` u Swift-u (mere iz `lib/wheel.ts`, boje iz `lib/tocak-stil.ts`).
 * Kad se RASPORED tocka u aplikaciji promeni, ista izmena ide i ovde.
 * Crta se u bitmapu: widget na Androidu ne moze da crta sam.
 */
class Stil(
    val tamno: Boolean = false,
    /** Mali prikaz: krupniji znaci i planete, bez brojeva kuca, crtica i tacaka. */
    val zbijeno: Boolean = false,
) {
    val disk = if (tamno) 0x00000000 else 0xFFFFFFFF.toInt()
    val line = if (tamno) 0xFF3C3C44.toInt() else 0xFFD8D8D8.toInt()
    val ink = if (tamno) 0xFFFFFFFF.toInt() else 0xFF141414.toInt()
    val muted = if (tamno) 0xFF9C9CA6.toInt() else 0xFF8A8A8A.toInt()
    val ugao = if (tamno) 0xFFB39DDB.toInt() else 0xFF403F98.toInt()
    val tick = if (tamno) 0xFF2E2E34.toInt() else 0xFFECECEC.toInt()
    val tense = 0xFFF8B3C3.toInt()
    val easy = 0xFF7ACCEA.toInt()
}

/** Poluprecnici i velicine u jedinicama viewBox-a (`WHEEL_R` i `LABEL` u `wheel.ts`). */
private class Mere(
    val outer: Float = 174f, val zodiacIn: Float = 144f, val planet: Float = 116f, val houseRing: Float = 88f,
    val houseNum: Float = 32f, val hub: Float = 22f, val znak: Float = 22f, val glif: Float = 19.5f,
    val glifIzv: Float = 17f, val minSep: Double = 9.5, val okvir: Float = 30f,
    val tackaPlanete: Float = 2.2f, val debljina: Float = 1f,
)

private val PUNE = Mere()
private val ZBIJENE = Mere(zodiacIn = 132f, planet = 104f, houseRing = 76f, houseNum = 0f, hub = 0f,
    znak = 32f, glif = 30f, minSep = 17.0, okvir = 3f, tackaPlanete = 3.2f, debljina = 1.8f)

object Oblici {
    val znaci: List<Path> by lazy {
        SIGN_SHAPES.map { PathParser.createPathFromPathData(it.d).apply { if (it.evenOdd) fillType = Path.FillType.EVEN_ODD } }
    }
    val simboli: Map<String, Path> by lazy { GLYPH_SHAPES.mapValues { PathParser.createPathFromPathData(it.value.d) } }
    val pismo: Typeface by lazy { Typeface.create(Typeface.DEFAULT, Typeface.BOLD) }
}

object SkyWheelCrtez {
    /** Krug u kvadratu stranice `strana` (pikseli), sa gornjim levim uglom u (`x`, `y`). */
    fun crtaj(canvas: Canvas, sky: Sky, x: Float, y: Float, strana: Float, stil: Stil) {
        val m = if (stil.zbijeno) ZBIJENE else PUNE
        val view = 2 * (180f + m.okvir)
        canvas.save()
        canvas.translate(x, y)
        canvas.scale(strana / view, strana / view)
        canvas.translate(m.okvir, m.okvir)

        val houses = sky.houses
        val leva = houses?.ascendant ?: 0.0 // bez mesta levo je 0° Ovna, i nema kuca
        fun px(lon: Double, r: Float) = polar(r, chartAngle(lon, leva))
        val potez = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.STROKE }
        val ispuna = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
        fun linija(a: FloatArray, b: FloatArray, boja: Int, sirina: Float) {
            potez.color = boja; potez.strokeWidth = sirina; potez.pathEffect = null; potez.alpha = boja ushr 24
            canvas.drawLine(a[0], a[1], b[0], b[1], potez)
        }
        fun krug(r: Float, c: FloatArray, boja: Int, pun: Boolean, sirina: Float = 1f) {
            val p = if (pun) ispuna else potez
            p.color = boja; if (!pun) { potez.strokeWidth = sirina; potez.pathEffect = null }
            canvas.drawCircle(c[0], c[1], r, p)
        }
        val centar = floatArrayOf(180f, 180f)

        // --- prstenovi ---
        if (stil.disk != 0) krug(m.outer, centar, stil.disk, true)
        krug(m.outer, centar, stil.line, false, m.debljina)
        krug(m.zodiacIn, centar, stil.line, false, m.debljina)

        // --- crtice na 5° i 10° ---
        if (!stil.zbijeno) for (deg in 0 until 360 step 5) {
            val deset = deg % 10 == 0
            linija(px(deg.toDouble(), m.zodiacIn), px(deg.toDouble(), m.zodiacIn - (if (deset) 8f else 4f)), stil.tick, if (deset) 1f else 0.6f)
        }

        // --- granice znakova + ikonice ---
        SIGN_SHAPES.forEachIndexed { i, znak ->
            val start = i * 30.0
            linija(px(start, m.zodiacIn), px(start, m.outer), stil.line, m.debljina)
            val mid = px(start + 15, (m.outer + m.zodiacIn) / 2)
            crtajZnak(canvas, i, mid[0], mid[1], m.znak, ispuna)
        }

        // --- kuspide i ose ---
        if (houses != null) {
            val ose = oseKarte(houses.ascendant, houses.midheaven)
            for (cusp in houses.cusps) if (!naOsi(cusp, ose)) linija(px(cusp, m.hub), px(cusp, m.zodiacIn), stil.line, 0.8f * m.debljina)
            for (lon in ose) linija(px(lon, m.hub), px(lon, m.zodiacIn), stil.ink, 1.4f * m.debljina)
            if (m.hub > 0) {
                krug(m.hub, centar, if (stil.tamno) 0xFF000000.toInt() else stil.disk, true)
                krug(m.hub, centar, stil.line, false, 1f)
            }
        }

        // --- aspekti ---
        for (a in sky.aspects) {
            val (boja, sirina, crta) = when (a.kind) {
                AspectKind.CONJUNCTION -> Triple(stil.muted, 1.45f, floatArrayOf(4.4f, 4.4f))
                AspectKind.SEXTILE -> Triple(stil.easy, 1.6f, floatArrayOf(5.8f, 4.4f))
                AspectKind.TRINE -> Triple(stil.easy, 2.2f, null)
                AspectKind.SQUARE -> Triple(stil.tense, 2.2f, null)
                AspectKind.OPPOSITION -> Triple(stil.tense, 2.5f, null)
            }
            val p1 = px(a.a.longitude, m.houseRing)
            val p2 = px(a.b.longitude, m.houseRing)
            potez.color = boja
            potez.strokeWidth = sirina * m.debljina
            potez.strokeCap = Paint.Cap.ROUND
            potez.pathEffect = crta?.let { DashPathEffect(floatArrayOf(it[0] * m.debljina, it[1] * m.debljina), 0f) }
            potez.alpha = (255 * (0.65 + 0.35 * (1 - a.orb / a.kind.orb))).toInt()
            canvas.drawLine(p1[0], p1[1], p2[0], p2[1], potez)
            potez.strokeCap = Paint.Cap.BUTT
        }

        val tekst = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER; typeface = Oblici.pismo }
        fun pisi(s: String, c: FloatArray, velicina: Float, boja: Int) {
            tekst.textSize = velicina; tekst.color = boja
            canvas.drawText(s, c[0], c[1] - (tekst.descent() + tekst.ascent()) / 2, tekst)
        }

        // --- brojevi kuca ---
        if (houses != null && !stil.zbijeno) for (i in 0 until 12) {
            val cusp = houses.cusps[i]
            val n = px(cusp + norm360(houses.cusps[(i + 1) % 12] - cusp) / 2, m.houseNum)
            krug(5.5f, n, if (stil.tamno) 0xFF000000.toInt() else stil.disk, true)
            pisi("${i + 1}", n, 8.5f, stil.muted)
        }

        // --- planete i tacke ---
        class Simbol(val key: String, val lon: Double, val retro: Boolean, val izvedena: Boolean)
        val simboli = sky.planets.map { Simbol(it.key, it.longitude, it.retrograde, false) } +
            (if (stil.zbijeno) emptyList() else sky.points.map { Simbol(it.key.key, it.longitude, it.retrograde, true) })
        val minSep = if (stil.zbijeno) m.minSep else if (simboli.size > 11) 8.5 else 9.5
        val uglovi = spreadAngles(simboli.map { chartAngle(it.lon, leva) }, minSep)
        simboli.forEachIndexed { i, s ->
            val pos = polar(m.planet, uglovi[i])
            val b = if (s.izvedena) stil.muted else stil.ink
            val glif = if (s.izvedena) m.glifIzv else m.glif
            val unutra = px(s.lon, m.zodiacIn - 7)
            linija(px(s.lon, m.zodiacIn), unutra, b, (if (s.izvedena) 0.9f else 1.2f) * m.debljina)
            linija(unutra, polar(m.planet + glif * 0.31f, uglovi[i]), stil.line, 0.7f * m.debljina)
            if (!s.izvedena) krug(m.tackaPlanete, px(s.lon, m.houseRing), b, true)
            crtajSimbol(canvas, s.key, pos[0], pos[1], glif, b, ispuna)
            if (s.retro) pisi("R", floatArrayOf(pos[0] + glif * 0.64f, pos[1] + glif * 0.45f), glif * 0.45f, stil.muted)
        }

        // --- ASC i MC van kruga ---
        if (houses != null && !stil.zbijeno) for ((natpis, lon) in listOf("ASC" to houses.ascendant, "MC" to houses.midheaven)) {
            linija(px(lon, m.outer), px(lon, m.outer + 7), stil.ugao, 1.5f)
            pisi(natpis, px(lon, m.outer + 17), 9.5f, stil.ugao)
        }
        canvas.restore()
    }

    /** Lista pored kruga (siri widget): dve kolone po pet — simbol, znak, stepen, "R". Bez reci. */
    fun crtajListu(canvas: Canvas, sky: Sky, x: Float, y: Float, sirina: Float, visina: Float, stil: Stil) {
        val red = visina / 5
        val v = min(red * 0.62f, sirina / 2 / 4.6f)
        val ispuna = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
        val tekst = Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface = Oblici.pismo }
        val kolone = listOf(
            listOf("sun", "moon", "mercury", "venus", "mars"),
            listOf("jupiter", "saturn", "uranus", "neptune", "pluto"),
        )
        kolone.forEachIndexed { k, kljucevi ->
            kljucevi.forEachIndexed { r, key ->
                val p = sky.planets.first { it.key == key }
                val pos = signFromLongitude(p.longitude)
                val cy = y + red * (r + 0.5f)
                var cx = x + k * sirina / 2 + v / 2
                crtajSimbol(canvas, key, cx, cy, v, stil.ink, ispuna)
                cx += v * 1.25f
                crtajZnak(canvas, pos.signIndex, cx, cy, v, ispuna)
                cx += v * 0.75f
                tekst.textSize = v * 0.87f; tekst.color = stil.ink
                val osnova = cy - (tekst.descent() + tekst.ascent()) / 2
                canvas.drawText("${pos.deg}°", cx, osnova, tekst)
                if (p.retrograde) {
                    val w = tekst.measureText("${pos.deg}°")
                    tekst.textSize = v * 0.62f; tekst.color = stil.muted
                    canvas.drawText("R", cx + w + v * 0.2f, osnova, tekst)
                }
            }
        }
    }

    private fun polar(radius: Float, angleDeg: Double): FloatArray {
        val a = Math.toRadians(angleDeg)
        return floatArrayOf((180 + radius * cos(a)).toFloat(), (180 - radius * sin(a)).toFloat())
    }

    /** Ikonica znaka: krug u boji elementa + beli znak, sa sredinom u (`cx`, `cy`). */
    fun crtajZnak(canvas: Canvas, index: Int, cx: Float, cy: Float, velicina: Float, ispuna: Paint) {
        val r = velicina / SIGN_VIEWBOX.toFloat()
        canvas.save()
        canvas.translate(cx - velicina / 2, cy - velicina / 2)
        canvas.scale(r, r)
        ispuna.color = SIGN_SHAPES[index].color.toInt()
        canvas.drawCircle(SIGN_CENTER.toFloat(), SIGN_CENTER.toFloat(), SIGN_CENTER.toFloat(), ispuna)
        ispuna.color = 0xFFFFFFFF.toInt()
        canvas.drawPath(Oblici.znaci[index], ispuna)
        canvas.restore()
    }

    /** Simbol planete kao SVG tekst u aplikaciji: sredina po sirini, osnovna linija 0,353 visine ispod sredine. */
    fun crtajSimbol(canvas: Canvas, key: String, cx: Float, cy: Float, velicina: Float, boja: Int, ispuna: Paint) {
        val oblik = Oblici.simboli[key] ?: return
        val mera = GLYPH_SHAPES[key] ?: return
        val r = velicina / GLYPH_EM.toFloat()
        canvas.save()
        canvas.translate(cx - mera.advance.toFloat() * r / 2, cy + velicina * 0.353f)
        canvas.scale(r, r)
        ispuna.color = boja
        canvas.drawPath(oblik, ispuna)
        canvas.restore()
    }
}
