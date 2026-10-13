package rs.astroshop.nebo.sat

import android.graphics.Paint
import android.os.Bundle
import android.text.format.DateFormat
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.rotary.onRotaryScrollEvent
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Text
import kotlinx.coroutines.delay
import rs.astroshop.nebo.core.Sky
import rs.astroshop.nebo.core.buildSky
import rs.astroshop.nebo.core.signFromLongitude
import rs.astroshop.nebo.crtez.Oblici
import rs.astroshop.nebo.crtez.SkyWheelCrtez
import rs.astroshop.nebo.crtez.Stil
import java.util.Date
import kotlin.math.min
import kotlin.math.roundToLong

/**
 * Wear OS aplikacija "Nebo sada": krug preko celog ekrana, a ispod njega (prevlacenje
 * nagore) lista planeta. KRUNA ILI OBOD POMERAJU VREME — jedan zarez je 15 minuta; dok
 * je vreme pomereno, pise koje je, a dodir na taj natpis vraca na sada. Bez reci.
 */
class NeboActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { NeboEkran() }
    }
}

private const val KORAK_MS = 15 * 60 * 1000L

@Composable
private fun NeboEkran() {
    val context = LocalContext.current
    var sada by remember { mutableLongStateOf(System.currentTimeMillis()) }
    // Pomeraj u cetvrtima sata; kruna daje sitne pomake, pa se sabiraju do celog zareza.
    var pomeraj by remember { mutableFloatStateOf(0f) }
    val koraka = pomeraj.roundToLong()
    LaunchedEffect(Unit) { while (true) { delay(60_000); sada = System.currentTimeMillis() } }

    val trenutak = sada + koraka * KORAK_MS
    val sky = remember(trenutak) { buildSky(trenutak, Mesto.procitaj(context)) }
    val fokus = remember { FocusRequester() }
    val strane = rememberPagerState { 2 }
    LaunchedEffect(Unit) { fokus.requestFocus() }

    VerticalPager(
        state = strane,
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .onRotaryScrollEvent { pomeraj += it.verticalScrollPixels / 48f; true }
            .focusRequester(fokus)
            .focusable(),
    ) { strana ->
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            Canvas(Modifier.fillMaxSize()) {
                drawIntoCanvas {
                    val c = it.nativeCanvas
                    val strana0 = min(size.width, size.height)
                    if (strana == 0) {
                        SkyWheelCrtez.crtaj(c, sky, (size.width - strana0) / 2, (size.height - strana0) / 2, strana0, Stil(tamno = true, zbijeno = true))
                    } else {
                        crtajKolonu(c, sky, size.width, size.height)
                    }
                }
            }
            if (strana == 0 && koraka != 0L) {
                Text(
                    text = "↩ " + DateFormat.format(DateFormat.getBestDateTimePattern(java.util.Locale.getDefault(), "dMMMHm"), Date(trenutak)),
                    fontSize = 11.sp,
                    color = Color(0xFFB39DDB),
                    modifier = Modifier
                        .padding(bottom = 14.dp)
                        .background(Color(0xCC000000), RoundedCornerShape(50))
                        .clickable { pomeraj = 0f }
                        .padding(horizontal = 8.dp, vertical = 2.dp),
                )
            }
        }
    }
}

/** Lista planeta: simbol, znak, stepen i minut, "R" — jedna kolona u sredini okruglog ekrana. */
private fun crtajKolonu(c: android.graphics.Canvas, sky: Sky, w: Float, h: Float) {
    val redosled = listOf("sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto")
    val red = h * 0.78f / redosled.size
    val v = red * 0.7f
    val ispuna = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    val tekst = Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface = Oblici.pismo; color = 0xFFFFFFFF.toInt() }
    val levo = w / 2 - v * 3.1f
    redosled.forEachIndexed { i, key ->
        val p = sky.planets.first { it.key == key }
        val pos = signFromLongitude(p.longitude)
        val cy = h * 0.11f + red * (i + 0.5f)
        SkyWheelCrtez.crtajSimbol(c, key, levo, cy, v, 0xFFFFFFFF.toInt(), ispuna)
        SkyWheelCrtez.crtajZnak(c, pos.signIndex, levo + v * 1.3f, cy, v, ispuna)
        tekst.textSize = v * 0.87f; tekst.color = 0xFFFFFFFF.toInt()
        val osnova = cy - (tekst.descent() + tekst.ascent()) / 2
        val s = "${pos.deg}° ${pos.min.toString().padStart(2, '0')}′"
        c.drawText(s, levo + v * 2.1f, osnova, tekst)
        if (p.retrograde) {
            val sirina = tekst.measureText(s)
            tekst.textSize = v * 0.62f; tekst.color = 0xFF9C9CA6.toInt()
            c.drawText("R", levo + v * 2.1f + sirina + v * 0.2f, osnova, tekst)
        }
    }
}
