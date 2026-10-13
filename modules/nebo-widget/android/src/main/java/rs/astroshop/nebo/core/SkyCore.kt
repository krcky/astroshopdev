/*
 * SkyCore za Android — PREPIS `src/lib/astro.ts`, `natal.ts`, `points.ts`, `sky.ts` i
 * geometrije iz `wheel.ts` (pravilo 27 u CLAUDE.md). Ista biblioteka (astronomy-engine,
 * Kotlin izvor ISTE verzije kao npm paket), isti redosled tela, isti orbisi.
 * Izvor istine je `src/lib`: menja se tamo, pa ovde i u `native/SkyCore` (Swift).
 * Proverava ga isti `golden.json` kao Swift (`SkyCoreTest`).
 *
 * BEZ Android uvoza — da se racun testira na obicnom JVM-u i da ga deli Wear OS.
 * Sve longitude su u ECT (prava ekliptika datuma), nikad J2000 (pravilo 1).
 */
package rs.astroshop.nebo.core

import io.github.cosinekitty.astronomy.Aberration
import io.github.cosinekitty.astronomy.Body
import io.github.cosinekitty.astronomy.Time
import io.github.cosinekitty.astronomy.Vector
import io.github.cosinekitty.astronomy.geoMoon
import io.github.cosinekitty.astronomy.geoVector
import io.github.cosinekitty.astronomy.moonPhase
import io.github.cosinekitty.astronomy.rotationEqdEct
import io.github.cosinekitty.astronomy.rotationEqjEct
import io.github.cosinekitty.astronomy.siderealTime
import kotlin.math.abs
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.tan

private const val DEG = Math.PI / 180
private const val RAD = 180 / Math.PI

fun norm360(deg: Double): Double {
    val m = deg % 360
    return if (m < 0) m + 360 else m
}

/** Razlika dva ugla svedena na (-180, 180]. */
fun angleDelta(a: Double, b: Double): Double {
    var d = a - b
    while (d > 180) d -= 360
    while (d <= -180) d += 360
    return d
}

private fun vreme(millis: Long): Time = Time.fromMillisecondsSince1970(millis)

/** Redosled je ISTI kao `BODIES` u `astro.ts` — od njega zavisi redosled aspekata. */
enum class Planet(val key: String, internal val body: Body, val weight: Double) {
    MOON("moon", Body.Moon, 1.0),
    SUN("sun", Body.Sun, 1.0),
    MERCURY("mercury", Body.Mercury, 0.8),
    VENUS("venus", Body.Venus, 0.8),
    MARS("mars", Body.Mars, 0.8),
    JUPITER("jupiter", Body.Jupiter, 0.6),
    SATURN("saturn", Body.Saturn, 0.6),
    URANUS("uranus", Body.Uranus, 0.4),
    NEPTUNE("neptune", Body.Neptune, 0.4),
    PLUTO("pluto", Body.Pluto, 0.4),
}

private fun eclipticLongitude(body: Body, time: Time): Double {
    val eqj = geoVector(body, time, Aberration.Corrected)
    val ect = rotationEqjEct(time).rotate(eqj)
    return norm360(ect.toSpherical().lon)
}

val SIGN_KEYS = listOf(
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
)

/** Znak (0 = Ovan), ceo stepen i lucni minut — minuti ODSECENI, kao u aplikaciji. */
data class SignPosition(val signIndex: Int, val deg: Int, val min: Int)

fun signFromLongitude(longitude: Double): SignPosition {
    val lon = norm360(longitude)
    val totalSec = floor(lon * 3600 + 1e-6).toLong() % (360 * 3600)
    val totalMin = (totalSec / 60).toInt()
    val index = totalMin / 1800
    val within = totalMin - index * 1800
    return SignPosition(index, within / 60, within % 60)
}

data class PlanetPosition(val planet: Planet, val longitude: Double, /** Stepeni po danu. */ val speed: Double) {
    val retrograde get() = speed < 0
    val position get() = signFromLongitude(longitude)
    val key get() = planet.key
}

fun planetPositions(millis: Long): List<PlanetPosition> {
    val t0 = vreme(millis)
    val dt = 0.5
    val t1 = t0.addDays(dt)
    return Planet.entries.map { p ->
        val l0 = eclipticLongitude(p.body, t0)
        val l1 = eclipticLongitude(p.body, t1)
        PlanetPosition(p, l0, angleDelta(l1, l0) / dt)
    }
}

enum class AspectKind(val key: String, val angle: Double, val orb: Double) {
    CONJUNCTION("conjunction", 0.0, 8.0),
    SEXTILE("sextile", 60.0, 4.0),
    SQUARE("square", 90.0, 6.0),
    TRINE("trine", 120.0, 6.0),
    OPPOSITION("opposition", 180.0, 8.0),
}

data class Aspect(val a: PlanetPosition, val b: PlanetPosition, val kind: AspectKind, val orb: Double, val score: Double) {
    val contentKey get() = "${a.key}.${kind.key}.${b.key}"
}

