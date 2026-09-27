/**
 * "TVOJ DAN" — jedan, najvazniji tranzit dana za Premium korisnike.
 *
 * Zamenjuje waterfall Hero-a (pravilo 18) za Premium; besplatni i dalje vide
 * stari Hero iz `transits.ts` (`pickHero`). Pravila su prenesena iz
 * `docs/tvoj_dan_simulacija.py` (Ivan, 27.9.2026) i tamo su izvor istine:
 *
 *   BODOVANJE = tezina planete x aspekt x vaznost mete x blizina orba x momenat
 *     - meta: Sunce, Mesec, ASC, MC i VLADAR horoskopa (natalni ili tranzitni) -> x1,3
 *     - blizina: 1 - 0,3 x (udaljenost / orbis)
 *     - momenat: egzaktan danas x1,5, pocinje danas x1,2
 *
 *   ROTACIJA
 *     - brze (Sunce, Merkur, Venera, Mars): odmor 3 dana posle prikaza, osim na
 *       dan egzaktnosti ako nije prikazan juce
 *     - spore (Jupiter—Pluton): SAMO na dan pocetka, egzaktnosti ili kraja, i
 *       odmor 7 dana
 *     - Mesec: rezerva, samo na dan kad je aspekt tacan (orbis 0)
 *
 * ORBISI su uzi od `TRANSIT_ORB` u `transits.ts` (3°): 1,5° do Saturna, 1° za
 * Uran, Neptun i Pluton. Vaze SAMO ovde — tab "Tranziti" i "Danas ukratko"
 * ostaju na 3° (Ivan, 27.9.2026).
 *
 * DAN je lokalni kalendarski dan, ponoc—ponoc. Tranzit je "aktivan" tog dana
 * ako je u orbisu u nekoj od dve ponoci ili ako tokom dana postaje egzaktan.
 * "Pocinje" = juce nije bio aktivan; "zavrsava se" = sutra nece biti.
 *
 * Cista funkcija, bez RN uvoza (pravilo 6). Dnevnik prikaza je
 * `store/tvoj-dan-log.ts`; provere u `scripts/check-tvoj-dan.ts`.
 */
import { BODIES, ASPECTS, bodyLongitude, type AspectDef, type PlanetKey } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';
import { chartRulers, rulerRole, type RulerRole } from '@/lib/rulers';
import { dayKey, daysBetween, localMidnight, natalTargets, type NatalTarget } from '@/lib/transits';

export const TD_ORB: Record<PlanetKey, number> = {
  sun: 1.5, mercury: 1.5, venus: 1.5, mars: 1.5, jupiter: 1.5, saturn: 1.5,
  uranus: 1.0, neptune: 1.0, pluto: 1.0, moon: 0,
};

export const TD_WEIGHT: Record<PlanetKey, number> = {
  pluto: 10, neptune: 9, uranus: 9, saturn: 8, jupiter: 7,
  mars: 5, sun: 5, venus: 4, mercury: 4, moon: 2,
};

export const TD_ASPECT_WEIGHT: Record<string, number> = {
  conjunction: 1.0, opposition: 0.9, square: 0.9, trine: 0.7, sextile: 0.5,
};

const FAST: readonly PlanetKey[] = ['sun', 'mercury', 'venus', 'mars'];
const SLOW: readonly PlanetKey[] = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const KEY_TARGETS = ['sun', 'moon', 'ascendant', 'midheaven'];
const TIME_DEPENDENT = ['ascendant', 'midheaven'];

export const FAST_REST_DAYS = 3;
export const SLOW_REST_DAYS = 7;
const KEY_FACTOR = 1.3;
const EXACT_FACTOR = 1.5;
const BEGIN_FACTOR = 1.2;

/** Redosled tranzitnih planeta kao u simulaciji — odlucuje samo pri istom skoru. */
const ORDER: PlanetKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

export type Moment = 'egzaktan' | 'pocinje' | 'zavrsava' | 'traje';

/**
 * Dnevnik prikaza: dan (`dayKey`) -> contentKey. Iz njega se dobija i poslednji
 * prikaz i broj prikaza svakog tranzita (za odmor i za rotaciju stavki).
 */
export type TvojDanLog = Record<string, string>;

