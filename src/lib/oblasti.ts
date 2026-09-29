/**
 * TRANZITI DANA I OCENA OBLASTI — ocena dana za Ljubav, Zdravlje i lepotu,
 * Karijeru i finansije, Kucu i bastu (kartica na slajdu "Danas ukratko") i
 * lista svih tranzita po vaznosti (`poVaznosti`, Premium tab "Tranziti").
 * Oba idu kroz ISTU funkciju (`oblastiDana`), pa su tranziti i ton isti.
 *
 * Svi brojevi su u `lib/oblasti-config.ts` (za astrologa). Ovde je samo racun:
 *
 *   AKTIVNI: tranziti Sunce—Pluton u orbisu tog LOKALNOG DANA, po istoj
 *     definiciji i sa istim orbisima kao "Tvoj dan" (`dayStatus`, `TD_ORB`):
 *     u orbisu u nekoj od dve ponoci ili egzaktan tokom dana. Mesec ne ulazi
 *     (`INCLUDE_MOON_TRANSITS`). Ceo dan je zato ista lista i ista ocena.
 *   VEZA: kuca tranzitne planete u natalnoj karti, kuca pogodjene natalne tacke,
 *     ili planeta sa liste oblasti — najveca vrednost. Bez vremena rodjenja kuca
 *     nema (pravilo 5), veza ide samo preko planeta.
 *   JACINA: planeta × aspekt × (1,2 za kljucnu tacku ili vladara) × blizina, najvise 1.
 *     Blizina gleda NAJMANJU udaljenost tog dana (0 ako je egzaktan), ne trenutak
 *     otvaranja — da se ocena ne menja tokom dana.
 *   OCENA: 3 + Σ(znak tona × jacina × veza × 2), zaokruzeno pa ograniceno na 1—5.
 *     Zaokruzuje se SIMETRICNO oko 3 (±2,5 -> ±3): obicno `Math.round` bi +2,5
 *     dizao a −2,5 spustao samo do 3, pa bi los dan izgledao bolje od dobrog.
 *
 * Cisto, bez RN uvoza (pravilo 6). Provere: `npm run check:oblasti`.
 */
import { BODIES, ASPECTS, bodyLongitude, type AspectDef, type PlanetKey } from '@/lib/astro';
import { houseOf, type NatalChart } from '@/lib/natal';
import { chartRulers, rulerRole, type RulerRole } from '@/lib/rulers';
import { transitTone, type Tone, type ToneSource } from '@/lib/tone';
import { dayKey, daysBetween, natalTargets, TRANSIT_ORB, type NatalTarget } from '@/lib/transits';
import { dayStatus, TD_ORB, tvojDanWindow } from '@/lib/tvoj-dan';
import { josTraje } from '@/lib/mnozina';
import { HOUSE_THEMES, PHASE_NAME, phaseDay } from '@/lib/moon';
import {
  BLIZINA_PAD, DOPRINOS_FAKTOR, INCLUDE_MOON_TRANSITS, JACINA_ASPEKTA, JACINA_PLANETE,
  KLJUCNA_TACKA_FAKTOR, KLJUCNE_TACKE, LUNACIJA, OBLASTI, OCENA_MAX, OCENA_MIN, OCENA_SREDINA,
  OZNAKA_OCENE, PODRAZUMEVANI_REDOSLED, VEZA, ZNAK_TONA, type OblastDef, type OblastKey,
} from '@/lib/oblasti-config';

const TIME_DEPENDENT = ['ascendant', 'midheaven'];

/* ------------------------------------------------------------------------- *
 * Redovi: tranzit ili Mlad/Pun Mesec u kuci
 * ------------------------------------------------------------------------- */

export type TranzitRed = {
  kind: 'tranzit';
  /** `transit.<telo>.<aspekt>.natal.<meta>` — kljuc teksta i tona. */
  key: string;
  transiting: { key: PlanetKey; name: string; glyph: string };
  aspect: AspectDef;
  natal: NatalTarget;
  exact: boolean;
  /** Najmanja udaljenost od tacnog aspekta tog dana (0 ako je egzaktan). */
  distance: number;
  /** Kuca kroz koju prolazi tranzitna planeta; null bez vremena rodjenja. */
  transitHouse: number | null;
  /** Kuca pogodjene natalne tacke; null bez vremena rodjenja. */
  natalHouse: number | null;
  /** Tranzit vladara horoskopa, i koja strana je vladar (oznaka kao na "Tvom danu"). */
  ruler: RulerRole | null;
  jacina: number;
};

