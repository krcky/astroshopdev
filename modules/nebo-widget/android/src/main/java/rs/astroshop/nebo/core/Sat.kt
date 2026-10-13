/*
 * PREPIS `src/lib/sat.ts` — racun za Astrodial (sat): Mesec u znaku, Mesec bez kursa,
 * planetarni sat i naredni dogadjaji. Menja se TAMO, pa ovde i u Swift-u (`Sat.swift`);
 * `SkyCoreTest` poredi sa `golden.json`. Trazenje trenutka je ista bisekcija, korak po korak,
 * kao u TS-u — ne funkcije biblioteke. Vremena su u milisekundama od 1970 (Double), kao u TS-u.
 */
package rs.astroshop.nebo.core

import io.github.cosinekitty.astronomy.Aberration
import io.github.cosinekitty.astronomy.Body
import io.github.cosinekitty.astronomy.Direction
import io.github.cosinekitty.astronomy.Observer
import io.github.cosinekitty.astronomy.Time
import io.github.cosinekitty.astronomy.geoVector
import io.github.cosinekitty.astronomy.moonPhase
import io.github.cosinekitty.astronomy.rotationEqjEct
import io.github.cosinekitty.astronomy.searchRiseSet
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.min

private const val SAT_MS = 3_600_000.0
private const val DAN_MS = 86_400_000.0

private fun vreme(ms: Double) = Time((ms / 1000 - 946_728_000.0) / 86400.0)

private fun lon(p: Planet, ms: Double): Double {
    val t = vreme(ms)
    return norm360(rotationEqjEct(t).rotate(geoVector(p.body, t, Aberration.Corrected)).toSpherical().lon)
}

private fun znak(p: Planet, ms: Double) = floor(lon(p, ms) / 30).toInt()

private inline fun bisekcija(lo0: Double, hi0: Double, tacnost: Double = 500.0, uslov: (Double) -> Boolean): Double {
    var lo = lo0
    var hi = hi0
    while (hi - lo > tacnost) {
        val mid = (lo + hi) / 2
        if (uslov(mid)) hi = mid else lo = mid
    }
    return hi
}

private fun sledeciUlazak(p: Planet, ms: Double, korak: Double, dana: Double): Pair<Double, Int>? {
    val z0 = znak(p, ms)
    var t = ms
    while (t < ms + dana * DAN_MS) {
        if (znak(p, t + korak) != z0) {
            val at = bisekcija(t, t + korak) { znak(p, it) != z0 }
            return at to znak(p, at)
        }
        t += korak
    }
    return null
}

class MoonNow(
    /** 0 = Ovan … 11 = Ribe. */
    val sign: Int,
    /** Stepen u znaku, 0—30. */
    val degree: Double,
    /** Kad je usao u ovaj znak i kad ulazi u sledeci (ms). */
    val enteredAt: Double,
    val ingressAt: Double,
    /** Koliko je znaka presao, po vremenu (0—1). */
    val progress: Double,
    val phaseAngle: Double,
    /** Osvetljeni deo, 0—1. */
    val illumination: Double,
    /** Indeks faze 0—7 (0 = mlad Mesec). */
    val phase: Int,
)

fun moonNow(ms: Double): MoonNow {
    val l = lon(Planet.MOON, ms)
    val sign = floor(l / 30).toInt()
    var t = ms
    while (znak(Planet.MOON, t - SAT_MS) == sign) t -= SAT_MS
    val usao = bisekcija(t - SAT_MS, t) { znak(Planet.MOON, it) == sign }
    val izlazi = sledeciUlazak(Planet.MOON, ms, SAT_MS, 4.0)!!.first
    val faza = moonPhase(vreme(ms))
    return MoonNow(
        sign, l - sign * 30, usao, izlazi, (ms - usao) / (izlazi - usao), faza,
        (1 - cos(faza * Math.PI / 180)) / 2, floor(norm360(faza + 22.5) / 45).toInt(),
    )
}

class VoidOfCourse(val start: Double, val end: Double, val active: Boolean)

private val ASPEKT_UGLOVI = doubleArrayOf(0.0, 60.0, 90.0, 120.0, 180.0, 240.0, 270.0, 300.0)

/** Mesec bez kursa: od poslednjeg tacnog glavnog aspekta u tekucem znaku do ulaska u sledeci. */
fun voidOfCourse(ms: Double, moon: MoonNow = moonNow(ms)): VoidOfCourse {
    val korak = SAT_MS / 2
    var poslednji = moon.enteredAt
    for (p in Planet.entries) {
        if (p == Planet.MOON) continue
        fun rast(t: Double) = norm360(lon(Planet.MOON, t) - lon(p, t))
        var t = moon.enteredAt
        while (t < moon.ingressAt) {
            val kraj = min(t + korak, moon.ingressAt)
            val a = rast(t)
            val b = rast(kraj)
            for (cilj in ASPEKT_UGLOVI) {
                val da = angleDelta(a, cilj)
                val db = angleDelta(b, cilj)
                if (da < 0 && db >= 0 && db - da < 90) {
                    val at = bisekcija(t, kraj) { angleDelta(rast(it), cilj) >= 0 }
                    if (at > poslednji) poslednji = at
                }
            }
            t += korak
        }
    }
    return VoidOfCourse(poslednji, moon.ingressAt, ms >= poslednji)
}

