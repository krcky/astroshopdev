package rs.astroshop.nebo.sat

import android.content.ComponentName
import android.graphics.Paint
import android.os.Bundle
import android.text.format.DateFormat
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
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
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.items
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.Text
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import rs.astroshop.nebo.core.Sky
import rs.astroshop.nebo.core.ZONE_PLACES
import rs.astroshop.nebo.core.buildSky
import rs.astroshop.nebo.core.moonNow
import rs.astroshop.nebo.core.planetaryHour
import rs.astroshop.nebo.core.upcomingEvents
import rs.astroshop.nebo.core.voidOfCourse
import rs.astroshop.nebo.core.signFromLongitude
import rs.astroshop.nebo.crtez.Oblici
import rs.astroshop.nebo.crtez.SkyWheelCrtez
import rs.astroshop.nebo.crtez.Stil
import java.util.Date
import kotlin.math.min
import kotlin.math.roundToLong

/**
 * Astrodial za Wear OS: cetiri strane, prevlacenjem nagore — krug, Mesec, Sat, Sledece
 * (`Strane.kt`). KRUNA ILI OBOD POMERAJU VREME — jedan zarez je 15 minuta; dok
 * je vreme pomereno, pise koje je, a dodir na taj natpis vraca na sada. Na dnu liste je izbor mesta.
 */
class NeboActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { Aplikacija() }
    }
}

private const val KORAK_MS = 15 * 60 * 1000L

/** Glavni ekran ili izbor mesta (`ekran`: null = nebo, "" = delovi sveta, inace gradovi tog dela). */
@Composable
private fun Aplikacija() {
    val context = LocalContext.current
    var ekran by remember { mutableStateOf<String?>(null) }
    // Raste kad se mesto promeni, da se nebo izracuna iznova.
    var verzija by remember { mutableIntStateOf(0) }
    BackHandler(enabled = ekran != null) { ekran = if (ekran == "") null else "" }

    when (val e = ekran) {
        null -> NeboEkran(verzija, onMesto = { ekran = "" })
        else -> IzborMesta(e, onDeo = { ekran = it }, onIzbor = { zona ->
            Mesto.izaberi(context, zona)
            // Plocica i komplikacija crtaju isto mesto.
            TileService.getUpdater(context).requestUpdate(NeboPlocica::class.java)
            ComplicationDataSourceUpdateRequester.create(context, ComponentName(context, NeboKomplikacija::class.java)).requestUpdateAll()
            verzija++
            ekran = null
        })
    }
}

/** Izbor mesta: "prati sat" (grad vremenske zone sata) ili grad sa spiska, po delovima sveta. */
@Composable
private fun IzborMesta(deo: String, onDeo: (String) -> Unit, onIzbor: (String?) -> Unit) {
    val context = LocalContext.current
    val izabrana = Mesto.izabrana(context)
    ScalingLazyColumn(Modifier.fillMaxSize().background(Color.Black)) {
        if (deo == "") {
            item {
                Chip(
                    onClick = { onIzbor(null) },
                    label = { Text((if (izabrana == null) "✓ " else "") + Tekst.t("ui.followWatch")) },
                    secondaryLabel = { Text(Mesto.gradSata()?.ime ?: "—") },
                    colors = ChipDefaults.secondaryChipColors(),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            items(ZONE_PLACES.map { it.deoSveta }.distinct().sorted()) { ime ->
                Chip(onClick = { onDeo(ime) }, label = { Text(Tekst.t("region.$ime")) }, colors = ChipDefaults.secondaryChipColors(), modifier = Modifier.fillMaxWidth())
            }
        } else {
            items(ZONE_PLACES.filter { it.deoSveta == deo }.sortedBy { it.ime }) { grad ->
                Chip(
                    onClick = { onIzbor(grad.id) },
                    label = { Text((if (izabrana == grad.id) "✓ " else "") + grad.ime) },
                    colors = ChipDefaults.secondaryChipColors(),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun NeboEkran(verzija: Int, onMesto: () -> Unit) {
    val context = LocalContext.current
    var sada by remember { mutableLongStateOf(System.currentTimeMillis()) }
    // Pomeraj u cetvrtima sata; kruna daje sitne pomake, pa se sabiraju do celog zareza.
    var pomeraj by remember { mutableFloatStateOf(0f) }
    val koraka = pomeraj.roundToLong()
    LaunchedEffect(Unit) { while (true) { delay(60_000); sada = System.currentTimeMillis() } }

    val trenutak = sada + koraka * KORAK_MS
    val sky = remember(trenutak, verzija) { buildSky(trenutak, Mesto.procitaj(context)) }
    val fokus = remember { FocusRequester() }
    val strane = rememberPagerState { 4 }
    // Strane Mesec, Sat i Sledece: racun traje (Mesec bez kursa, dogadjaji za 30 dana), pa ide van glavne niti,
    // za tekuci trenutak, najvise jednom u minutu.
    var slika by remember { mutableStateOf<Slika?>(null) }
    LaunchedEffect(sada, verzija) {
        val ms = sada.toDouble()
        val mesto = Mesto.procitaj(context)
        slika = withContext(Dispatchers.Default) {
            val moon = moonNow(ms)
            Slika(ms, moon, voidOfCourse(ms, moon), mesto?.let { planetaryHour(ms, it) }, upcomingEvents(ms))
        }
    }
    LaunchedEffect(Unit) { fokus.requestFocus() }

    VerticalPager(
        state = strane,
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            // Kruna pomera vreme samo na prvoj strani; na ostalima lista strane i sadrzaj.
            .onRotaryScrollEvent { if (strane.currentPage == 0) { pomeraj += it.verticalScrollPixels / 48f; true } else false }
            .focusRequester(fokus)
            .focusable(),
    ) { strana ->
        val s = slika
        when {
            strana == 0 -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
                Canvas(Modifier.fillMaxSize()) {
                    drawIntoCanvas {
                        val strana0 = min(size.width, size.height)
                        SkyWheelCrtez.crtaj(it.nativeCanvas, sky, (size.width - strana0) / 2, (size.height - strana0) / 2, strana0, Stil(tamno = true, zbijeno = true))
                    }
                }
                if (koraka != 0L) {
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
            s == null -> Box(Modifier.fillMaxSize())
            strana == 1 -> StranaMesec(s)
            strana == 2 -> StranaSat(s, sky)
            else -> StranaSledece(s, Mesto.grad(context)?.ime ?: "—", onMesto)
        }
    }
}