export type LunacijaRed = {
  kind: 'lunacija';
  key: 'lunacija.new' | 'lunacija.full';
  faza: 'new' | 'full';
  /** "Mlad Mesec" / "Pun Mesec" */
  fazaIme: string;
  house: number;
  theme: string;
  jacina: number;
};

export type Red = TranzitRed | LunacijaRed;

/** Red u jednoj oblasti (ili u "Ostalim tranzitima", tada su veza i doprinos 0). */
export type StavkaOblasti = {
  red: Red;
  ton: Tone;
  tonIzvor: ToneSource;
  veza: number;
  doprinos: number;
};

export type OblastDana = {
  def: OblastDef;
  ocena: number;
  oznaka: string;
  stavke: StavkaOblasti[];
};

export type OblastiDana = {
  /** Tranziti u uskom orbisu (`TD_ORB`) — od njih su ocene oblasti. Bez redova za Mlad/Pun Mesec. */
  tranziti: TranzitRed[];
  /**
   * Svi tranziti sa tonom, najvazniji (najveca jacina) prvi — lista na ekranu
   * "Tranziti" i "Aktivnih: N". Sirim orbisom (`LISTA_ORB`) kad je dat, pa je
   * nadskup `tranziti`.
   */
  poVaznosti: (Omit<StavkaOblasti, 'red'> & { red: TranzitRed })[];
  oblasti: OblastDana[];
  /** Tranziti bez veze sa ijednom PRIKAZANOM oblascu. Bez ocene. */
  ostali: StavkaOblasti[];
  /** Nema vremena rodjenja: veza samo preko planeta, bez Mladog i Punog Meseca. */
  bezKuca: boolean;
};

/* ------------------------------------------------------------------------- */

function midnight(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
}

/** Jacina tranzita, 0—1. */
export function jacinaTranzita(
  transitingKey: PlanetKey,
  aspectKey: string,
  natalKey: string,
  distance: number,
  natalJeVladar: boolean
): number {
  const orb = TD_ORB[transitingKey];
  let j = (JACINA_PLANETE[transitingKey] ?? 0) * (JACINA_ASPEKTA[aspectKey] ?? 0);
  if (KLJUCNE_TACKE.includes(natalKey) || natalJeVladar) j *= KLJUCNA_TACKA_FAKTOR;
  j *= 1 - BLIZINA_PAD * (orb ? Math.min(1, distance / orb) : 0);
  return Math.min(1, j);
}

/**
 * Orbis LISTE na tabu "Tranziti" (Ivan, 28.9.2026): isti kao "Tema perioda" na
 * pocetnoj (`TRANSIT_ORB` u `transits.ts` — 3°, sekstil 2°), za sve planete.
 * Sa uskim orbisom "Tvog dana" (`TD_ORB`: 1,5°, spore 1°) lista je gubila spore
 * tranzite koji traju mesecima (Pluton opozicija ASC na 2°) — a oni nose period.
 * Ocene oblasti i izbor "Tvog dana" OSTAJU na `TD_ORB`: tamo odlucuje ono sto
 * je tog dana skoro tacno.
 */
export const LISTA_ORB = (_body: PlanetKey, aspectKey: string): number => TRANSIT_ORB[aspectKey];

/** Trajanje tranzita za prikaz. `preostalo`: dana posle `date` do kraja (0 = danas je poslednji). */
export type Trajanje = { start: Date | null; end: Date | null; preostalo: number | null; mesec: boolean };