export type TvojDanPick = {
  transiting: { key: PlanetKey; name: string; glyph: string };
  aspect: AspectDef;
  natal: NatalTarget;
  contentKey: string;
  /** Egzaktan tokom ovog dana. */
  exact: boolean;
  /** Najmanja udaljenost od tacnog aspekta u dve ponoci (0 ako je egzaktan). */
  distance: number;
  moment: Moment;
  score: number;
  /** Da li je tranzit vladara, i koja strana je vladar. */
  ruler: RulerRole | null;
  /** Koliko puta je prikazan PRE ovog dana — indeks za rotaciju stavki. */
  shownBefore: number;
};

/** (-180, 180] */
function signed(a: number): number {
  return ((((a + 180) % 360) + 360) % 360) - 180;
}

type Lons = Record<PlanetKey, number>;

function longitudes(date: Date): Lons {
  const out = {} as Lons;
  for (const b of BODIES) out[b.key] = bodyLongitude(b.key, date);
  return out;
}

/** Ponoc `offset` dana od lokalne ponoci `date` — preko kalendara, ne +24h. */
function midnight(date: Date, offset: number): Date {
  const d = localMidnight(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
}

/**
 * Isto kao `status` u simulaciji: aktivan, egzaktan tokom dana, najmanja
 * udaljenost. `l0`/`l1` su longitude tranzitne planete u dve ponoci.
 */
export function dayStatus(l0: number, l1: number, natal: number, angle: number, orb: number) {
  const tacke = angle === 0 || angle === 180 ? [angle] : [angle, -angle];
  let best: { active: boolean; exact: boolean; distance: number } | null = null;
  for (const s of tacke) {
    const d0 = signed(l0 - natal - s);
    const d1 = signed(l1 - natal - s);
    const exact = d0 * d1 <= 0 && Math.abs(d0) < 20 && Math.abs(d1) < 20;
    const m = exact ? 0 : Math.min(Math.abs(d0), Math.abs(d1));
    if (!best || m < best.distance) best = { active: exact || m <= orb, exact, distance: m };
  }
  return best!;
}

type Active = Map<string, { t: PlanetKey; aspect: AspectDef; natal: NatalTarget; exact: boolean; distance: number }>;

function activeOn(targets: NatalTarget[], a: Lons, b: Lons): Active {
  const out: Active = new Map();
  for (const t of ORDER) {
    for (const n of targets) {
      for (const aspect of ASPECTS) {
        const s = dayStatus(a[t], b[t], n.longitude, aspect.angle, TD_ORB[t]);
        if (s.active) {
          out.set(`transit.${t}.${aspect.key}.natal.${n.key}`, { t, aspect, natal: n, exact: s.exact, distance: s.distance });
        }
      }
    }
  }
  return out;
}

/** Poslednji prikaz (u danima pre `date`) i broj prikaza pre `date`, po kljucu. */
export function logStats(log: TvojDanLog, date: Date) {
  const today = dayKey(date);
  const since = new Map<string, number>();
  const count = new Map<string, number>();
  for (const [day, key] of Object.entries(log)) {
    if (day >= today) continue; // danasnji (i buduci) upis ne racuna se kao "prikazan ranije"
    const d = daysBetween(day, date);
    if (!since.has(key) || d < since.get(key)!) since.set(key, d);
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  return { since, count };
}

/**
 * Svi tranziti koji tog dana PROLAZE pravila rotacije, po skoru (najjaci prvi).
 * Izbor je prvi; lista postoji za provere.
 */
export function tvojDanCandidates(
  chart: NatalChart,
  date: Date,
  timeUnknown: boolean,
  log: TvojDanLog = {}
): TvojDanPick[] {
  const targets = natalTargets(chart).filter((n) => !(timeUnknown && TIME_DEPENDENT.includes(n.key)));
  const L = [-1, 0, 1, 2].map((o) => longitudes(midnight(date, o)));
  const prev = activeOn(targets, L[0], L[1]);
  const today = activeOn(targets, L[1], L[2]);
  const next = activeOn(targets, L[2], L[3]);
  const rulers = chartRulers(chart, timeUnknown);
  const { since, count } = logStats(log, date);

  const out: TvojDanPick[] = [];
  for (const [key, c] of today) {
    const begins = !prev.has(key);
    const ends = !next.has(key);
    const dana = since.get(key) ?? 999;
    if (SLOW.includes(c.t)) {
      if (!(begins || c.exact || ends) || dana < SLOW_REST_DAYS) continue;
    } else if (FAST.includes(c.t)) {
      if (dana < FAST_REST_DAYS && !(c.exact && dana >= 2)) continue;
    } else if (!c.exact) {
      continue; // Mesec: samo na dan tacnog aspekta
    }

    const ruler = rulerRole(c.t, c.natal.key, rulers);
    const orb = TD_ORB[c.t];
    let score = TD_WEIGHT[c.t] * TD_ASPECT_WEIGHT[c.aspect.key];
    score *= KEY_TARGETS.includes(c.natal.key) || ruler ? KEY_FACTOR : 1;
    score *= 1 - 0.3 * (orb ? c.distance / orb : 0);
    score *= c.exact ? EXACT_FACTOR : begins ? BEGIN_FACTOR : 1;

    const body = BODIES.find((b) => b.key === c.t)!;
    out.push({
      transiting: { key: c.t, name: body.name, glyph: body.glyph },
      aspect: c.aspect,
      natal: c.natal,
      contentKey: key,
      exact: c.exact,
      distance: c.distance,
      moment: c.exact ? 'egzaktan' : begins ? 'pocinje' : ends ? 'zavrsava' : 'traje',
      score,
      ruler,
      shownBefore: count.get(key) ?? 0,
    });
  }
  // Stabilno: pri istom skoru ostaje redosled obilaska, kao `>` u simulaciji.
  return out.sort((a, b) => b.score - a.score);
}

/** Tranzit za "Tvoj dan" tog lokalnog dana, ili null ako nijedan ne prolazi pravila. */
export function pickTvojDan(
  chart: NatalChart,
  date: Date,
  timeUnknown: boolean,
  log: TvojDanLog = {}
): TvojDanPick | null {
  return tvojDanCandidates(chart, date, timeUnknown, log)[0] ?? null;
}

/**
 * Dnevnik kakav bi bio na dan `target` — za pregled drugih dana (dan-meni).
 * Proslost: pravi dnevnik (izbor ionako gleda samo dane pre `target`).
 * Buducnost: pravi dnevnik, pa se od danas do dana pre `target` svaki dan
 * izabere i upise — isto ono sto ce se desiti kad ti dani dodju.
 */
export function tvojDanLogFor(
  chart: NatalChart,
  target: Date,
  log: TvojDanLog,
  timeUnknown: boolean,
  today: Date = new Date()
): TvojDanLog {
  const offset = daysBetween(dayKey(today), target);
  if (offset <= 0) return log;
  const sim: TvojDanLog = { ...log };
  for (let o = 0; o < offset; o++) {
    const d = midnight(today, o);
    const k = dayKey(d);
    if (sim[k]) continue;
    const p = pickTvojDan(chart, d, timeUnknown, sim);
    if (p) sim[k] = p.contentKey;
  }
  return sim;
}

/* ------------------------------------------------------------------------- *
 * TRAJANJE — pocetak je dan ulaska u orbis, kraj dan izlaska (poslednji dan
 * u orbisu). Dan po dan, po istoj definiciji "aktivnog dana" kao izbor.
 * Retrogradna planeta ume da izadje i vrati se: vraca se TEKUCI prolaz.
 * Iza ~3 godine u bilo kom smeru -> null (Pluton na konjunkciji ume da stoji).
 * ------------------------------------------------------------------------- */

const WINDOW_HORIZON_DAYS = 1100;

export type TvojDanWindow = { start: Date | null; end: Date | null };

export function tvojDanWindow(pick: Pick<TvojDanPick, 'transiting' | 'aspect' | 'natal'>, date: Date): TvojDanWindow {
  const today = midnight(date, 0);
  // Mesec je u orbisu 0 samo dan kad je tacan.
  if (pick.transiting.key === 'moon') return { start: today, end: today };

  const key = pick.transiting.key;
  const orb = TD_ORB[key];
  const lon = new Map<number, number>();
  const at = (o: number) => {
    if (!lon.has(o)) lon.set(o, bodyLongitude(key, midnight(date, o)));
    return lon.get(o)!;
  };
  const active = (o: number) => dayStatus(at(o), at(o + 1), pick.natal.longitude, pick.aspect.angle, orb).active;

  let s = 0;
  while (s > -WINDOW_HORIZON_DAYS && active(s - 1)) s--;
  let e = 0;
  while (e < WINDOW_HORIZON_DAYS && active(e + 1)) e++;
  return {
    start: s <= -WINDOW_HORIZON_DAYS ? null : midnight(date, s),
    end: e >= WINDOW_HORIZON_DAYS ? null : midnight(date, e),
  };
}
