package rs.astroshop.nebo.core

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import kotlin.math.abs

/** Kotlin racun protiv racuna aplikacije — isti `golden.json` kao Swift test (pravilo 27). */
class SkyCoreTest {
    private val tol = 1e-6
    private var najvece = 0.0

    private fun ugao(a: Double, b: Double, sta: String) {
        val d = abs(angleDelta(a, b))
        najvece = maxOf(najvece, d)
        assertTrue("$sta: $a umesto $b", d < tol)
    }

    @Test
    fun protivAplikacije() {
        val slucajevi = JSONObject(File(System.getProperty("golden")!!).readText()).getJSONArray("slucajevi")
        assertTrue(slucajevi.length() > 40)
        for (n in 0 until slucajevi.length()) {
            val s = slucajevi.getJSONObject(n)
            val millis = Math.round(s.getDouble("unix") * 1000)
            val gde = "${s.getString("mesto")} $millis"
            val sky = buildSky(millis, Place(s.getDouble("lat"), s.getDouble("lon")))
            val houses = sky.houses!!

            val planete = s.getJSONArray("planete")
            assertEquals(planete.length(), sky.planets.size)
            for (i in 0 until planete.length()) {
                val g = planete.getJSONObject(i)
                val p = sky.planets[i]
                assertEquals("redosled tela, $gde", g.getString("key"), p.key)
                ugao(p.longitude, g.getDouble("lon"), "${p.key} longituda, $gde")
                assertEquals("${p.key} brzina, $gde", g.getDouble("brzina"), p.speed, 1e-5)
                assertEquals("${p.key} kuca, $gde", g.getInt("kuca"), houses.houseOf(p.longitude))
                assertEquals("${p.key} znak, $gde", g.getString("znak"), SIGN_KEYS[p.position.signIndex])
                assertEquals("${p.key} stepen, $gde", g.getInt("deg"), p.position.deg)
                assertEquals("${p.key} minut, $gde", g.getInt("min"), p.position.min)
            }

            assertEquals("nagnutost, $gde", s.getDouble("obliquity"), obliquity(millis), 1e-8)
            ugao(rightAscensionMC(millis, s.getDouble("lon")), s.getDouble("ramc"), "RAMC, $gde")
            ugao(houses.ascendant, s.getDouble("asc"), "ASC, $gde")
            ugao(houses.midheaven, s.getDouble("mc"), "MC, $gde")
            assertEquals("Whole Sign rezerva, $gde", s.getBoolean("fellBack"), houses.fellBack)
            val kuspide = s.getJSONArray("kuspide")
            for (i in 0 until 12) ugao(houses.cusps[i], kuspide.getDouble(i), "kuspida ${i + 1}, $gde")

            ugao(trueNodeLongitude(millis), s.getDouble("cvor"), "cvor, $gde")
            assertEquals("brzina cvora, $gde", s.getDouble("cvorBrzina"), nodeSpeed(millis), 1e-5)
            ugao(meanLilithLongitude(millis), s.getDouble("lilit"), "Lilit, $gde")
            ugao(sky.points.first { it.key == PointKey.FORTUNE }.longitude, s.getDouble("sreca"), "Tacka srece, $gde")
            ugao(moonPhaseAngle(millis), s.getDouble("faza"), "faza Meseca, $gde")

            val aspekti = s.getJSONArray("aspekti")
            assertEquals("broj aspekata, $gde", aspekti.length(), sky.aspects.size)
            for (i in 0 until aspekti.length()) {
                assertEquals("aspekt $i, $gde", aspekti.getJSONObject(i).getString("key"), sky.aspects[i].contentKey)
                assertEquals("orb, $gde", aspekti.getJSONObject(i).getDouble("orb"), sky.aspects[i].orb, 1e-6)
            }

            val razmaknuto = spreadAngles(sky.planets.map { chartAngle(it.longitude, houses.ascendant) }, 9.5)
            val g = s.getJSONArray("razmaknuto")
            for (i in razmaknuto.indices) assertEquals("razmicanje, $gde", g.getDouble(i), razmaknuto[i], 1e-5)
        }
        println("SkyCore (Kotlin): ${slucajevi.length()} trenutaka, najvece odstupanje ugla $najvece°")
    }

