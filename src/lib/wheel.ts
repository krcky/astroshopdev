/**
 * Geometrija natalnog tocka — cista matematika, bez React Native uvoza,
 * da bi mogla da se testira u obicnom Node-u.
 */

import { CENTAR, OKVIR, VIEW } from '@/lib/tocak-stil';

const DEG = Math.PI / 180;

/**
 * Ekliptička longituda -> ugao na ekranu, u stepenima.
 *
 * Tradicionalna orijentacija zapadne astrologije: ascendent je na LEVOJ strani
 * (9 sati), a longituda raste SUPROTNO od kazaljke na satu. U matematickoj
 * konvenciji (0° = desno, pozitivno suprotno od kazaljke) to je:
 *
 *   ASC        -> 180° (levo)
 *   ASC + 90°  -> 270° (dole)  = 4. kuca, IC
 *   ASC + 180° ->   0° (desno) = descendent
 */
export function chartAngle(longitude: number, ascendant: number): number {
  return 180 + (longitude - ascendant);
}

/**
 * Longituda koja stoji LEVO (9 sati) — ono sto se predaje `chartAngle` kao
 * `ascendant`. Sa vremenom rodjenja to je ascendent. Bez njega ascendent nije
 * poznat (pravilo 5) i tocak ne crta kuce, ASC ni MC; levo je tada 0° Ovna,
 * "prirodni" tocak koji ne tvrdi nista o kucama (Ivan, 30.9.2026). Da ostane
 * ascendent za podne, levo bi stajao izmisljen podznak bez natpisa.
 */
export function levaTacka(ascendant: number, bezKuca: boolean): number {
  return bezKuca ? 0 : ascendant;
}

/**
 * Cetiri ose karte — ASC, IC, DSC, MC — kao eklipticke longitude. Crtaju se
 * debelo, kroz ceo tocak.
 *
 * Po Placidusu su to bas 1., 4., 7. i 10. kuspida. Ali kad Placidus nije moguc
 * (polarna sirina na "Nebu"), kuce su Whole Sign i kuspide su granice znakova:
 * ose tada NISU medju njima. Zato se uzimaju iz ascendenta i MC-a, a ne iz
 * rednog broja kuspide — inace bi crni krst stajao ukoso od natpisa ASC i MC.
 */
export function oseKarte(ascendant: number, midheaven: number): number[] {
  const n = (a: number) => ((a % 360) + 360) % 360;
  return [n(ascendant), n(midheaven + 180), n(ascendant + 180), n(midheaven)];
}

/** Kuspida koja pada na osu se ne crta tanko — preko nje ide debela osa. */
export function naOsi(longitude: number, ose: number[]): boolean {
  return ose.some((o) => Math.abs(((longitude - o + 540) % 360) - 180) < 1e-6);
}

/** Tacka na krugu. SVG ima y nadole, pa se sinus oduzima. */
export function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const a = angleDeg * DEG;
  return { x: cx + radius * Math.cos(a), y: cy - radius * Math.sin(a) };
}

/**
 * Razmice uglove koji su blizi od `minSep` da se simboli planeta ne preklope.
 *
 * Naivna relaksacija po krugu ne radi: cim jedna planeta prodje pored druge,
 * razmak se "obmota" (4° postane 356°) i algoritam pomisli da je sve u redu,
 * a poredak je vec pokvaren. Zato prvo secemo krug na najvecem procepu i
 * radimo u ODMOTANOM, rastucem nizu gde obmotavanje ne postoji.
 */
