package rs.astroshop.nebo.sat

import android.graphics.Paint
import android.text.format.DateFormat
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import rs.astroshop.nebo.core.MoonNow
import rs.astroshop.nebo.core.Planet
import rs.astroshop.nebo.core.PlanetaryHour
import rs.astroshop.nebo.core.RECNIK
import rs.astroshop.nebo.core.SatEvent
import rs.astroshop.nebo.core.Sky
import rs.astroshop.nebo.core.VoidOfCourse
import rs.astroshop.nebo.core.signFromLongitude
import rs.astroshop.nebo.crtez.SkyWheelCrtez
import java.util.Date
import java.util.Locale
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sqrt

/** Ono sto strane Mesec, Sat i Sledece prikazuju; racuna se van glavne niti (`NeboActivity`). */
class Slika(val ms: Double, val moon: MoonNow, val voc: VoidOfCourse, val hour: PlanetaryHour?, val events: List<SatEvent>)

val LILA = Color(0xFFB39DDB)
private val SIVA = Color(0xFF9C9CA6)
private val PLOCA = Color(0x1AFFFFFF)

/** Natpisi na jeziku sata; tabela je generisana iz recnika aplikacije (`skycore-recnik.ts`). */
object Tekst {
    private val jezik: String by lazy { Locale.getDefault().language.takeIf { RECNIK.containsKey(it) } ?: "en" }
    fun t(k: String) = RECNIK[jezik]?.get(k) ?: RECNIK["en"]?.get(k) ?: k
    fun sign(i: Int) = t("sign.$i")
    fun planet(p: Planet) = t("planet.${p.key}")

    /** Naslov dogadjaja bez padeza: "Mesec → Strelac", "Bez kursa", "Pun Mesec", "Pluton D". */
    fun title(e: SatEvent) = when (e.kind) {
        "moonSign" -> "${planet(Planet.MOON)} → ${sign(e.number)}"
        "voc" -> t("ui.voc")
        "phase" -> t("phase.${e.number * 2}")
        "ingress" -> "${planet(e.body!!)} → ${sign(e.number)}"
        else -> "${planet(e.body!!)} ${if (e.number == 1) "R" else "D"}"
    }

    /** Sat i minut za bliske dogadjaje, inace dan i mesec. */
    fun whenAt(ms: Double, now: Double): String {
        val obrazac = if (ms - now < 12 * 3_600_000) "Hm" else "dMMM"
        return DateFormat.format(DateFormat.getBestDateTimePattern(Locale.getDefault(), obrazac), Date(ms.toLong())).toString()
    }
}

@Composable
fun Simbol(key: String, velicina: Dp, boja: Color = Color.White) {
    Canvas(Modifier.size(velicina)) {
        drawIntoCanvas {
            SkyWheelCrtez.crtajSimbol(it.nativeCanvas, key, size.width / 2, size.height / 2, size.height,
                android.graphics.Color.argb((boja.alpha * 255).toInt(), (boja.red * 255).toInt(), (boja.green * 255).toInt(), (boja.blue * 255).toInt()),
                Paint(Paint.ANTI_ALIAS_FLAG))
        }
    }
}

@Composable
fun Znak(index: Int, velicina: Dp) {
    Canvas(Modifier.size(velicina)) {
        drawIntoCanvas { SkyWheelCrtez.crtajZnak(it.nativeCanvas, index, size.width / 2, size.height / 2, size.height, Paint(Paint.ANTI_ALIAS_FLAG)) }
    }
}

@Composable
private fun Naslov(tekst: String) = Text(tekst, color = LILA, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)

/** Redni broj slike Meseca 1—30 za ugao faze — isto pravilo kao `mesecSlika` u `src/lib/moon.ts`. */
fun mesecSlika(ugao: Double): Int {
    val a = ((ugao % 360) + 360) % 360
    var najbliza = 1
    var razlika = Double.MAX_VALUE
    for (i in 0 until 30) {
        val u = (i + 0.5) / 29.530588 * 360
        val d = minOf(kotlin.math.abs(a - u), 360 - kotlin.math.abs(a - u))
        if (d < razlika) { razlika = d; najbliza = i + 1 }
    }
    return najbliza
}