/**
 * JEDINO mesto koje racuna trajanje za prikaz — lista "Tranziti", "Tema perioda",
 * ceo tekst tranzita i list "Zašto baš ovaj tekst". Do 29.9.2026 su lista i ceo tekst
 * isti tranzit merili razlicitim orbisom (3° naspram 1,5°) i pokazivali razlicit
 * broj dana (Ivan). Orbis je orbis liste (`LISTA_ORB`), jer je njime tranzit usao
 * na ekran; orbisi "Tvog dana" vaze samo za izbor, ne za trajanje.
 * Mesec: samo dan kad je tacan.
 */
export function trajanjeTranzita(pick: Pick<TranzitRed, 'transiting' | 'aspect' | 'natal'>, date: Date): Trajanje {
  const mesec = pick.transiting.key === 'moon';
  const w = tvojDanWindow(pick, date, LISTA_ORB(pick.transiting.key, pick.aspect.key));
  return { ...w, preostalo: w.end ? daysBetween(dayKey(date), w.end) : null, mesec };
}

/** "Samo danas" za Mesec, inace `josTraje` — isti natpis svuda. */
export const trajanjeTekst = (t: Trajanje): string => (t.mesec ? 'Samo danas' : josTraje(t.preostalo));

/** Svi tranziti u orbisu tog lokalnog dana, najjaci prvi. `orbZa` podrazumevano je `TD_ORB`. */
export function aktivniTranziti(
  chart: NatalChart,
  date: Date,
  timeUnknown: boolean,
  orbZa: (body: PlanetKey, aspectKey: string) => number = (body) => TD_ORB[body],
): TranzitRed[] {
  const targets = natalTargets(chart).filter((n) => !(timeUnknown && TIME_DEPENDENT.includes(n.key)));
  const rulers = chartRulers(chart, timeUnknown);
  const d0 = midnight(date, 0);
  const d1 = midnight(date, 1);
  const out: TranzitRed[] = [];

  for (const body of BODIES) {
    if (body.key === 'moon' && !INCLUDE_MOON_TRANSITS) continue;
    const l0 = bodyLongitude(body.key, d0);
    const l1 = bodyLongitude(body.key, d1);
    for (const n of targets) {
      for (const aspect of ASPECTS) {
        const s = dayStatus(l0, l1, n.longitude, aspect.angle, orbZa(body.key, aspect.key));
        if (!s.active) continue;
        const natalHouse = timeUnknown ? null
          : n.key === 'ascendant' ? 1
          : n.key === 'midheaven' ? 10
          : chart.planets.find((p) => p.key === n.key)?.house ?? null;
        out.push({
          kind: 'tranzit',
          key: `transit.${body.key}.${aspect.key}.natal.${n.key}`,
          transiting: { key: body.key, name: body.name, glyph: body.glyph },
          aspect,
          natal: n,
          exact: s.exact,
          distance: s.distance,
          transitHouse: timeUnknown ? null : houseOf(l0, chart.houses),
          natalHouse,
          ruler: rulerRole(body.key, n.key, rulers),
          jacina: jacinaTranzita(body.key, aspect.key, n.key, s.distance, rulers.includes(n.key as PlanetKey)),
        });
      }
    }
  }
  return out.sort((a, b) => b.jacina - a.jacina);
}

/** Mlad ili Pun Mesec u natalnoj kuci — samo na dan faze i samo uz vreme rodjenja. */
export function lunacijaDana(chart: NatalChart, date: Date, timeUnknown: boolean): LunacijaRed | null {
  if (timeUnknown) return null;
  const faza = phaseDay(date);
  if (faza.key !== 'new' && faza.key !== 'full') return null;
  const house = houseOf(faza.moonLongitude, chart.houses);
  return {
    kind: 'lunacija',
    key: `lunacija.${faza.key}`,
    faza: faza.key,
    fazaIme: PHASE_NAME[faza.key],
    house,
    theme: HOUSE_THEMES[house],
    jacina: LUNACIJA.jacina,
  };
}

/** Jacina veze reda sa oblascu (0 = nema veze). Najveca od svih pogodaka. */
export function vezaSaOblascu(red: Red, oblast: OblastDef): number {
  const kuca = (h: number | null) =>
    h === null ? 0 : oblast.houses.includes(h) ? VEZA.kuca : oblast.weakHouses.includes(h) ? VEZA.slabaKuca : 0;
  if (red.kind === 'lunacija') return kuca(red.house);
  const planeta =
    oblast.points.includes(red.transiting.key) || oblast.points.includes(red.natal.key) ? VEZA.planeta : 0;
  return Math.max(kuca(red.transitHouse), kuca(red.natalHouse), planeta);
}

