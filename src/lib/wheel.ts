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