export function spreadAngles(angles: number[], minSep: number): number[] {
  const n = angles.length;
  if (n < 2) return [...angles];

  const norm = (a: number) => ((a % 360) + 360) % 360;

  // Ne staje na krug — rasporedi ravnomerno.
  if (n * minSep >= 360) {
    const idx = angles.map((_, i) => i).sort((a, b) => norm(angles[a]) - norm(angles[b]));
    const out = new Array<number>(n);
    idx.forEach((orig, k) => { out[orig] = norm(angles[idx[0]]) + k * (360 / n); });
    return out;
  }

  // 1. Sortiraj po uglu.
  const idx = angles.map((_, i) => i).sort((a, b) => norm(angles[a]) - norm(angles[b]));
  const sorted = idx.map((i) => norm(angles[i]));

  // 2. Nadji najveci procep — tu secemo krug, jer se tu sigurno nista ne gura.
  let cut = 0;
  let widest = -1;
  for (let k = 0; k < n; k++) {
    const gap = norm(sorted[(k + 1) % n] - sorted[k]);
    if (gap > widest) { widest = gap; cut = (k + 1) % n; }
  }

  // 3. Odmotaj u strogo rastuci niz.
  const seq: number[] = [];
  for (let k = 0; k < n; k++) {
    const v = sorted[(cut + k) % n];
    if (k === 0) { seq.push(v); continue; }
    let x = v;
    while (x < seq[k - 1]) x += 360;
    seq.push(x);
  }

  // 4. Relaksacija napred pa nazad — bez obmotavanja poredak ne moze da se pokvari.
  const before = [...seq];
  for (let pass = 0; pass < 50; pass++) {
    for (let k = 1; k < n; k++) {
      if (seq[k] - seq[k - 1] < minSep) seq[k] = seq[k - 1] + minSep;
    }
    for (let k = n - 2; k >= 0; k--) {
      if (seq[k + 1] - seq[k] < minSep) seq[k] = seq[k + 1] - minSep;
    }
  }

  // 5. Vrati klaster na prvobitni centar, da se grupa ne odseli u stranu.
  const shift =
    (before.reduce((a, b) => a + b, 0) - seq.reduce((a, b) => a + b, 0)) / n;

  // 6. Nazad na originalni redosled ulaza.
  const out = new Array<number>(n);
  for (let k = 0; k < n; k++) out[idx[(cut + k) % n]] = seq[k] + shift;
  return out;
}

/**
 * Crtice za stepene na unutrasnjoj ivici zodijackog prstena.
 *
 * Vraca TRI SVG putanje umesto 360 zasebnih linija. React Native SVG svaki
 * `<Line>` pravi kao zaseban nativni cvor; 360 cvorova koji se precrtavaju na
 * svako pomeranje vremena je merljiv trosak na slabijem Androidu, a putanja sa
 * 288 poteza je jedan cvor. Tri su zato sto se debljina i duzina razlikuju po
 * stepenu vaznosti, a to se ne moze menjati unutar jedne putanje.
 *
 * Crtice stoje na CELIM ekliptickim stepenima, pa se one na svakih 30°
 * poklapaju sa granicama znakova.
 *
 * `len` su duzine ka centru, racunato od `outer`.
 */
export function degreeTickPaths(
  cx: number,
  cy: number,
  ascendant: number,
  outer: number,
  len: { d1: number; d5: number; d10: number }
): { d1: string; d5: string; d10: string } {
  const parts: Record<'d1' | 'd5' | 'd10', string[]> = { d1: [], d5: [], d10: [] };

  for (let deg = 0; deg < 360; deg++) {
    const tier = deg % 10 === 0 ? 'd10' : deg % 5 === 0 ? 'd5' : 'd1';
    const angle = chartAngle(deg, ascendant);
    const a = polar(cx, cy, outer, angle);
    const b = polar(cx, cy, outer - len[tier], angle);
    parts[tier].push(
      `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`
    );
  }

  return { d1: parts.d1.join(''), d5: parts.d5.join(''), d10: parts.d10.join('') };
}

/* ------------------------------------------------------------------------- *
 * Raspored natalnog tocka.
 *
 * Stoji OVDE a ne u komponenti zato sto je to aritmetika koju treba proveriti:
 * cim se promeni velicina minuta, blok sa stepenom se siri i moze da naleti na
 * suseda ili da propadne kroz unutrasnji prsten. U komponenti bi to bio broj
 * koji niko ne testira; ovde ga drzi `check:sky`, sekcija 10.
 * ------------------------------------------------------------------------- */

/**
 * Poluprecnici, u koordinatama viewBox-a (0—360).
 *
 * Kuce idu do CENTRA (Ivan, 30.9.2026, po uzoru na klasicnu kartu): kuspide
 * prolaze kroz polje aspekata i staju na malom krugu `hub`, a brojevi kuca
 * stoje oko njega. Polje aspekata (`houseRing`) nema svoju liniju — ivicu
 * pokazuju tacke planeta iz kojih krecu aspekti.
 */