    /** Racun za sat (`Sat.kt`) protiv `src/lib/sat.ts`; vremena do 2 s, stanice do minut. */
    @Test
    fun sat() {
        val slucajevi = JSONObject(File(System.getProperty("golden")!!).readText()).getJSONArray("slucajevi")
        var najvece = 0.0
        fun vreme(ms: Double, g: Double, sta: String, tol: Double = 2.0) {
            val r = abs(ms / 1000 - g)
            najvece = maxOf(najvece, r)
            assertTrue("$sta: ${ms / 1000} umesto $g", r < tol)
        }
        for (n in 0 until slucajevi.length()) {
            val s = slucajevi.getJSONObject(n)
            val ms = s.getDouble("unix") * 1000
            val gde = "${s.getString("mesto")} ${s.getDouble("unix")}"
            val g = s.getJSONObject("sat")
            val gm = g.getJSONObject("mesec")
            val m = moonNow(ms)
            assertEquals("znak Meseca, $gde", gm.getInt("znak"), m.sign)
            assertEquals("stepen Meseca, $gde", gm.getDouble("stepen"), m.degree, 1e-6)
            vreme(m.enteredAt, gm.getDouble("usao"), "ulazak Meseca u znak, $gde")
            vreme(m.ingressAt, gm.getDouble("izlazi"), "izlazak Meseca iz znaka, $gde")
            assertEquals("osvetljenost, $gde", gm.getDouble("osvetljen"), m.illumination, 1e-6)
            assertEquals("faza, $gde", gm.getInt("faza"), m.phase)
            vreme(m.lastNew, gm.getDouble("mlad"), "poslednji mlad Mesec, $gde")
            assertEquals("lunarni dan, $gde", gm.getInt("dan"), m.lunarDay)

            val gv = g.getJSONObject("voc")
            val v = voidOfCourse(ms, m)
            vreme(v.start, gv.getDouble("od"), "pocetak Meseca bez kursa, $gde")
            vreme(v.end, gv.getDouble("do"), "kraj Meseca bez kursa, $gde")
            assertEquals("bez kursa sada, $gde", gv.getBoolean("sada"), v.active)

            val h = planetaryHour(ms, Place(s.getDouble("lat"), s.getDouble("lon")))
            assertEquals("ima li planetarnog sata, $gde", g.isNull("sat"), h == null)
            if (h != null) {
                val gh = g.getJSONObject("sat")
                assertEquals("vladar sata, $gde", gh.getString("vladar"), h.ruler.key)
                assertEquals("sledeci vladar, $gde", gh.getString("sledeci"), h.next.key)
                assertEquals("redni broj sata, $gde", gh.getInt("indeks"), h.index)
                assertEquals("dan ili noc, $gde", gh.getBoolean("dan"), h.day)
                vreme(h.start, gh.getDouble("od"), "pocetak sata, $gde")
                vreme(h.end, gh.getDouble("do"), "kraj sata, $gde")
                vreme(h.sunrise, gh.getDouble("izlazak"), "izlazak Sunca, $gde")
                vreme(h.sunset, gh.getDouble("zalazak"), "zalazak Sunca, $gde")
            }

            val gd = g.getJSONArray("dogadjaji")
            val e = upcomingEvents(ms)
            assertEquals("broj dogadjaja, $gde", gd.length(), e.size)
            for (i in e.indices) {
                val x = gd.getJSONObject(i)
                assertEquals("dogadjaj $i, $gde", "${x.getString("vrsta")} ${x.getString("telo")} ${x.getInt("broj")}", "${e[i].kind} ${e[i].body?.key ?: ""} ${e[i].number}")
                vreme(e[i].at, x.getDouble("kad"), "vreme dogadjaja ${e[i].kind}, $gde", if (e[i].kind == "station") 60.0 else 2.0)
            }
        }
        println("SkyCore sat (Kotlin): ${slucajevi.length()} trenutaka, najvece odstupanje vremena $najvece s")
    }

    /** Bez mesta nema kuca ni Tacke srece — ne izmislja se ascendent. */
    @Test
    fun bezMesta() {
        val sky = buildSky(1_791_849_600_000L, null)
        assertNull(sky.houses)
        assertEquals(listOf(PointKey.NORTH_NODE, PointKey.LILITH), sky.points.map { it.key })
        assertEquals(10, sky.planets.size)
    }
}
