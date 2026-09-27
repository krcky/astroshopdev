"""
Simulacija rotacije kartice "Tvoj dan" za astrološku aplikaciju.

Računa stvarne položaje planeta (Swiss Ephemeris, Moshier, bez dodatnih fajlova),
nalazi aktivne tranzite prema natalnoj karti i svaki dan bira jedan za "Tvoj dan"
po pravilima:
  - bodovanje: planeta x aspekt x pogođena tačka x blizina orba x ključni momenat
  - brzi tranziti (Sunce, Merkur, Venera, Mars): odmor 3 dana posle prikaza,
    osim na dan egzaktnosti (ako nije prikazan juče)
  - spori (Jupiter-Pluton): samo na dan početka, egzaktnosti ili kraja; odmor 7 dana
  - Mesec: rezerva, samo na dan kada je aspekt tačan
  - ako se isti tranzit vrati, rotira se ugao: efekat -> izazov -> savet

pip install pyswisseph
"""
import datetime as dt
import swisseph as swe

FLAG = swe.FLG_MOSEPH | swe.FLG_SPEED
TZ = 2  # Beograd, letnje vreme (dovoljno za simulaciju)

PLANETS = {
    "Sunce": swe.SUN, "Mesec": swe.MOON, "Merkur": swe.MERCURY, "Venera": swe.VENUS,
    "Mars": swe.MARS, "Jupiter": swe.JUPITER, "Saturn": swe.SATURN,
    "Uran": swe.URANUS, "Neptun": swe.NEPTUNE, "Pluton": swe.PLUTO,
}
FAST = {"Sunce", "Merkur", "Venera", "Mars"}
SLOW = {"Jupiter", "Saturn", "Uran", "Neptun", "Pluton"}
ORB = {"Sunce": 1.5, "Merkur": 1.5, "Venera": 1.5, "Mars": 1.5, "Jupiter": 1.5,
       "Saturn": 1.5, "Uran": 1.0, "Neptun": 1.0, "Pluton": 1.0, "Mesec": 0.0}
P_WEIGHT = {"Pluton": 10, "Neptun": 9, "Uran": 9, "Saturn": 8, "Jupiter": 7,
            "Mars": 5, "Sunce": 5, "Venera": 4, "Merkur": 4, "Mesec": 2}
ASPECTS = {"konjunkcija": (0, 1.0), "opozicija": (180, 0.9), "kvadrat": (90, 0.9),
           "trigon": (120, 0.7), "sekstil": (60, 0.5)}
KEY_TARGETS = {"Sunce", "Mesec", "Ascendent", "MC"}
ANGLES = ["efekat", "izazov", "savet"]


def jd(date, hour_local):
    t = dt.datetime.combine(date, dt.time()) + dt.timedelta(hours=hour_local - TZ)
    return swe.julday(t.year, t.month, t.day, t.hour + t.minute / 60)


def positions(j):
    return {n: swe.calc_ut(j, p, FLAG)[0][0] for n, p in PLANETS.items()}


def natal_chart(birth_utc, lat, lon):
    j = swe.julday(birth_utc.year, birth_utc.month, birth_utc.day,
                   birth_utc.hour + birth_utc.minute / 60)
    pts = positions(j)
    cusps, ascmc = swe.houses(j, lat, lon, b"P")
    pts["Ascendent"], pts["MC"] = ascmc[0], ascmc[1]
    return pts


def signed(a):
    return (a + 180) % 360 - 180


def status(tp_start, tp_end, natal_lon, asp, orb):
    """Vraća (aktivan, egzaktan danas, minimalna udaljenost)."""
    best = None
    for s in ({asp, -asp} if asp not in (0, 180) else {asp}):
        d0 = signed(tp_start - natal_lon - s)
        d1 = signed(tp_end - natal_lon - s)
        exact = d0 * d1 <= 0 and abs(d0) < 20 and abs(d1) < 20
        m = 0.0 if exact else min(abs(d0), abs(d1))
        if best is None or m < best[2]:
            best = (exact or m <= orb, exact, m)
    return best


def active_on(date, natal):
    a, b = positions(jd(date, 0)), positions(jd(date, 24))
    out = {}
    for tname in PLANETS:
        for nname, nlon in natal.items():
            for aname, (deg, _) in ASPECTS.items():
                act, exact, m = status(a[tname], b[tname], nlon, deg, ORB[tname])
                if act:
                    out[(tname, aname, nname)] = (exact, m)
    return out


def simulate(natal, start, days):
    act = {start + dt.timedelta(d): active_on(start + dt.timedelta(d), natal)
           for d in range(-1, days + 1)}
    last_shown, times_shown, rows = {}, {}, []
    for i in range(days):
        day = start + dt.timedelta(i)
        prev, nxt = act[day - dt.timedelta(1)], act[day + dt.timedelta(1)]
        best = None
        for key, (exact, m) in act[day].items():
            tname, aname, nname = key
            begins, ends = key not in prev, key not in nxt
            since = (day - last_shown[key]).days if key in last_shown else 999
            if tname in SLOW:
                if not (begins or exact or ends) or since < 7:
                    continue
            elif tname in FAST:
                if since < 3 and not (exact and since >= 2):
                    continue
            elif tname == "Mesec" and not exact:
                continue
            score = P_WEIGHT[tname] * ASPECTS[aname][1]
            score *= 1.3 if nname in KEY_TARGETS else 1.0
            score *= 1 - 0.3 * (m / ORB[tname] if ORB[tname] else 0)
            score *= 1.5 if exact else 1.2 if begins else 1.0
            moment = "egzaktan" if exact else "počinje" if begins else "završava se" if ends else "traje"
            if best is None or score > best[0]:
                best = (score, key, moment)
        if best is None:
            rows.append((day, None, "—", "rezerva: natal „Otkrij danas“", len(act[day])))
            continue
        _, key, moment = best
        n = times_shown.get(key, 0)
        times_shown[key] = n + 1
        last_shown[key] = day
        rows.append((day, key, moment, ANGLES[n % 3], len(act[day])))
    return rows


if __name__ == "__main__":
    # Primer korisnika: rođen 10.7.1990. u 14:30 u Beogradu (12:30 UT)
    natal = natal_chart(dt.datetime(1990, 7, 10, 12, 30), 44.8125, 20.4612)
    rows = simulate(natal, dt.date(2026, 9, 27), 20)
    days_sr = ["pon", "uto", "sre", "čet", "pet", "sub", "ned"]
    print("| Dan | Tvoj dan | Momenat | Ugao | Aktivnih |\n|---|---|---|---|---|")
    for day, key, moment, angle, n in rows:
        name = f"{key[0]} {key[1]} {key[2]}" if key else "—"
        print(f"| {days_sr[day.weekday()]} {day.day}.{day.month}. | {name} | {moment} | {angle} | {n} |")
    shown = [r[1] for r in rows if r[1]]
    rep = {k: [r[0] for r in rows if r[1] == k] for k in set(shown) if shown.count(k) > 1}
    consec = sum(1 for a, b in zip(rows, rows[1:]) if a[1] and a[1] == b[1])
    print(f"\nRazličitih tranzita: {len(set(shown))} od {len(rows)} dana")
    print(f"Isti tranzit dva dana zaredom: {consec}")
    for k, ds in rep.items():
        print("Ponovljen:", " ".join(k), "->", ", ".join(f"{d.day}.{d.month}." for d in ds))