private val HALDEJSKI = listOf(Planet.SATURN, Planet.JUPITER, Planet.MARS, Planet.SUN, Planet.VENUS, Planet.MERCURY, Planet.MOON)
private val VLADAR_DANA = listOf(Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN)

class PlanetaryHour(
    val ruler: Planet,
    val next: Planet,
    val start: Double,
    val end: Double,
    /** 0—23 (0—11 dan, 12—23 noc). */
    val index: Int,
    val day: Boolean,
    val sunrise: Double,
    val sunset: Double,
) {
    /** Koliko je sata proslo (0—1). */
    fun progress(ms: Double) = ((ms - start) / (end - start)).coerceIn(0.0, 1.0)
}

private fun suncevDogadjaj(smer: Direction, odMs: Double, place: Place): Double? {
    val t = searchRiseSet(Body.Sun, Observer(place.latitude, place.longitude, 0.0), smer, vreme(odMs), 2.0) ?: return null
    return (t.ut * 86400 + 946_728_000.0) * 1000
}

/** Planetarni sat nad mestom; `null` gde Sunce tog dana ne izlazi ili ne zalazi. */
fun planetaryHour(ms: Double, place: Place): PlanetaryHour? {
    var izlazak = suncevDogadjaj(Direction.Rise, ms - 1.5 * DAN_MS, place) ?: return null
    if (izlazak > ms) return null
    while (true) {
        val sledeci = suncevDogadjaj(Direction.Rise, izlazak + 60_000, place) ?: return null
        if (sledeci > ms) break
        izlazak = sledeci
    }
    val zalazak = suncevDogadjaj(Direction.Set, izlazak, place) ?: return null
    val sutra = suncevDogadjaj(Direction.Rise, izlazak + 60_000, place) ?: return null
    if (zalazak > sutra) return null

    val day = ms < zalazak
    val pocetak = if (day) izlazak else zalazak
    val duzina = (if (day) zalazak - izlazak else sutra - zalazak) / 12
    val uDelu = min(11, floor((ms - pocetak) / duzina).toInt())
    val index = (if (day) 0 else 12) + uDelu
    // Dan u nedelji po MESNOM vremenu izlaska (duzina / 15 sati); 1.1.1970. je cetvrtak.
    val dana = floor((izlazak + place.longitude * 240_000) / DAN_MS).toLong()
    val dan = (((dana + 4) % 7 + 7) % 7).toInt()
    val prvi = HALDEJSKI.indexOf(VLADAR_DANA[dan])
    return PlanetaryHour(
        HALDEJSKI[(prvi + index) % 7], HALDEJSKI[(prvi + index + 1) % 7],
        pocetak + uDelu * duzina, pocetak + (uDelu + 1) * duzina, index, day, izlazak, zalazak,
    )
}

/**
 * Dogadjaj na nebu. `kind`: "moonSign" (`number` = znak), "voc", "phase" (`number` = cetvrt: 0 mlad,
 * 1 prva, 2 pun, 3 poslednja), "ingress" (`body`, `number` = znak), "station" (`body`, `number` = 1 retrogradna, 0 direktna).
 */
class SatEvent(val kind: String, val at: Double, val body: Planet? = null, val number: Int = 0)

private fun brzina(p: Planet, ms: Double) = angleDelta(lon(p, ms + DAN_MS / 2), lon(p, ms)) / 0.5

/** Naredni dogadjaji po vremenu: Mesec (znak, bez kursa, cetvrti) i planete (ulazak u znak, stanica). */
fun upcomingEvents(ms: Double, dana: Double = 30.0): List<SatEvent> {
    val out = ArrayList<SatEvent>()
    val moon = moonNow(ms)
    out.add(SatEvent("moonSign", moon.ingressAt, number = (moon.sign + 1) % 12))
    val voc = voidOfCourse(ms, moon)
    if (voc.start > ms) out.add(SatEvent("voc", voc.start))

    fun faza(t: Double) = moonPhase(vreme(t))
    val korakFaze = 6 * SAT_MS
    var t = ms
    while (t < ms + dana * DAN_MS) {
        val q0 = floor(faza(t) / 90).toInt()
        if (floor(faza(t + korakFaze) / 90).toInt() != q0) {
            val at = bisekcija(t, t + korakFaze) { floor(faza(it) / 90).toInt() != q0 }
            out.add(SatEvent("phase", at, number = (q0 + 1) % 4))
        }
        t += korakFaze
    }

    for (p in Planet.entries) {
        if (p == Planet.MOON) continue
        sledeciUlazak(p, ms, DAN_MS, dana)?.let { out.add(SatEvent("ingress", it.first, p, it.second)) }
        if (p == Planet.SUN) continue
        var d = ms
        while (d < ms + dana * DAN_MS) {
            val r0 = brzina(p, d) < 0
            if ((brzina(p, d + DAN_MS) < 0) != r0) {
                val at = bisekcija(d, d + DAN_MS, 30_000.0) { (brzina(p, it) < 0) != r0 }
                out.add(SatEvent("station", at, p, if (!r0) 1 else 0))
                break
            }
            d += DAN_MS
        }
    }
    return out.sortedBy { it.at } // stabilno, kao u JS-u
}