export const WHEEL_R = {
  outer: 174,      // spoljasnji krug
  zodiacIn: 144,   // unutrasnja ivica zodijackog prstena
  tick: 136,       // kraj najduze crtice za stepene
  planet: 116,     // gde stoje simboli planeta
  planetUp: 125,   // ... a gde kad se crtaju i stepeni
  number: 102,     // blok "16 48'" ispod simbola
  houseRing: 88,   // ivica polja aspekata (bez linije) — tu su tacke planeta
  houseNum: 32,    // brojevi kuca, oko malog kruga
  hub: 22,         // mali krug u sredini, tu staju kuspide
} as const;

/**
 * Velicine ispisa stepena i minuta.
 *
 * Podignute 30.9.2026 (Ivan: "malo povecaj"): simbol 17 -> 19,5, stepen 9 -> 10,
 * minut 7 -> 7,8. Blok je zato siri, pa je i `LABEL_SEP` porastao sa 14° na 15°.
 */
export const LABEL = {
  glyphSize: 19.5,
  /** Izvedene tacke (cvor, Lilit, Tacka srece) su za stepen manje od planeta. */
  glyphSizeIzv: 17,
  degSize: 10,
  degSizeIzv: 9,
  minSize: 7.8,
  minSizeIzv: 7.2,
  /** "R" uz retrogradnu planetu. */
  rSize: 7.8,
  /** Brojevi kuca oko malog kruga. */
  houseSize: 8.5,
  /** Priblizna sirina jedne cifre, u odnosu na velicinu slova. */
  digit: 0.6,
  /** Isto za minut — obican rez je uzi od podebljanog. */
  digitMin: 0.55,
  /** Razmak izmedju stepena i minuta. */
  gap: 0.6,
  /** Koliko je minut podignut iznad osnovne linije stepena. */
  rise: 4,
} as const;

/** Razmak izmedju simbola kad se crtaju stepeni, u stepenima. */
export const LABEL_SEP = 15;

/**
 * Sirina bloka "stepen + minut" u jedinicama viewBox-a, u najgorem slucaju —
 * dvocifren stepen, dvocifren minut sa apostrofom.
 *
 * Tekst je uvek vodoravan, pa se na 3 i 9 sati ova sirina trosi po istoj osi
 * po kojoj se glif odmice od bloka, a na 12 i 6 sati po osi po kojoj su
 * susedni simboli razmaknuti. Zato ulazi u obe provere ispod.
 */
export function labelBlockWidth(digits = 2): number {
  const degW = digits * LABEL.degSize * LABEL.digit;
  const minW = 3 * LABEL.minSize * LABEL.digitMin; // "48'"
  return degW + LABEL.gap + minW;
}

/** Rastojanje izmedju dva susedna bloka na poluprecniku `r`, razmaknuta `sep` stepeni. */
export function chordAt(r: number, sep: number): number {
  return 2 * r * Math.sin((sep * Math.PI) / 360);
}

/* ------------------------------------------------------------------------- *
 * Dodir na tocak (8.10.2026): sta je korisnik pogodio.
 * ------------------------------------------------------------------------- */

/** Ono sto se na tocku moze izabrati dodirom. */
export type Pogodak =
  | { tip: 'planeta'; key: string }
  | { tip: 'kuca'; broj: number }
  | { tip: 'znak'; indeks: number }
  | { tip: 'ugao'; key: 'ascendant' | 'midheaven' };

/** Isti pogodak (za `===` u izboru): isti tip i ista vrednost. */
export function istiPogodak(a: Pogodak | null, b: Pogodak | null): boolean {
  if (!a || !b || a.tip !== b.tip) return false;
  switch (a.tip) {
    case 'planeta': return a.key === (b as typeof a).key;
    case 'kuca': return a.broj === (b as typeof a).broj;
    case 'znak': return a.indeks === (b as typeof a).indeks;
    case 'ugao': return a.key === (b as typeof a).key;
  }
}

