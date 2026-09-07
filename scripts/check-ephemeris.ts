/** Provera ispravnosti ephemeris sloja. Pokreni: npx tsx scripts/check-ephemeris.ts */
import * as Astronomy from 'astronomy-engine';
import { planetPositions, findAspects, moonPhase } from '../src/lib/astro';
import { signFromLongitude } from '../src/lib/zodiac';

let failures = 0;
function assert(label: string, actual: number, expected: number, tolDeg: number) {
  let d = Math.abs(actual - expected);
  if (d > 180) d = 360 - d;
  const ok = d <= tolDeg;
  if (!ok) failures++;
  const arcmin = (d * 60).toFixed(2);
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${label.padEnd(46)} odstupanje ${arcmin}'`);
}

function sunLon(date: Date) {
  return planetPositions(date).find((p) => p.key === 'sun')!.longitude;
}

console.log('\n=== 1. Kardinalne tacke: Sunce mora biti na 0/90/180/270 ===');
const seasons = Astronomy.Seasons(2026);
assert('prolecna ravnodnevica -> 0 Ovan',   sunLon(seasons.mar_equinox.date), 0,   0.02);
assert('letnji solsticij -> 0 Rak (90)',    sunLon(seasons.jun_solstice.date), 90,  0.02);
assert('jesenja ravnodnevica -> 0 Vaga',    sunLon(seasons.sep_equinox.date), 180, 0.02);
assert('zimski solsticij -> 0 Jarac (270)', sunLon(seasons.dec_solstice.date), 270, 0.02);

console.log('\n=== 2. Pun Mesec: Sunce i Mesec tacno u opoziciji ===');
const fullMoon = Astronomy.SearchMoonPhase(180, new Date('2026-09-01'), 40)!;
const fm = planetPositions(fullMoon.date);
const s = fm.find((p) => p.key === 'sun')!.longitude;
const m = fm.find((p) => p.key === 'moon')!.longitude;
let sep = (m - s + 360) % 360;
if (sep > 180) sep = 360 - sep;
assert('separacija Sunce-Mesec = 180', sep, 180, 0.02);

console.log('\n=== 3. Retrogradnost: Merkur mora biti retrogradan u poznatom periodu ===');
const mercRetro = Astronomy.SearchRelativeLongitude(Astronomy.Body.Mercury, 0, new Date('2026-01-01'));
const atRetro = planetPositions(mercRetro.date).find((p) => p.key === 'mercury')!;
console.log(`${atRetro.retrograde ? 'OK  ' : 'FAIL'}  Merkur na donjoj konjunkciji retrogradan  (brzina ${atRetro.speed.toFixed(3)} st/dan)`);
if (!atRetro.retrograde) failures++;

console.log('\n=== 4. Znak iz longitude ===');
const cases: [number, string][] = [[0,'Ovan'],[29.9,'Ovan'],[30,'Bik'],[125,'Lav'],[359.9,'Ribe']];
for (const [lon, want] of cases) {
  const got = signFromLongitude(lon).sign.name;
  const ok = got === want;
  if (!ok) failures++;
  console.log(`${ok ? 'OK  ' : 'FAIL'}  ${String(lon).padEnd(6)} -> ${got.padEnd(10)} (ocekivano ${want})`);
}

console.log('\n=== 5. Nebo danas ===');
const today = new Date();
console.log(`Datum: ${today.toISOString().slice(0, 10)}   Faza: ${moonPhase(today).name}`);
for (const p of planetPositions(today)) {
  console.log(`  ${p.glyph} ${p.name.padEnd(8)} ${p.position.formatted.padEnd(18)} ${p.retrograde ? 'R' : ' '}  ${p.speed >= 0 ? ' ' : ''}${p.speed.toFixed(3)} st/dan`);
}

console.log('\n=== 6. Aspekti danas (top 5) ===');
for (const a of findAspects(planetPositions(today)).slice(0, 5)) {
  console.log(`  ${a.a.glyph}${a.aspect.glyph}${a.b.glyph}  ${(a.a.name + ' ' + a.aspect.name + ' ' + a.b.name).padEnd(34)} orb ${a.orb.toFixed(2)}°  score ${a.score.toFixed(2)}  ${a.applying ? 'jaca' : 'slabi'}   key=${a.contentKey}`);
}

console.log(`\n${failures === 0 ? 'SVE PROSLO' : failures + ' TESTOVA PALO'}\n`);
process.exit(failures === 0 ? 0 : 1);
