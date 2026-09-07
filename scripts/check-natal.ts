/** Provera natalnog engine-a. Pokreni: npx tsx scripts/check-natal.ts */
import * as Astronomy from 'astronomy-engine';
import {
  ascendant, midheaven, obliquity, rightAscensionMC,
  computeHouses, buildNatalChart, houseOf,
} from '../src/lib/natal';
import { norm360 } from '../src/lib/zodiac';
import { findTransits, findHouseTransits, daysToSolarReturn } from '../src/lib/transits';
import { spreadAngles, chartAngle } from '../src/lib/wheel';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(52)} ${detail}`);
};
const near = (a: number, b: number, tol: number, label: string, unit = '°') => {
  let d = Math.abs(a - b); if (d > 180) d = 360 - d;
  ok(d <= tol, label, `odstupanje ${d.toFixed(5)}${unit}`);
};

// Beograd, 15.6.1990. u 14:30 po lokalnom vremenu (CEST = UTC+2)
const BEOGRAD = { latitude: 44.7866, longitude: 20.4489 };
const birth = { date: new Date('1990-06-15T12:30:00Z'), ...BEOGRAD };

const eps = obliquity(birth.date);
const ramc = rightAscensionMC(birth.date, birth.longitude);
const asc = ascendant(ramc, birth.latitude, eps);
const mc = midheaven(ramc, eps);

console.log(`\nnagib ekliptike ${eps.toFixed(4)}°   RAMC ${ramc.toFixed(4)}°`);
console.log(`ASC ${asc.toFixed(4)}°   MC ${mc.toFixed(4)}°\n`);

// --- 1. ASC nezavisno: pretvori u horizontske koordinate ---
// Ako je ASC tacan, mora ležati TACNO na horizontu (visina 0) i na ISTOKU.
console.log('=== 1. Ascendent proveren kroz horizontske koordinate ===');
const time = Astronomy.MakeTime(birth.date);
const observer = new Astronomy.Observer(birth.latitude, birth.longitude, 0);
const ectToHor = (lambda: number) => {
  const v = Astronomy.VectorFromSphere(new Astronomy.Spherical(0, lambda, 1), time);
  const eqd = Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(time), v);
  const hor = Astronomy.RotateVector(Astronomy.Rotation_EQD_HOR(time, observer), eqd);
  return { alt: Astronomy.SphereFromVector(hor).lat, x: hor.x, y: hor.y };
};
const aHor = ectToHor(asc);
near(aHor.alt, 0, 0.0001, 'ASC lezi na horizontu (visina = 0)');
ok(aHor.y < 0, 'ASC je na ISTOKU (y<0, jer je +y zapad)', `y=${aHor.y.toFixed(4)}`);
const dHor = ectToHor(norm360(asc + 180));
near(dHor.alt, 0, 0.0001, 'Descendent lezi na horizontu');
ok(dHor.y > 0, 'Descendent je na ZAPADU', `y=${dHor.y.toFixed(4)}`);

// --- 2. MC nezavisno: njegova rektascenzija mora biti RAMC ---
console.log('\n=== 2. MC proveren kroz rektascenziju ===');
const vMc = Astronomy.VectorFromSphere(new Astronomy.Spherical(0, mc, 1), time);
const eqdMc = Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(time), vMc);
near(norm360(Astronomy.EquatorFromVector(eqdMc).ra * 15), ramc, 0.0001, 'RA(MC) = RAMC');
const mHor = ectToHor(mc);
near(mHor.y, 0, 0.0001, 'MC je na meridijanu (y = 0)', '');

// --- 3. Placidus na ekvatoru ---
// PAZNJA: na ekvatoru su jednako razmaknute REKTASCENZIJE kuspida (po 30°),
// a NE njihove ekliptičke longitude — konverzija RA -> longituda je nelinearna
// i unosi do ~2.5° razlike pri nagibu ekliptike od 23.44°.
console.log('\n=== 3. Placidus na ekvatoru: rektascenzije na tacno 30° ===');
const eq = computeHouses({ date: birth.date, latitude: 0, longitude: birth.longitude }, 'placidus');
const raOf = (lambda: number) => {
  const v = Astronomy.VectorFromSphere(new Astronomy.Spherical(0, lambda, 1), time);
  return norm360(Astronomy.EquatorFromVector(Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(time), v)).ra * 15);
};
let maxDev = 0, maxDevLon = 0;
for (let i = 0; i < 12; i++) {
  const dRa = Math.abs(norm360(raOf(eq.cusps[(i + 1) % 12]) - raOf(eq.cusps[i])) - 30);
  maxDev = Math.max(maxDev, dRa);
  maxDevLon = Math.max(maxDevLon, Math.abs(norm360(eq.cusps[(i + 1) % 12] - eq.cusps[i]) - 30));
}
ok(maxDev < 0.0001, 'svih 12 razmaka po rektascenziji = 30°', `najvece odstupanje ${maxDev.toFixed(6)}°`);
ok(maxDevLon > 1 && maxDevLon < 3, 'longitude NISU jednake (ocekivano, nagib ekliptike)', `razlika ${maxDevLon.toFixed(3)}°`);

// --- 4. Placidus definicija: kuspida deli svoj poludnevni luk u trecinama ---
console.log('\n=== 4. Placidus zadovoljava svoju definiciju ===');
const h = computeHouses(birth, 'placidus');
ok(h.system === 'placidus', 'Placidus izracunat za Beograd');
const checkArc = (cusp: number, n: number, above: boolean, label: string) => {
  const decl = Math.asin(Math.sin(eps * Math.PI / 180) * Math.sin(cusp * Math.PI / 180)) * 180 / Math.PI;
  const ad = Math.asin(Math.tan(birth.latitude * Math.PI / 180) * Math.tan(decl * Math.PI / 180)) * 180 / Math.PI;
  const v = Astronomy.VectorFromSphere(new Astronomy.Spherical(0, cusp, 1), time);
  const ra = norm360(Astronomy.EquatorFromVector(Astronomy.RotateVector(Astronomy.Rotation_ECT_EQD(time), v)).ra * 15);
  const expected = above ? (n / 3) * (90 + ad) : 180 - (n / 3) * (90 - ad);
  near(norm360(ra - ramc), norm360(expected), 0.0001, label);
};
checkArc(h.cusps[10], 1, true, '11. kuca = 1/3 poludnevnog luka od MC');
checkArc(h.cusps[11], 2, true, '12. kuca = 2/3 poludnevnog luka od MC');
checkArc(h.cusps[1], 2, false, '2. kuca = 2/3 polunocnog luka');
checkArc(h.cusps[2], 1, false, '3. kuca = 1/3 polunocnog luka');

// --- 5. Struktura kuspida ---
console.log('\n=== 5. Struktura ===');
near(h.cusps[0], asc, 1e-9, '1. kuca = ascendent');
near(h.cusps[9], mc, 1e-9, '10. kuca = MC');
near(h.cusps[6], norm360(asc + 180), 1e-9, '7. kuca = descendent');
let mono = true;
for (let i = 0; i < 12; i++) {
  const span = norm360(h.cusps[(i + 1) % 12] - h.cusps[i]);
  if (span <= 0 || span >= 180) mono = false;
}
ok(mono, 'kuspide idu redom oko kruga, nijedna se ne preklapa');
ok(houseOf(asc + 0.001, h) === 1, 'tacka odmah iza ASC je u 1. kuci');
ok(houseOf(mc + 0.001, h) === 10, 'tacka odmah iza MC je u 10. kuci');

// --- 6. Polarna sirina: Placidus mora pasti na Whole Sign ---
console.log('\n=== 6. Polarni slucaj ===');
const polar = computeHouses({ date: birth.date, latitude: 78, longitude: 15 }, 'placidus');
ok(polar.fellBack && polar.system === 'whole-sign', 'na 78°N pada na Whole Sign umesto da pukne');

// --- 7. Cela karta ---
console.log('\n=== 7. Natalna karta — Beograd, 15.6.1990. 14:30 ===');
const chart = buildNatalChart(birth);
console.log(`  ASC ${chart.ascendantSign.formatted}      MC ${chart.midheavenSign.formatted}`);
console.log(`  sistem kuca: ${chart.houses.system}`);
for (const p of chart.planets) {
  console.log(`  ${p.glyph} ${p.name.padEnd(8)} ${p.position.formatted.padEnd(20)} ${String(p.house).padStart(2)}. kuca ${p.retrograde ? ' R' : ''}`);
}
ok(chart.planets.every((p) => p.house >= 1 && p.house <= 12), 'sve planete su smestene u kucu 1—12');

// --- 8. Tranziti na natalnu kartu ---
console.log('\n=== 8. Tranziti danas na ovu kartu ===');
const transits = findTransits(chart);
const houseTransits = findHouseTransits(chart);
ok(transits.every((t) => t.orb <= 3), 'sve orbite tranzita <= 3°');
ok(transits.every((t) => /^transit\.[a-z]+\.[a-z]+\.natal\.[a-z]+$/.test(t.contentKey)), 'contentKey ima ispravan format');
ok(houseTransits.every((t) => t.house >= 1 && t.house <= 12), 'sve tranzitne planete su u kuci 1—12');
const srd = daysToSolarReturn(chart);
ok(srd >= 0 && srd <= 366, 'solarni povratak u opsegu 0—366 dana', `za ${srd} dana`);

console.log('\n  najjaci tranziti:');
for (const t of transits.slice(0, 6)) {
  console.log(`   ${t.transiting.glyph}${t.aspect.glyph}${t.natal.glyph}  ${(t.transiting.name + ' ' + t.aspect.name + ' natalni ' + t.natal.name).padEnd(42)} orb ${t.orb.toFixed(2)}°  ${t.score.toFixed(2)}  ${t.applying ? 'jaca' : 'slabi'}`);
  console.log(`        ${t.contentKey}`);
}
console.log('\n  planete kroz natalne kuce:');
for (const t of houseTransits.slice(0, 4)) {
  console.log(`   ${t.transiting.glyph} ${t.transiting.name.padEnd(8)} -> ${t.house}. kuca   ${t.contentKey}`);
}

// --- 9. Razmicanje simbola na tocku ---
// Planete u istom stepenu bi se preklopile; spreadAngles ih gura razdvojeno.
console.log('\n=== 9. Razmicanje simbola planeta na tocku ===');
const minGap = (a: number[]) => {
  const sorted = [...a].sort((x, y) => x - y);
  let m = 360;
  for (let i = 0; i < sorted.length; i++) {
    let g = sorted[(i + 1) % sorted.length] - sorted[i];
    while (g < 0) g += 360;
    m = Math.min(m, g);
  }
  return m;
};
const MIN = 9.5;
const scenarios: [string, number[]][] = [
  ['tri planete u istom stepenu', [100, 100, 100]],
  ['stelijum od pet', [10, 11, 12, 13, 14]],
  ['prelaz preko 0°', [358, 359, 0, 1, 2]],
  ['stvarna karta', chart.planets.map((p) => 180 + (p.longitude - chart.houses.ascendant))],
];
for (const [label, input] of scenarios) {
  const out = spreadAngles(input, MIN);
  const g = minGap(out);
  ok(g >= MIN - 0.01, label, `najmanji razmak ${g.toFixed(2)}° (traženo ${MIN}°)`);
}
// Poredak mora ostati isti — inace bi simboli "preskakali" jedan preko drugog.
const inp = [40, 42, 44, 200, 201];
const outp = spreadAngles(inp, MIN);
const rank = (a: number[]) => a.map((_, i) => i).sort((x, y) => a[x] - a[y]).join(',');
ok(rank(inp) === rank(outp), 'poredak planeta po uglu je ocuvan');
ok(spreadAngles([], MIN).length === 0 && spreadAngles([5], MIN)[0] === 5, 'prazan ulaz i jedna planeta ne pucaju');

// Orijentacija tocka: ascendent levo, longituda raste suprotno od kazaljke.
const A = chart.houses.ascendant;
near(chartAngle(A, A), 180, 1e-9, 'ASC je na 180° (leva strana tocka)');
near(chartAngle(A + 90, A), 270, 1e-9, 'ASC+90° je na dnu (IC, 4. kuca)');
near(chartAngle(A + 180, A), 360, 1e-9, 'descendent je desno');

console.log(`\n${fail === 0 ? 'SVE PROSLO' : fail + ' TESTOVA PALO'}\n`);
process.exit(fail === 0 ? 0 : 1);
