/**
 * Provere avatara profila (znak Sunca + podznak u malom krugu). Pokreni: npm run check:avatar
 *
 * Znak se centrira po stvarnim granicama putanje, pa se ovde proverava racun granica
 * (na krivama sa poznatim ekstremom) i da svih 12 znakova staje u svoj krug.
 */
import { SIGNS } from '../src/lib/zodiac';
import { ZNAK_CENTAR, ZNAK_OBLIK } from '../src/lib/znak-oblici';
import {
  PODZNAK_U_KRUGU, ZNAK_U_KRUGU, granicePutanje, postavkaZnaka, rasporedAvatara, znakAvatar,
} from '../src/lib/znak-avatar';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};
const blizu = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol;

console.log('\n=== 1. Granice putanje ===');
{
  const pravougaonik = granicePutanje('M2 3L12 3V8H2Z');
  ok(
    blizu(pravougaonik.minX, 2) && blizu(pravougaonik.maxX, 12) && blizu(pravougaonik.minY, 3) && blizu(pravougaonik.maxY, 8),
    'M L V H Z: pravougaonik 2..12 x 3..8',
  );
  // Kriva (0,0) (0,10) (10,10) (10,0): najvisa tacka je na t = 0,5, y = 7,5 — ne kontrolna tacka (10).
  const kriva = granicePutanje('M0 0C0 10 10 10 10 0');
  ok(blizu(kriva.maxY, 7.5), 'kriva: vrh na 7,5, ne na kontrolnoj tacki 10', kriva.maxY.toFixed(3));
  ok(blizu(kriva.minX, 0) && blizu(kriva.maxX, 10), 'kriva: 0..10 po X');
  let bacio = false;
  try { granicePutanje('M0 0Q5 5 10 0'); } catch { bacio = true; }
  ok(bacio, 'naredba koju racun ne zna baca izuzetak (ne centrira tiho pogresno)');
}

console.log('\n=== 2. Svih 12 znakova ===');
{
  ok(SIGNS.every((s) => ZNAK_OBLIK[s.key]), 'svaki znak iz SIGNS ima oblik');
  let najveciPomak = 0;
  let najveci = '';
  for (const s of SIGNS) {
    const z = znakAvatar(s.key);
    const g = granicePutanje(ZNAK_OBLIK[s.key].d);
    ok(z.duzina > 30 && z.duzina < 70, `${s.key}: najduza strana je razumna`, z.duzina.toFixed(1));
    // Koliko je znak u Ivanovom fajlu van sredine kruga — zbog ovoga se centrira ovde.
    const pomak = Math.hypot(z.cx - ZNAK_CENTAR, z.cy - ZNAK_CENTAR);
    if (pomak > najveciPomak) { najveciPomak = pomak; najveci = s.key; }

    const raspored = rasporedAvatara(100);
    for (const [ime, krug, udeo] of [['sunce', raspored.sunce, ZNAK_U_KRUGU], ['podznak', raspored.podznak, PODZNAK_U_KRUGU]] as const) {
      const p = postavkaZnaka(s.key, krug, udeo);
      // Pomeren znak: sredina bbox-a pada TACNO u sredinu kruga, a ugao bbox-a ne izlazi iz kruga.
      const sx = p.translateX + p.razmera * (g.minX - z.cx);
      const ex = p.translateX + p.razmera * (g.maxX - z.cx);
      const sy = p.translateY + p.razmera * (g.minY - z.cy);
      const ey = p.translateY + p.razmera * (g.maxY - z.cy);
      const sredinaOk = blizu((sx + ex) / 2, krug.cx, 0.01) && blizu((sy + ey) / 2, krug.cy, 0.01);
      const ugao = Math.max(...[[sx, sy], [ex, sy], [sx, ey], [ex, ey]].map(([a, b]) => Math.hypot(a - krug.cx, b - krug.cy)));
      ok(sredinaOk && ugao <= krug.r * 0.9, `${s.key} / ${ime}: centriran i u krugu`, `ugao ${(ugao / krug.r).toFixed(2)} r`);
    }
  }
  console.log(`      najvece odstupanje znaka od sredine kruga u fajlu: ${najveci} ${najveciPomak.toFixed(2)} od 118`);
}

console.log('\n=== 3. Raspored ===');
{
  const r = rasporedAvatara(40);
  ok(blizu(r.sunce.cx, 20) && blizu(r.sunce.cy, 20), 'veliki krug je tacno u sredini kvadrata');
  ok(r.podznak.cx + r.podznak.r <= 40.001 && r.podznak.cy + r.podznak.r <= 40.001, 'mali krug ne izlazi iz kvadrata (nativna stavka isece van okvira)');
  const razmak = Math.hypot(r.podznak.cx - r.sunce.cx, r.podznak.cy - r.sunce.cy);
  ok(razmak < r.sunce.r + r.podznak.r, 'krugovi se preklapaju (cine jedan avatar)', razmak.toFixed(1));
  ok(r.podznak.cx > r.sunce.cx && r.podznak.cy > r.sunce.cy, 'mali krug je dole desno');
}

console.log(fail ? `\n${fail} NIJE PROSLO` : '\nSve prolazi');
process.exit(fail ? 1 : 0);