/**
 * Uglovi simbola na prstenu planeta posle razmicanja — jedno mesto za crtez i za
 * pogodak, da se dodir uvek poklopi sa onim sto se vidi. `leva` je `levaTacka`.
 */
export function ugloviSimbola(longitudes: number[], leva: number, degrees: boolean): number[] {
  const minSep = degrees ? LABEL_SEP : (longitudes.length > 11 ? 8.5 : 9.5);
  return spreadAngles(longitudes.map((l) => chartAngle(l, leva)), minSep);
}

/**
 * Isecak prstena (ili kruga, `r0` = 0) izmedju dva poluprecnika, od longitude
 * `pocetak` za `raspon` stepeni — za isticanje kuce ili znaka. Longituda raste
 * suprotno od kazaljke, pa je prvi luk `sweep = 0`, a povratni 1.
 */
export function isecakPutanja(
  cx: number, cy: number, r0: number, r1: number, pocetak: number, raspon: number, leva: number
): string {
  const a0 = chartAngle(pocetak, leva);
  const a1 = a0 + raspon;
  const f = (p: { x: number; y: number }) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  const velik = raspon > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  const unutra = r0 > 0 ? `L${f(p2)}A${r0} ${r0} 0 ${velik} 1 ${f(p3)}` : `L${f(polar(cx, cy, 0, a0))}`;
  return `M${f(p0)}A${r1} ${r1} 0 ${velik} 0 ${f(p1)}${unutra}Z`;
}

/** Unutar kog poluprecnika planeta moze da se pogodi (donja granica: ispod su kuce). */
const PLANETE_OD = WHEEL_R.houseRing + 4;
/** Koliko ugaone tolerancije ima planeta; bez stepena su simboli blize, pa je i taj prozor uzi. */
const TOLERANCIJA = { stepeni: LABEL_SEP / 2 + 0.5, bez: 5.5 };
/** Natpis ASC / MC van kruga: poluprecnik sredine i koliko daleko od nje se jos pogadja. */
const UGAO_NATPIS_R = WHEEL_R.outer + 16;
const UGAO_NATPIS_DOSEG = 17;

/**
 * Sta je pogodjeno dodirom na (`x`, `y`) — tacke unutar tocka velicine `size`.
 *
 * Redosled: natpis ugla van kruga, prsten znakova, planeta (najblizi simbol po
 * UGLU, jer su simboli razmaknuti bas po uglu), pa kuca. Prazno mesto na prstenu
 * planeta pada na kucu ispod njega; mali krug u sredini i sve van tocka su `null`.
 *
 * `kuspide` je `null` kad tocak nema kuce (nepoznato vreme rodjenja): tada nema
 * ni kuca ni uglova, a znakovi i planete rade kao i inace.
 */
export function pogodiTocak(x: number, y: number, o: {
  size: number;
  leva: number;
  planete: { key: string; ugao: number }[];
  degrees: boolean;
  kuspide: number[] | null;
  ascendant: number;
  midheaven: number;
}): Pogodak | null {
  const k = VIEW / o.size;
  const dx = x * k - OKVIR - CENTAR;
  const dy = y * k - OKVIR - CENTAR;
  const r = Math.hypot(dx, dy);
  const ugao = Math.atan2(-dy, dx) / DEG;
  const norm = (a: number) => ((a % 360) + 360) % 360;
  const lon = norm(o.leva + (ugao - 180));

  if (r > WHEEL_R.outer) {
    if (!o.kuspide) return null;
    for (const [key, l] of [['ascendant', o.ascendant], ['midheaven', o.midheaven]] as const) {
      const t = polar(CENTAR, CENTAR, UGAO_NATPIS_R, chartAngle(l, o.leva));
      if (Math.hypot(dx + CENTAR - t.x, dy + CENTAR - t.y) <= UGAO_NATPIS_DOSEG) return { tip: 'ugao', key };
    }
    return null;
  }
  if (r >= WHEEL_R.zodiacIn) return { tip: 'znak', indeks: Math.floor(lon / 30) % 12 };

  if (r >= PLANETE_OD) {
    const tol = o.degrees ? TOLERANCIJA.stepeni : TOLERANCIJA.bez;
    let naj: { key: string; razlika: number } | null = null;
    for (const p of o.planete) {
      const razlika = Math.abs(((norm(ugao) - norm(p.ugao) + 540) % 360) - 180);
      if (razlika <= tol && (!naj || razlika < naj.razlika)) naj = { key: p.key, razlika };
    }
    if (naj) return { tip: 'planeta', key: naj.key };
  }

  if (r >= WHEEL_R.hub && o.kuspide) {
    const n = o.kuspide.length;
    for (let i = 0; i < n; i++) {
      const od = o.kuspide[i];
      const raspon = norm(o.kuspide[(i + 1) % n] - od);
      if (norm(lon - od) < raspon) return { tip: 'kuca', broj: i + 1 };
    }
  }
  return null;
}