fun findAspects(positions: List<PlanetPosition>): List<Aspect> {
    val out = ArrayList<Aspect>()
    for (i in positions.indices) for (j in i + 1 until positions.size) {
        val a = positions[i]
        val b = positions[j]
        val separation = abs(angleDelta(a.longitude, b.longitude))
        for (kind in AspectKind.entries) {
            val orb = abs(separation - kind.angle)
            if (orb > kind.orb) continue
            out.add(Aspect(a, b, kind, orb, (1 - orb / kind.orb) * ((a.planet.weight + b.planet.weight) / 2)))
            break
        }
    }
    return out.sortedByDescending { it.score } // stabilno, kao u JS-u
}

fun moonPhaseAngle(millis: Long): Double = moonPhase(vreme(millis))

/* ---------------------------------- kuce (natal.ts) ---------------------------------- */

private fun sind(d: Double) = sin(d * DEG)
private fun cosd(d: Double) = cos(d * DEG)
private fun tand(d: Double) = tan(d * DEG)
private fun asind(x: Double) = asin(max(-1.0, min(1.0, x))) * RAD
private fun atan2d(y: Double, x: Double) = atan2(y, x) * RAD

/**
 * Prava nagnutost ekliptike. `earthTilt` u biblioteci nije javna, pa se ugao cita iz
 * matrice EQD -> ECT, koja je rotacija oko x-ose bas za taj ugao.
 */
fun obliquity(millis: Long): Double {
    val r = rotationEqdEct(vreme(millis)).rot
    return atan2(-r[1][2], r[1][1]) * RAD
}

fun rightAscensionMC(millis: Long, longitude: Double): Double =
    norm360((siderealTime(vreme(millis)) + longitude / 15) * 15)

private fun eclipticFromRA(ra: Double, eps: Double) = norm360(atan2d(sind(ra), cosd(ra) * cosd(eps)))

fun midheaven(ramc: Double, eps: Double) = eclipticFromRA(ramc, eps)

fun ascendant(ramc: Double, latitude: Double, eps: Double) =
    norm360(atan2d(cosd(ramc), -(sind(ramc) * cosd(eps) + tand(latitude) * sind(eps))))

/** Placidus medjukuspide (11, 12, 2, 3) — iterativno. `null` kad tacka nikad ne izlazi. */
private fun placidusIntermediate(ramc: Double, latitude: Double, eps: Double, house: Int): Double? {
    val above = house == 11 || house == 12
    val n = if (house == 11 || house == 3) 1.0 else 2.0
    var ra = ramc + (if (above) n * 30 else 180 - n * 30)
    for (i in 0 until 100) {
        val lambda = eclipticFromRA(ra, eps)
        val decl = asind(sind(eps) * sind(lambda))
        val t = tand(latitude) * tand(decl)
        if (abs(t) > 1) return null
        val ad = asind(t)
        val next = if (above) ramc + (n / 3) * (90 + ad) else ramc + 180 - (n / 3) * (90 - ad)
        if (abs(next - ra) < 1e-10) { ra = next; break }
        ra = next
    }
    return eclipticFromRA(ra, eps)
}

data class Houses(
    /** 12 kuspida, indeks 0 = 1. kuca. */
    val cusps: List<Double>,
    val ascendant: Double,
    val midheaven: Double,
    /** Placidus nije bio moguc (polarna sirina) — kuce su Whole Sign. */
    val fellBack: Boolean,
) {
    fun houseOf(longitude: Double): Int {
        val lon = norm360(longitude)
        for (i in 0 until 12) {
            val start = cusps[i]
            if (norm360(lon - start) < norm360(cusps[(i + 1) % 12] - start)) return i + 1
        }
        return 1
    }
}

fun computeHouses(millis: Long, latitude: Double, longitude: Double): Houses {
    val eps = obliquity(millis)
    val ramc = rightAscensionMC(millis, longitude)
    val asc = ascendant(ramc, latitude, eps)
    val mc = midheaven(ramc, eps)
    val c11 = placidusIntermediate(ramc, latitude, eps, 11)
    val c12 = placidusIntermediate(ramc, latitude, eps, 12)
    val c2 = placidusIntermediate(ramc, latitude, eps, 2)
    val c3 = placidusIntermediate(ramc, latitude, eps, 3)
    if (c11 == null || c12 == null || c2 == null || c3 == null) {
        val start = floor(asc / 30) * 30
        return Houses(List(12) { norm360(start + it * 30) }, asc, mc, true)
    }
    return Houses(
        listOf(asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180),
            norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12),
        asc, mc, false,
    )
}

/* ---------------------------------- tacke (points.ts) ---------------------------------- */

/** PRAVI cvor: iz vektora ugaonog momenta Meseca, koji se tek ON rotira u ekliptiku datuma. */
fun trueNodeLongitude(millis: Long): Double {
    val t = vreme(millis)
    val h = 0.001
    val p = geoMoon(t)
    val pre = geoMoon(t.addDays(-h))
    val posle = geoMoon(t.addDays(h))
    val vx = (posle.x - pre.x) / (2 * h)
    val vy = (posle.y - pre.y) / (2 * h)
    val vz = (posle.z - pre.z) / (2 * h)
    val moment = Vector(p.y * vz - p.z * vy, p.z * vx - p.x * vz, p.x * vy - p.y * vx, t)
    val ect = rotationEqjEct(t).rotate(moment)
    return norm360(atan2(ect.x, -ect.y) * RAD)
}

