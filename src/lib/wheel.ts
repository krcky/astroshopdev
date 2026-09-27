/**
 * Geometrija natalnog tocka — cista matematika, bez React Native uvoza,
 * da bi mogla da se testira u obicnom Node-u.
 */

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

/** Poluprecnici, u koordinatama viewBox-a (0—360). */
export const WHEEL_R = {
  outer: 174,      // spoljasnji krug
  zodiacIn: 144,   // unutrasnja ivica zodijackog prstena
  tick: 136,       // kraj najduze crtice za stepene
  planet: 116,     // gde stoje simboli planeta
  planetUp: 125,   // ... a gde kad se crtaju i stepeni
  number: 102,     // blok "16 48'" ispod simbola
  houseRing: 88,   // unutrasnji krug, granica polja aspekata
  houseNum: 97,    // brojevi kuca
  houseNumIn: 77,  // ... kad se crtaju stepeni, da ne udju u blok
} as const;

/** Velicine ispisa stepena i minuta. */
export const LABEL = {
  glyphSize: 17,
  degSize: 9,
  degSizeIzv: 8,
  minSize: 7,
  minSizeIzv: 6.5,
  /** Priblizna sirina jedne cifre, u odnosu na velicinu slova. */
  digit: 0.6,
  /** Isto za minut — obican rez je uzi od podebljanog. */
  digitMin: 0.55,
  /** Razmak izmedju stepena i minuta. */
  gap: 0.6,
  /** Koliko je minut podignut iznad osnovne linije stepena. */
  rise: 3.6,
} as const;

/** Razmak izmedju simbola kad se crtaju stepeni, u stepenima. */
export const LABEL_SEP = 14;

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
