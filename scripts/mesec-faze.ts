/**
 * Pravi 30 slika Meseca (po jednu za lunarni dan) iz JEDNE slike punog Meseca.
 *
 *   npx tsx scripts/mesec-faze.ts [izvor.png]
 *
 * Izvor: `files/mesec@2x.png`. Izlaz: `assets/images/mesec/mesec-01.png` ... `-30.png`,
 * iseceni na disk (disk ispunjava kvadrat). Senka se racuna kao kugla osvetljena
 * Suncem pod uglom faze, pa osvetljeni deo odgovara procentu (1 - cos D) / 2.
 * Uglovi su isti kao u `MESEC_SLIKA_UGLOVI` (lib/moon.ts), koji bira sliku.
 * Podesavanja: tamni deo 35%, mekoca 0,2 (Ivan, 28.9.2026, izabrano na pregledu).
 * Posle ove skripte: `npm run slike` (pravilo 24), inace `check:slike` pada.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
// @ts-ignore -- pngjs je tranzitivna zavisnost (Expo) i nema tipove
import { PNG } from 'pngjs';
import { MESEC_SLIKA_UGLOVI } from '../src/lib/moon';

const SENKA = 0.35;
const MEKOCA = 0.2;

const izvor = process.argv[2] ?? 'files/mesec@2x.png';
const izlaz = 'assets/images/mesec';
const src = PNG.sync.read(fs.readFileSync(izvor));

// Disk iz providnosti.
let x0 = src.width, y0 = src.height, x1 = 0, y1 = 0;
for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
  if (src.data[(y * src.width + x) * 4 + 3] > 40) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
}
const strana = Math.max(x1 - x0 + 1, y1 - y0 + 1);
const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, r = strana / 2;
const ox = Math.round(cx - r), oy = Math.round(cy - r);

fs.mkdirSync(izlaz, { recursive: true });
MESEC_SLIKA_UGLOVI.forEach((ugao, i) => {
  const a = (ugao * Math.PI) / 180;
  const sx = Math.sin(a), sz = -Math.cos(a);
  const out = new PNG({ width: strana, height: strana });
  for (let y = 0; y < strana; y++) for (let x = 0; x < strana; x++) {
    const o = (y * strana + x) * 4;
    const X = x + ox, Y = y + oy;
    if (X < 0 || Y < 0 || X >= src.width || Y >= src.height) { out.data[o + 3] = 0; continue; }
    const s = (Y * src.width + X) * 4;
    const nx = (X + 0.5 - cx) / r, ny = (Y + 0.5 - cy) / r;
    const nz = Math.sqrt(Math.max(0, 1 - Math.min(nx * nx + ny * ny, 1)));
    let t = Math.min(1, Math.max(0, (nx * sx + nz * sz + MEKOCA) / (2 * MEKOCA)));
    t = t * t * (3 - 2 * t);
    const k = SENKA + (1 - SENKA) * t;
    out.data[o] = src.data[s] * k;
    out.data[o + 1] = src.data[s + 1] * k;
    out.data[o + 2] = src.data[s + 2] * k;
    out.data[o + 3] = src.data[s + 3];
  }
  const ime = `mesec-${String(i + 1).padStart(2, '0')}.png`;
  fs.writeFileSync(path.join(izlaz, ime), PNG.sync.write(out));
});
console.log(`${MESEC_SLIKA_UGLOVI.length} slika, ${strana}x${strana} px -> ${izlaz}/`);
