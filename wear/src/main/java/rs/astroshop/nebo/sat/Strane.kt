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
            MesecCrtez(s.moon.phaseAngle, 36.dp)
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

/** Strana 3 — Sat: vladar planetarnog sata, sledeci, ascendent i MC, izlazak i zalazak Sunca. */
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
