/**
 * Promene na nebu — sledeci ulazak planete u znak i promena smera: postaje
 * retrogradna ili ponovo direktna.
 *
 * Za pocetni ekran (Ivanov plan): do tri planete odjednom, svaka sa svojim
 * PRVIM sledecim dogadjajem, poredjane po datumu. Uz svaki dogadjaj ide dokle
 * traje (do izlaska iz znaka, odnosno do stanice direktno) i licni deo —
 * natalna kuca u koju planeta ulazi.
 *
 * Kuca se broji OD PODZNAKA, znak po znak (Whole Sign): ulazak u znak je tada
 * tacno i ulazak u kucu. Po Placidusu granica kuce ne pada na granicu znaka,
 * pa "ulazi u Skorpiju" i "ulazi u 8. kucu" ne bi bili isti dan. Bez vremena
 * rodjenja podznak nije pouzdan i kuca se NE prikazuje (pravilo 4 i 5).
 *
 * Mesec ne ulazi: menja znak na ~2,5 dana i ima svoju karticu.
 * Tekstova "planeta u kuci" jos nema (120 recenica ceka astrologa) — ovde je
 * samo racun.
 */
import { bodyLongitude, BODIES, type PlanetKey } from '@/lib/astro';
import { localMidnight } from '@/lib/transits';
import { SIGNS, norm360, type ZodiacSign } from '@/lib/zodiac';
import type { NatalChart } from '@/lib/natal';

const DAY = 86_400_000;

/** Koliko dana unapred se traze dogadjaji. Sunce menja znak svakih ~30 dana, pa se tri nadju mnogo ranije. */
const SEARCH_DAYS = 400;
/** Dokle se trazi kraj (izlazak iz znaka). Saturn stoji ~2,5 godine; iza toga je `null`. */
const END_HORIZON_DAYS = 1100;

export type SkyEvent = {
  planet: { key: PlanetKey; name: string; glyph: string };
  /** `ingress` = ulazi u znak, `retrograde` = postaje retrogradna, `direct` = ponovo direktna. */
  kind: 'ingress' | 'retrograde' | 'direct';
  /** Trenutak dogadjaja. */
  at: Date;
  /** Znak u koji ulazi, odnosno u kom menja smer. */
  sign: ZodiacSign;
  /**
   * Dokle traje: izlazak iz znaka ili stanica direktno. `null` = iza horizonta
   * (godinama). Kod `direct` je uvek `null` — direktno kretanje je redovno stanje.
   */
  until: Date | null;
  /** Natalna kuca od podznaka (1—12), ili null bez vremena rodjenja. */
  house: number | null;
};

function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

const signIdx = (lon: number) => Math.floor(norm360(lon) / 30);

/** Brzina u stepenima po danu, iz razlike +-1h. */
function speed(key: PlanetKey, t: number): number {
  const h = 3_600_000;
  return angleDelta(bodyLongitude(key, new Date(t + h)), bodyLongitude(key, new Date(t - h))) * 12;
}

/** Polovljenje: prvi trenutak u (lo, hi] za koji `changed` vazi. */
function bisect(lo: number, hi: number, changed: (t: number) => boolean): Date {
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (changed(mid)) hi = mid;
    else lo = mid;
  }
  return new Date(hi);
}

/** Prvi izlazak iz znaka `sign` posle `from`, ili null iza horizonta. */
function leavesSign(key: PlanetKey, sign: number, from: number): Date | null {
  const out = (t: number) => signIdx(bodyLongitude(key, new Date(t))) !== sign;
  // Korak 2 dana: Merkur prodje znak za bar ~14 dana, pa se izlazak ne preskoci.
  const step = 2 * DAY;
  for (let t = from + step; t <= from + END_HORIZON_DAYS * DAY; t += step) {
    if (out(t)) return bisect(t - step, t, out);
  }
  return null;
}

/** Stanica direktno posle `from` (retrogradnost traje najvise ~5 meseci). */
function stationDirect(key: PlanetKey, from: number): Date | null {
  const direct = (t: number) => speed(key, t) > 0;
  for (let t = from + DAY; t <= from + 200 * DAY; t += DAY) {
    if (direct(t)) return bisect(t - DAY, t, direct);
  }
  return null;
}

/** Kuca od podznaka (Whole Sign) za dati znak. */
export function wholeSignHouse(chart: NatalChart, sign: number): number {
  const asc = SIGNS.findIndex((s) => s.key === chart.ascendantSign.sign.key);
  return ((sign - asc + 12) % 12) + 1;
}

/**
 * Prvi sledeci dogadjaj za svaku planetu, od lokalne ponoci datog dana;
 * vraca `limit` najranijih, svaki za drugu planetu.
 */
export function upcomingSkyEvents(
  chart: NatalChart,
  date: Date = new Date(),
  timeUnknown = false,
  limit = 3
): SkyEvent[] {
  const start = localMidnight(date).getTime();
  const planets = BODIES.filter((b) => b.key !== 'moon');

  // Dan po dan za sve planete odjednom; staje cim se nadje `limit` planeta.
  // Dnevni korak je dovoljan: nijedno telo ne prelazi znak za manje od dana.
  const state = planets.map((b) => {
    const lon = bodyLongitude(b.key, new Date(start));
    return { b, lon, v: speed(b.key, start) };
  });
  const found: SkyEvent[] = [];
  const done = new Set<PlanetKey>();

  for (let d = 1; d <= SEARCH_DAYS && found.length < limit; d++) {
    const t = start + d * DAY;
    const dayFound: SkyEvent[] = [];
    for (const s of state) {
      if (done.has(s.b.key)) continue;
      const lon = bodyLongitude(s.b.key, new Date(t));
      const v = speed(s.b.key, t);
      const planet = { key: s.b.key, name: s.b.name, glyph: s.b.glyph };
      let ev: SkyEvent | null = null;

      if (signIdx(lon) !== signIdx(s.lon)) {
        const from = signIdx(s.lon);
        const at = bisect(t - DAY, t, (x) => signIdx(bodyLongitude(s.b.key, new Date(x))) !== from);
        const sign = signIdx(bodyLongitude(s.b.key, new Date(at.getTime() + 60_000)));
        ev = { planet, kind: 'ingress', at, sign: SIGNS[sign], until: leavesSign(s.b.key, sign, at.getTime()), house: null };
      } else if (s.v > 0 && v <= 0) {
        const at = bisect(t - DAY, t, (x) => speed(s.b.key, x) <= 0);
        ev = { planet, kind: 'retrograde', at, sign: SIGNS[signIdx(lon)], until: stationDirect(s.b.key, at.getTime()), house: null };
      } else if (s.v < 0 && v >= 0) {
        const at = bisect(t - DAY, t, (x) => speed(s.b.key, x) >= 0);
        ev = { planet, kind: 'direct', at, sign: SIGNS[signIdx(lon)], until: null, house: null };
      }

      s.lon = lon;
      s.v = v;
      if (ev) {
        if (!timeUnknown) ev.house = wholeSignHouse(chart, SIGNS.indexOf(ev.sign));
        done.add(s.b.key);
        dayFound.push(ev);
      }
    }
    found.push(...dayFound.sort((a, b) => a.at.getTime() - b.at.getTime()));
  }
  return found.slice(0, limit);
}