/* ------------------------------------------------------------------------- *
 * Zum kruga (8.10.2026): stezanje prstima.
 *
 * Zum je `{ s, fx, fy }`: razmera i SREDINA PRIKAZA kao razlomak velicine kruga (0..1).
 * Bez zuma je `{ 1, .5, .5 }`. Krug se crta CEO, uvecan, jednom (`tocak-zum.tsx`); zum i pomeranje
 * su samo transformacija, pa nema ponovnog crtanja. Sve ovde je cista racunica koju zove i UI nit (`'worklet'`).
 * ------------------------------------------------------------------------- */

export type Zum = { s: number; fx: number; fy: number };
export const BEZ_ZUMA: Zum = { s: 1, fx: 0.5, fy: 0.5 };
/** Najveci zum. Preko toga stepeni su vec dovoljno veliki, a nacrt pocinje da seca okvir. */
export const ZUM_MAX = 2.5;

/** Zum u granicama: razmera 1..`ZUM_MAX`, sredina tako da prikaz ne izlazi iz kruga. */
export function ogranicenZum(s: number, fx: number, fy: number): Zum {
  'worklet';
  const ss = Math.min(ZUM_MAX, Math.max(1, s));
  const lo = 0.5 / ss;
  const hi = 1 - lo;
  return { s: ss, fx: Math.min(hi, Math.max(lo, fx)), fy: Math.min(hi, Math.max(lo, fy)) };
}

/** Tacka na ekranu (u okviru kruga, pt) -> tacka na krugu BEZ zuma (pt). */
export function ekranUKrug(x: number, y: number, size: number, zum: Zum): { x: number; y: number } {
  'worklet';
  return { x: (zum.fx + (x / size - 0.5) / zum.s) * size, y: (zum.fy + (y / size - 0.5) / zum.s) * size };
}

/** Obrnuto: tacka na krugu bez zuma (pt) -> gde je na ekranu uz taj zum. */
export function krugUEkran(x: number, y: number, size: number, zum: Zum): { x: number; y: number } {
  'worklet';
  return { x: ((x / size - zum.fx) * zum.s + 0.5) * size, y: ((y / size - zum.fy) * zum.s + 0.5) * size };
}

/**
 * Zum posle pokreta: razmera se mnozi sa `g` oko tacke `f` (pt na ekranu), pa se krug pomeri za `t`.
 * Vraca NOV (ogranicen) zum i `g`/`t` koji tacno odgovaraju njemu — da se privremena transformacija
 * dok traje pokret ne razlikuje od onoga sto se na kraju upise (nema skoka kad se pusti).
 */
export function primeniPokret(
  zum: Zum, size: number, g: number, f: { x: number; y: number }, t: { x: number; y: number }
): { zum: Zum; g: number; t: { x: number; y: number } } {
  'worklet';
  const s2 = Math.min(ZUM_MAX, Math.max(1, zum.s * g));
  const u = ekranUKrug(f.x, f.y, size, zum);
  const nov = ogranicenZum(
    s2,
    u.x / size - ((f.x + t.x) / size - 0.5) / s2,
    u.y / size - ((f.y + t.y) / size - 0.5) / s2,
  );
  const gde = krugUEkran(u.x, u.y, size, nov);
  return { zum: nov, g: nov.s / zum.s, t: { x: gde.x - f.x, y: gde.y - f.y } };
}