/** 3 + zbir doprinosa, simetricno zaokruzeno oko 3, u granicama 1—5. */
export function ocenaIzDoprinosa(doprinosi: number[]): number {
  const zbir = doprinosi.reduce((s, x) => s + x, 0);
  // Epsilon: 0,6×0,5×… u pokretnom zarezu ume da da 2,4999999 umesto 2,5.
  const pomak = Math.sign(zbir) * Math.round(Math.abs(zbir) + 1e-9);
  return Math.min(OCENA_MAX, Math.max(OCENA_MIN, OCENA_SREDINA + pomak));
}

export const oznakaOcene = (ocena: number) => OZNAKA_OCENE[ocena] ?? '';

function tonReda(red: Red, rucni: Map<string, string>): { ton: Tone; tonIzvor: ToneSource } {
  if (red.kind === 'lunacija') return { ton: LUNACIJA[red.faza].ton, tonIzvor: 'rule' };
  const { tone, source } = transitTone(red.transiting.key, red.aspect.key, red.natal.key, rucni.get(red.key));
  return { ton: tone, tonIzvor: source };
}

/**
 * Oblasti tog dana — ocena, oznaka i lista po oblasti, plus "Ostali tranziti".
 * `tonovi`: rucne oznake astrologa (`transit_texts.tone`); bez njih vazi pravilo.
 * `redosled` / `iskljucene`: interesovanja iz onboardinga, kad taj korak stigne.
 */
export function oblastiDana({
  chart, date, timeUnknown, tonovi = new Map(), redosled = PODRAZUMEVANI_REDOSLED, iskljucene = [],
}: {
  chart: NatalChart;
  date: Date;
  timeUnknown: boolean;
  tonovi?: Map<string, string>;
  redosled?: readonly OblastKey[];
  iskljucene?: readonly OblastKey[];
}): OblastiDana {
  const tranziti = aktivniTranziti(chart, date, timeUnknown);
  const lunacija = lunacijaDana(chart, date, timeUnknown);
  const zaListu = aktivniTranziti(chart, date, timeUnknown, LISTA_ORB);
  return rasporedi(tranziti, lunacija, tonovi, redosled, iskljucene, timeUnknown, zaListu);
}

/** Raspodela gotovih redova po oblastima — odvojeno da provere mogu da je hrane zadatim redovima. */
export function rasporedi(
  tranziti: TranzitRed[],
  lunacija: LunacijaRed | null,
  tonovi: Map<string, string>,
  redosled: readonly OblastKey[] = PODRAZUMEVANI_REDOSLED,
  iskljucene: readonly OblastKey[] = [],
  timeUnknown = false,
  /** Tranziti za listu (`LISTA_ORB`); bez njega lista su `tranziti`. */
  zaListu?: TranzitRed[],
): OblastiDana {
  const redovi: Red[] = lunacija ? [...tranziti, lunacija] : tranziti;
  const sTonom = redovi.map((red) => ({ red, ...tonReda(red, tonovi) }));
  const prikazane = redosled
    .filter((k) => !iskljucene.includes(k))
    .map((k) => OBLASTI.find((o) => o.key === k)!)
    .filter(Boolean);

  const vezani = new Set<string>();
  const oblasti: OblastDana[] = prikazane.map((def) => {
    const stavke: StavkaOblasti[] = [];
    for (const r of sTonom) {
      const veza = vezaSaOblascu(r.red, def);
      if (veza <= 0) continue;
      vezani.add(r.red.key);
      stavke.push({ ...r, veza, doprinos: ZNAK_TONA[r.ton] * r.red.jacina * veza * DOPRINOS_FAKTOR });
    }
    // Po velicini uticaja na ocenu; mesoviti (doprinos 0) po jacini veze, na kraju.
    stavke.sort((a, b) =>
      Math.abs(b.doprinos) - Math.abs(a.doprinos) || b.red.jacina * b.veza - a.red.jacina * a.veza);
    const ocena = ocenaIzDoprinosa(stavke.map((s) => s.doprinos));
    return { def, ocena, oznaka: oznakaOcene(ocena), stavke };
  });

  const ostali = sTonom
    .filter((r) => !vezani.has(r.red.key))
    .map((r) => ({ ...r, veza: 0, doprinos: 0 }))
    .sort((a, b) => b.red.jacina - a.red.jacina);

  const poVaznosti = (zaListu ? zaListu.map((red) => ({ red, ...tonReda(red, tonovi) })) : sTonom)
    .filter((r): r is typeof r & { red: TranzitRed } => r.red.kind === 'tranzit')
    .map((r) => ({ ...r, veza: 0, doprinos: 0 }))
    .sort((a, b) => b.red.jacina - a.red.jacina);

  return { tranziti, poVaznosti, oblasti, ostali, bezKuca: timeUnknown };
}