/** Mesec kakav je sada: jedna od 30 ilustracija iz aplikacije (`scripts/native/skycore-mesec.sh`). */
@Composable
fun MesecSlika(ugao: Double, modifier: Modifier = Modifier) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val id = context.resources.getIdentifier("mesec_%02d".format(mesecSlika(ugao)), "drawable", context.packageName)
    if (id != 0) androidx.compose.foundation.Image(androidx.compose.ui.res.painterResource(id), contentDescription = null, modifier = modifier)
}

/** Mesec u fazi: taman disk i osvetljeni deo (desno dok raste, levo dok opada). */
@Composable
private fun MesecCrtez(ugao: Double, velicina: Dp) {
    Canvas(Modifier.size(velicina)) {
        val r = size.minDimension / 2
        drawCircle(Color(0xFF1C1C22), r)
        val strana = if (ugao % 360 < 180) 1f else -1f
        val k = cos(Math.toRadians(ugao)).toFloat()
        val p = androidx.compose.ui.graphics.Path()
        val n = 48
        for (i in 0..n) {
            val y = -r + 2 * r * i / n
            val x = sqrt(r * r - y * y)
            if (i == 0) p.moveTo(center.x + strana * x, center.y + y) else p.lineTo(center.x + strana * x, center.y + y)
        }
        for (i in n downTo 0) {
            val y = -r + 2 * r * i / n
            p.lineTo(center.x + strana * k * sqrt(r * r - y * y), center.y + y)
        }
        p.close()
        drawPath(p, Color(0xFFF3F4FA))
    }
}