/** Brzina cvora, stepeni po danu. "R" se RACUNA — pravi cvor povremeno ide napred. */
fun nodeSpeed(millis: Long): Double {
    val dt = 0.5
    val pola = (dt / 2 * 86_400_000).toLong()
    return angleDelta(trueNodeLongitude(millis + pola), trueNodeLongitude(millis - pola)) / dt
}

/** Lilit: SREDNJI apogej (Meeus, pogl. 47). */
fun meanLilithLongitude(millis: Long): Double {
    val t = vreme(millis).tt / 36525
    val perigej = 83.3532465 + 4069.0137287 * t - 0.0103200 * t * t - (t * t * t) / 80053 + (t * t * t * t) / 18999000
    return norm360(perigej + 180)
}

fun partOfFortuneLongitude(ascendant: Double, sun: Double, moon: Double, dayChart: Boolean) =
    if (dayChart) norm360(ascendant + moon - sun) else norm360(ascendant + sun - moon)

enum class PointKey(val key: String) { NORTH_NODE("northNode"), LILITH("lilith"), FORTUNE("fortune") }

data class SkyPoint(val key: PointKey, val longitude: Double, val retrograde: Boolean)

/* ---------------------------------- nebo (sky.ts) ---------------------------------- */

data class Place(val latitude: Double, val longitude: Double)

data class Sky(
    val millis: Long,
    val planets: List<PlanetPosition>,
    /** `null` kad mesto nije poznato: nema kuca, ASC ni MC, levo je 0° Ovna. */
    val houses: Houses?,
    /** Cvor i Lilit uvek; Tacka srece samo uz mesto. */
    val points: List<SkyPoint>,
    val aspects: List<Aspect>,
) {
    fun planet(p: Planet) = planets.first { it.planet == p }
}

fun buildSky(millis: Long, place: Place?): Sky {
    val planets = planetPositions(millis)
    val houses = place?.let { computeHouses(millis, it.latitude, it.longitude) }
    val points = arrayListOf(
        SkyPoint(PointKey.NORTH_NODE, trueNodeLongitude(millis), nodeSpeed(millis) < 0),
        SkyPoint(PointKey.LILITH, meanLilithLongitude(millis), false),
    )
    if (houses != null) {
        val sun = planets.first { it.planet == Planet.SUN }
        val moon = planets.first { it.planet == Planet.MOON }
        val day = houses.houseOf(sun.longitude) >= 7 // Sunce iznad horizonta
        points.add(SkyPoint(PointKey.FORTUNE, partOfFortuneLongitude(houses.ascendant, sun.longitude, moon.longitude, day), false))
    }
    return Sky(millis, planets, houses, points, findAspects(planets))
}

/* ---------------------------------- geometrija (wheel.ts) ---------------------------------- */

/** Longituda -> ugao na ekranu: `leva` stoji na 9 sati, longituda raste suprotno od kazaljke. */
fun chartAngle(longitude: Double, leva: Double) = 180 + (longitude - leva)

fun oseKarte(ascendant: Double, midheaven: Double) =
    listOf(norm360(ascendant), norm360(midheaven + 180), norm360(ascendant + 180), norm360(midheaven))

fun naOsi(longitude: Double, ose: List<Double>) = ose.any { abs(((longitude - it + 540) % 360) - 180) < 1e-6 }

/** Razmice uglove blize od `minSep`, da se simboli ne preklope. Isti algoritam kao u `wheel.ts`. */
fun spreadAngles(angles: List<Double>, minSep: Double): List<Double> {
    val n = angles.size
    if (n < 2) return angles
    val idx = angles.indices.sortedBy { norm360(angles[it]) }
    val out = DoubleArray(n)
    if (n * minSep >= 360) {
        idx.forEachIndexed { k, orig -> out[orig] = norm360(angles[idx[0]]) + k * (360.0 / n) }
        return out.toList()
    }
    val sorted = idx.map { norm360(angles[it]) }
    var cut = 0
    var widest = -1.0
    for (k in 0 until n) {
        val gap = norm360(sorted[(k + 1) % n] - sorted[k])
        if (gap > widest) { widest = gap; cut = (k + 1) % n }
    }
    val seq = DoubleArray(n)
    for (k in 0 until n) {
        var x = sorted[(cut + k) % n]
        if (k > 0) while (x < seq[k - 1]) x += 360
        seq[k] = x
    }
    val before = seq.sum()
    repeat(50) {
        for (k in 1 until n) if (seq[k] - seq[k - 1] < minSep) seq[k] = seq[k - 1] + minSep
        for (k in n - 2 downTo 0) if (seq[k + 1] - seq[k] < minSep) seq[k] = seq[k + 1] - minSep
    }
    val shift = (before - seq.sum()) / n
    for (k in 0 until n) out[idx[(cut + k) % n]] = seq[k] + shift
    return out.toList()
}