/** Samo ocene — za karticu na slajdu "Danas ukratko". */
export function oceneOblasti(r: OblastiDana): { key: OblastKey; name: string; ocena: number; oznaka: string }[] {
  return r.oblasti.map((o) => ({ key: o.def.key, name: o.def.name, ocena: o.ocena, oznaka: o.oznaka }));
}

/* ------------------------------------------------------------------------- *
 * NASLOV TUMACENJA — iz naslova teksta "Sunce konjunkcija Jupiter natal –
 * Pozitivne tendencije" veci tekst je deo posle crte, manji je deo pre nje
 * bez reci "natal". Parser korpusa (`parse_docx.py`) vec cuva samo deo posle
 * crte, pa naslov iz baze obicno i nema crtu — onda je ceo naslov tumacenje.
 * ------------------------------------------------------------------------- */

/** Crta sa razmakom ispred (– — ili -), da se ne sece "e-mail" ili "pred-". */
const CRTA = /\s+[–—-]\s*|\s*[–—]\s+/;

export function parseNaslov(title: string | null | undefined): { naslov: string | null; planete: string | null } {
  const t = (title ?? '').trim();
  if (!t) return { naslov: null, planete: null };
  const m = CRTA.exec(t);
  if (!m) return { naslov: t, planete: null };
  const levo = t.slice(0, m.index).trim().replace(/\s+natal\w*$/i, '');
  const desno = t.slice(m.index + m[0].length).trim();
  return { naslov: desno || null, planete: levo || null };
}

/** "Sunce konjunkcija Jupiter" — iz kljuceva, ne iz teksta; bez reci "natal". */
export function imeTranzita(r: Pick<TranzitRed, 'transiting' | 'aspect' | 'natal'>): string {
  return `${r.transiting.name} ${r.aspect.name} ${r.natal.name}`;
}

/**
 * Veci i manji tekst reda. Bez naslova tumacenja veci je ime tranzita, manjeg
 * nema, a tekst se oznacava za proveru (`zaProveru`). Naslov koji je samo ime
 * tranzita (podnaslov izostavljen u .docx-u) racuna se kao da naslova nema.
 */
export function tekstReda(
  r: Pick<TranzitRed, 'transiting' | 'aspect' | 'natal'>,
  title: string | null | undefined
): { veci: string; manji: string | null; zaProveru: boolean } {
  const ime = imeTranzita(r);
  const { naslov } = parseNaslov(title);
  const samoIme = !!naslov && naslov.toLowerCase().startsWith(`${r.transiting.name} ${r.aspect.name}`.toLowerCase());
  if (!naslov || samoIme) return { veci: ime, manji: null, zaProveru: true };
  return { veci: naslov, manji: ime, zaProveru: false };
}

/** Red za Mlad/Pun Mesec: "Novi početak: ljubav…" / "Mlad Mesec u tvojoj 5. kući". */
export function tekstLunacije(r: LunacijaRed): { veci: string; manji: string } {
  return { veci: `${LUNACIJA[r.faza].naslov}: ${r.theme}`, manji: `${r.fazaIme} u tvojoj ${r.house}. kući` };
}