/** Strana 2 — Mesec: faza, znak sa trakom napretka, kad ulazi u sledeci, Mesec bez kursa. */
@Composable
fun StranaMesec(s: Slika) {
    Column(Modifier.fillMaxSize().padding(horizontal = 26.dp), verticalArrangement = Arrangement.Center) {
        Naslov(Tekst.planet(Planet.MOON))
        Row(verticalAlignment = Alignment.CenterVertically) {
            MesecSlika(s.moon.phaseAngle, Modifier.size(38.dp))
            Spacer(Modifier.width(8.dp))
            Column {
                Text(Tekst.t("phase.${s.moon.phase}"), color = SIVA, fontSize = 11.sp, maxLines = 1)
                Text("${(s.moon.illumination * 100).roundToInt()}%", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
            Znak(s.moon.sign, 18.dp)
            Spacer(Modifier.width(6.dp))
            Text("${Tekst.sign(s.moon.sign)} ${s.moon.degree.toInt()}°", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
        }
        Canvas(Modifier.fillMaxWidth().padding(vertical = 5.dp).height(5.dp)) {
            drawLine(Color(0xFF26262E), Offset(0f, size.height / 2), Offset(size.width, size.height / 2), size.height, StrokeCap.Round)
            drawLine(LILA, Offset(0f, size.height / 2), Offset(size.width * s.moon.progress.toFloat(), size.height / 2), size.height, StrokeCap.Round)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("→ ${Tekst.sign((s.moon.sign + 1) % 12)}", color = SIVA, fontSize = 12.sp, maxLines = 1)
            Text(Tekst.whenAt(s.moon.ingressAt, s.ms), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
        Row(
            Modifier.fillMaxWidth().padding(top = 5.dp)
                .background(if (s.voc.active) Color(0x8C403F98) else PLOCA, RoundedCornerShape(12.dp))
                .padding(horizontal = 10.dp, vertical = 5.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(Tekst.t("ui.voc"), color = LILA, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
            // Dok traje: do kada. Pre toga: od kada.
            Text(
                if (s.voc.active) "${Tekst.t("ui.until")} ${Tekst.whenAt(s.voc.end, s.ms)}" else Tekst.whenAt(s.voc.start, s.ms),
                fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1,
            )
        }
    }
}

/** Osvetljeni deo Meseca za ugao faze, u krugu poluprecnika `r` oko `c` (desno dok raste, levo dok opada). */
private fun mesecOsvetljen(c: Offset, r: Float, ugao: Double): androidx.compose.ui.graphics.Path {
    val strana = if (((ugao % 360) + 360) % 360 < 180) 1f else -1f
    val k = cos(Math.toRadians(ugao)).toFloat()
    val p = androidx.compose.ui.graphics.Path()
    val n = 24
    for (j in 0..n) {
        val y = -r + 2 * r * j / n
        val x = sqrt(maxOf(0f, r * r - y * y))
        if (j == 0) p.moveTo(c.x + strana * x, c.y + y) else p.lineTo(c.x + strana * x, c.y + y)
    }
    for (j in n downTo 0) {
        val y = -r + 2 * r * j / n
        p.lineTo(c.x + strana * k * sqrt(maxOf(0f, r * r - y * y)), c.y + y)
    }
    p.close()
    return p
}

/**
 * Krug Mesecevih mena, kao `MoonWheelView` u Swift-u: spoljni prsten sa BROJEVIMA lunarnih dana,
 * unutrasnji sa menama, tekuci dan istaknut, u sredini veliki Mesec i koji je lunarni dan.
 * TRIDESET polja, ne 28: od mladog do mladog Meseca prodje 29,5 dana, pa lunarni dan ide 1—30.
 */
@Composable
fun StranaLuna(s: Slika) {
    androidx.compose.foundation.layout.Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize().padding(4.dp)) {
            val n = 30
            val k = size.minDimension / 200f // crta se u krugu precnika 200
            val linija = Color(0x29FFFFFF)
            for (rr in listOf(99f, 82.5f, 63.5f)) drawCircle(linija, rr * k, center, style = Stroke(0.8.dp.toPx()))
            val slova = Paint(Paint.ANTI_ALIAS_FLAG).apply { textAlign = Paint.Align.CENTER; typeface = android.graphics.Typeface.DEFAULT_BOLD }
            for (i in 0 until n) {
                val ugao = (i.toDouble() / n) * 2 * Math.PI - Math.PI / 2
                val tekuci = i + 1 == s.moon.lunarDay
                val granica = ugao - Math.PI / n
                drawLine(linija,
                    Offset(center.x + 82.5f * k * cos(granica).toFloat(), center.y + 82.5f * k * kotlin.math.sin(granica).toFloat()),
                    Offset(center.x + 99f * k * cos(granica).toFloat(), center.y + 99f * k * kotlin.math.sin(granica).toFloat()), 0.8.dp.toPx())

                // Broj dana, okrenut tako da se cita duz kruga.
                drawIntoCanvas {
                    val c = it.nativeCanvas
                    c.save()
                    c.translate(center.x + 91f * k * cos(ugao).toFloat(), center.y + 91f * k * kotlin.math.sin(ugao).toFloat())
                    c.rotate(Math.toDegrees(ugao + Math.PI / 2).toFloat())
                    if (tekuci) {
                        slova.color = android.graphics.Color.WHITE
                        c.drawRoundRect(-8.5f * k, -6.5f * k, 8.5f * k, 6.5f * k, 3f * k, 3f * k, slova)
                    }
                    slova.textSize = (if (tekuci) 10.5f else 9f) * k
                    slova.color = if (tekuci) android.graphics.Color.BLACK else 0x8CFFFFFF.toInt()
                    c.drawText("${i + 1}", 0f, -(slova.descent() + slova.ascent()) / 2, slova)
                    c.restore()
                }

                val p = Offset(center.x + 73f * k * cos(ugao).toFloat(), center.y + 73f * k * kotlin.math.sin(ugao).toFloat())
                val rr = 5.6f * k * (if (tekuci) 1.25f else 1f)
                drawCircle(Color(0xFF2A2A32), rr, p)
                drawPath(mesecOsvetljen(p, rr, (i + 0.5) / 29.530588 * 360), if (tekuci) Color.White else Color(0xB8FFFFFF))
                if (tekuci) drawCircle(LILA, rr + 2f * k, p, style = Stroke(1.5.dp.toPx()))
            }
        }
        // U SREDINI kruga slika Meseca u trenutnoj fazi (ista ilustracija kao u aplikaciji), a preko nje lunarni dan.
        MesecSlika(s.moon.phaseAngle, Modifier.fillMaxSize(0.5f))
        val senka = androidx.compose.ui.graphics.Shadow(Color.Black, blurRadius = 10f)
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("${s.moon.lunarDay}", fontSize = 26.sp, fontWeight = FontWeight.Bold, style = androidx.compose.ui.text.TextStyle(shadow = senka))
            Text(Tekst.t("ui.lunarDay"), fontSize = 9.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, style = androidx.compose.ui.text.TextStyle(shadow = senka))
        }
    }
}

/** Planete: simbol, znak, stepen i minut, "R" — sve planete. */
@Composable
fun StranaPlanete(sky: Sky) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 30.dp, end = 22.dp, top = 30.dp, bottom = 36.dp),
        verticalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        Naslov(Tekst.t("ui.planets"))
        for (key in listOf("sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto")) {
            val p = sky.planets.first { it.key == key }
            val pos = p.position
            Row(verticalAlignment = Alignment.CenterVertically) {
                Simbol(key, 17.dp)
                Spacer(Modifier.width(6.dp))
                Znak(pos.signIndex, 17.dp)
                Text("  ${pos.deg}° ${pos.min.toString().padStart(2, '0')}′", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                if (p.retrograde) Text("  R", color = SIVA, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

/** Sat: vladar planetarnog sata, sledeci, ascendent i MC, izlazak i zalazak Sunca. */
@Composable
fun StranaSat(s: Slika, sky: Sky) {
    Column(Modifier.fillMaxSize().padding(horizontal = 26.dp), verticalArrangement = Arrangement.Center) {
        Naslov(Tekst.t("ui.hour"))
        val h = s.hour
        if (h != null) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                androidx.compose.foundation.layout.Box(Modifier.size(46.dp), contentAlignment = Alignment.Center) {
                    Canvas(Modifier.fillMaxSize().padding(3.dp)) {
                        drawArc(Color(0xFF26262E), 0f, 360f, false, style = Stroke(5.dp.toPx()))
                        drawArc(LILA, -90f, 360f * h.progress(s.ms).toFloat(), false, style = Stroke(5.dp.toPx(), cap = StrokeCap.Round))
                    }
                    Simbol(h.ruler.key, 22.dp)
                }
                Spacer(Modifier.width(8.dp))
                Column {
                    Text(Tekst.t("ui.planetaryHour"), color = SIVA, fontSize = 10.sp, maxLines = 1)
                    Text(Tekst.planet(h.ruler), fontSize = 18.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                    Text("${Tekst.t("ui.until")} ${Tekst.whenAt(h.end, s.ms)}", fontSize = 11.sp)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 3.dp)) {
                Text(Tekst.t("ui.then") + " ", color = SIVA, fontSize = 11.sp)
                Simbol(h.next.key, 13.dp)
                Text(" " + Tekst.planet(h.next), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
            }
        } else {
            Text(Tekst.t("ui.noSun"), color = SIVA, fontSize = 12.sp)
        }
        sky.houses?.let { houses ->
            Row(Modifier.fillMaxWidth().padding(top = 5.dp), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                for ((ime, lon) in listOf("ASC" to houses.ascendant, "MC" to houses.midheaven)) {
                    val p = signFromLongitude(lon)
                    Row(
                        Modifier.weight(1f).background(PLOCA, RoundedCornerShape(12.dp)).padding(vertical = 5.dp),
                        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("$ime ", color = LILA, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Znak(p.signIndex, 14.dp)
                        Text(" ${p.deg}°", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
        if (h != null) {
            Row(Modifier.fillMaxWidth().padding(top = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("↑ ${Tekst.whenAt(h.sunrise, h.sunrise)}", color = SIVA, fontSize = 11.sp)
                Text("↓ ${Tekst.whenAt(h.sunset, h.sunset)}", color = SIVA, fontSize = 11.sp)
            }
        }
    }
}

/** Strana 4 — Sledece: dogadjaji po vremenu, pa izbor mesta. */
@Composable
fun StranaSledece(s: Slika, grad: String, onMesto: () -> Unit) {
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 22.dp, end = 22.dp, top = 30.dp, bottom = 36.dp),
        verticalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        Naslov(Tekst.t("ui.next"))
        for (e in s.events) {
            Row(
                Modifier.fillMaxWidth().background(PLOCA, RoundedCornerShape(12.dp)).padding(horizontal = 9.dp, vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Simbol(e.body?.key ?: "moon", 16.dp)
                Text(" " + Tekst.title(e), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, modifier = Modifier.weight(1f))
                Text(Tekst.whenAt(e.at, s.ms), color = LILA, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
            }
        }
        Text(
            "⌖ $grad", color = LILA, fontSize = 13.sp,
            modifier = Modifier.padding(top = 6.dp).clickable { onMesto() }.padding(horizontal = 10.dp, vertical = 8.dp),
        )
    }
}
