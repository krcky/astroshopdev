/** Provera natalnog engine-a. Pokreni: npx tsx scripts/check-natal.ts */
import * as Astronomy from 'astronomy-engine';
import {
  ascendant, midheaven, obliquity, rightAscensionMC,
  computeHouses, buildNatalChart, houseOf,
} from '../src/lib/natal';
import { norm360, SIGNS, SIGN_CASES } from '../src/lib/zodiac';
const SIGNS_IDX = (key: string) => SIGNS.findIndex((s) => s.key === key);
import { bodyLongitude } from '../src/lib/astro';
import { upcomingSkyEvents, wholeSignHouse } from '../src/lib/sky-events';
import { moonState, moonLitPath, formatIllumination, PLANT_PART, moonSignAt } from '../src/lib/moon';
import {
  findTransits, findHouseTransits, daysToSolarReturn,
  pickHero, pickHeroFrom, heroRulers, localMidnight, dayKey, daysBetween,
  STRONG_ORB, HERO_PAUSE_DAYS, PEAK_ORB, briefBucket, pickBrief, splitBySpeed, transitEnd, moonDay, type Transit,
} from '../src/lib/transits';
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
// --- 9. Tranzit dana: waterfall prioriteta ---
console.log('\n=== 9. Tranzit dana (waterfall) ===');
{
  const t0 = transits[0];
  const ok0 = Boolean(t0);
  ok(ok0, 'postoji bar jedan tranzit za sintetiku', ok0 ? '' : 'preskacem waterfall testove');
  if (t0) {
    // Sinteticki tranzit: kopija stvarnog sa promenjenom metom, orbisom i brzinom.
    const mk = (natal: string, orb: number, speed = 1, transiting = 'mars'): Transit => ({
      ...t0,
      orb,
      transiting: { ...t0.transiting, key: transiting as any, speed },
      natal: { ...t0.natal, key: natal, name: natal },
      contentKey: `transit.${transiting}.x.natal.${natal}`,
    });
    const vladari = [{ key: 'mars', reason: 'vladar Ascendenta (Ovan) je Mars' }];

    // P1 pobedjuje P2 iako je P2 egzaktniji.
    let h = pickHeroFrom([mk('sun', 0.1), mk('mars', 1.2)], vladari);
    ok(h.priority === 1 && h.transit?.natal.key === 'mars', 'P1: vladar sa jakim aspektom pobedjuje egzaktnije Sunce');
    ok(h.priority === 1 && h.reason.includes('Mars'), 'P1: razlog imenuje vladara');

    // Vladar slabog aspekta (orb > 1,5) NE okida P1 -> pada na P2.
    h = pickHeroFrom([mk('sun', 2.0), mk('mars', STRONG_ORB + 0.01)], vladari);
    ok(h.priority === 2 && h.transit?.natal.key === 'sun', 'P1 trazi orb <= 1,5°; inace P2');

    // P2: medju kljucnim tackama pobedjuje najmanji orbis, ne skor.
    h = pickHeroFrom([mk('ascendant', 2.5), mk('moon', 0.4), mk('venus', 0.0)], vladari);
    ok(h.priority === 2 && h.transit?.natal.key === 'moon', 'P2: najegzaktnija kljucna tacka, pre bilo koje planete');

    // P3: nema vladara ni kljucnih tacaka -> najmanji orbis.
    h = pickHeroFrom([mk('venus', 1.0), mk('jupiter', 0.3)], vladari);
    ok(h.priority === 3 && h.transit?.natal.key === 'jupiter', 'P3: najegzaktniji licni tranzit');

    // Izjednacenje: sporija tranzitna planeta.
    h = pickHeroFrom([mk('venus', 0.5, 1.2), mk('jupiter', 0.5, 0.08)], vladari);
    ok(h.transit?.natal.key === 'jupiter', 'izjednacen orbis: pobedjuje sporija planeta');

    // Nepoznato vreme: ASC i MC otpadaju iz svih prioriteta.
    h = pickHeroFrom([mk('ascendant', 0.0), mk('midheaven', 0.1), mk('venus', 2.0)], vladari, true);
    ok(h.priority === 3 && h.transit?.natal.key === 'venus', 'timeUnknown: ASC i MC se ne uzimaju');

    // P4: prazno.
    h = pickHeroFrom([], vladari);
    ok(h.priority === 4 && h.transit === null, 'P4: bez tranzita -> Hero-a nema');

    // Mesec ne ulazi u Hero, ni kad je tacno na vladaru.
    h = pickHeroFrom([mk('mars', 0.0, 13, 'moon'), mk('venus', 1.0)], vladari);
    ok(h.transit?.transiting.key !== 'moon' && h.transit?.natal.key === 'venus', 'Mesec kao tranzitna planeta se preskace');
    h = pickHeroFrom([mk('mars', 0.0, 13, 'moon')], vladari);
    ok(h.priority === 4, 'samo Mesecevi tranziti -> Hero-a nema');

    // Pauza od 7 dana.
    const danas = new Date(2026, 8, 26);
    const pre = (n: number) => dayKey(new Date(2026, 8, 26 - n));
    const lista = [mk('mars', 1.0, 0.7, 'saturn'), mk('sun', 0.5, 1, 'venus'), mk('jupiter', 0.4, 1.2, 'mercury')];
    h = pickHeroFrom(lista, vladari, false, {}, danas);
    ok(h.transit?.contentKey === 'transit.saturn.x.natal.mars', 'bez dnevnika: P1 vladar');
    h = pickHeroFrom(lista, vladari, false, { 'transit.saturn.x.natal.mars': pre(1) }, danas);
    ok(h.priority === 2 && h.transit?.contentKey === 'transit.venus.x.natal.sun', 'prikazan juce -> na pauzi, pusta P2');
    h = pickHeroFrom(lista, vladari, false, { 'transit.saturn.x.natal.mars': pre(HERO_PAUSE_DAYS) }, danas);
    ok(h.priority === 2, `prikazan pre ${HERO_PAUSE_DAYS} dana -> jos na pauzi`);
    h = pickHeroFrom(lista, vladari, false, { 'transit.saturn.x.natal.mars': pre(HERO_PAUSE_DAYS + 1) }, danas);
    ok(h.priority === 1, `prikazan pre ${HERO_PAUSE_DAYS + 1} dana -> sme ponovo`);
    h = pickHeroFrom(lista, vladari, false, { 'transit.saturn.x.natal.mars': pre(0) }, danas);
    ok(h.priority === 1, 'prikazan DANAS -> ostaje isti ceo dan');
    const vrh = [mk('mars', PEAK_ORB - 0.05, 0.7, 'saturn'), mk('sun', 0.5, 1, 'venus')];
    h = pickHeroFrom(vrh, vladari, false, { 'transit.saturn.x.natal.mars': pre(2) }, danas);
    ok(h.priority === 1, 'vrhunac (orb < 0,3) probija pauzu');
    const svePauza = { 'transit.saturn.x.natal.mars': pre(1), 'transit.venus.x.natal.sun': pre(3), 'transit.mercury.x.natal.jupiter': pre(5) };
    h = pickHeroFrom(lista, vladari, false, svePauza, danas);
    ok(h.priority === 4, 'sve na pauzi -> Hero-a nema');
    ok(daysBetween(pre(3), danas) === 3 && daysBetween(dayKey(danas), new Date(2026, 8, 26, 23, 59)) === 0, 'daysBetween racuna po lokalnim ponocima');
  }

  // Vladari iz stvarne karte.
  const r = heroRulers(chart);
  ok(r.length >= 1 && r.length <= 2 && r.every((x) => /^[a-z]+$/.test(x.key)), 'vladari ASC i Sunca imaju kljuc planete', r.map((x) => x.reason).join('; '));
  ok(heroRulers(chart, true).length === 1 && heroRulers(chart, true)[0].reason.startsWith('vladar Sunca'), 'timeUnknown: samo vladar Sunca');

  // Ponoc i stabilnost tokom dana.
  const podne = new Date(2026, 8, 26, 12, 0);
  ok(localMidnight(podne).getHours() === 0 && localMidnight(podne).getDate() === 26, 'localMidnight daje 00:00 istog dana');
  const a = pickHero(chart, new Date(2026, 8, 26, 8, 0));
  const b = pickHero(chart, new Date(2026, 8, 26, 23, 0));
  ok(a.priority === b.priority && a.transit?.contentKey === b.transit?.contentKey, 'isti Hero ujutru i uvece istog dana');
  const danas = pickHero(chart);
  console.log(`  danas: P${danas.priority}  ${danas.transit ? danas.transit.contentKey : 'faza Meseca'}  (${danas.reason})`);
}

// --- 9b. Danas ukratko ---
console.log('\n=== 9b. Danas ukratko (ide ti / koci te) ===');
{
  const t0 = transits[0];
  if (t0) {
    const asp = (key: string) => ({ ...t0.aspect, key });
    const mk = (transiting: string, aspect: string, natal: string, orb: number): Transit => ({
      ...t0, orb,
      transiting: { ...t0.transiting, key: transiting as any, speed: 1 },
      aspect: asp(aspect),
      natal: { ...t0.natal, key: natal, name: natal },
      contentKey: `transit.${transiting}.${aspect}.natal.${natal}`,
    });
    ok(briefBucket(mk('mars', 'trine', 'sun', 1)) === 'ide', 'trigon -> ide ti');
    ok(briefBucket(mk('venus', 'sextile', 'sun', 1)) === 'ide', 'sekstil -> ide ti');
    ok(briefBucket(mk('venus', 'square', 'sun', 1)) === 'koci', 'kvadrat -> koci te, i kad je Venera');
    ok(briefBucket(mk('jupiter', 'opposition', 'sun', 1)) === 'koci', 'opozicija -> koci te');
    ok(briefBucket(mk('venus', 'conjunction', 'sun', 1)) === 'ide', 'konjunkcija Venere -> ide ti');
    ok(briefBucket(mk('saturn', 'conjunction', 'sun', 1)) === 'koci', 'konjunkcija Saturna -> koci te');

    const lista = [
      mk('saturn', 'square', 'moon', 0.5),     // hero, mora ispasti
      mk('moon', 'trine', 'sun', 0.1),         // Mesec, mora ispasti
      mk('venus', 'trine', 'mars', 1.2),
      mk('jupiter', 'sextile', 'venus', 0.3),
      mk('mars', 'opposition', 'mercury', 0.9),
      mk('uranus', 'conjunction', 'jupiter', 2.0),
      ...[1, 2, 3, 4, 5, 6].map((i) => mk('sun', 'trine', `p${i}`, 2 + i * 0.1)),
    ];
    const b = pickBrief(lista, 'transit.saturn.square.natal.moon');
    ok(!b.koci.some((t) => t.contentKey === 'transit.saturn.square.natal.moon'), 'Hero se ne ponavlja u sazetku');
    ok(![...b.ide, ...b.koci].some((t) => t.transiting.key === 'moon'), 'Mesec ne ulazi u sazetak');
    ok(b.ide[0]?.natal.key === 'venus' && b.ide[1]?.natal.key === 'mars', 'ide ti: po orbisu (Jupiter 0,3 pre Venere 1,2)');
    ok(b.koci[0]?.natal.key === 'mercury' && b.koci[1]?.natal.key === 'jupiter', 'koci te: po orbisu');
    ok(b.ide.length === 8, 'nema ogranicenja po grupi — ekran bira prva tri sa tekstom', `ide=${b.ide.length}`);
  }
}

// --- 9c. Brzi i spori ---
{
  const sp = splitBySpeed(transits);
  const FAST = ['moon', 'sun', 'mercury', 'venus', 'mars'];
  ok(sp.fast.every((t) => FAST.includes(t.transiting.key)) && sp.slow.every((t) => !FAST.includes(t.transiting.key)), 'brzi/spori: podela po tranzitnoj planeti');
  ok(sp.fast.length + sp.slow.length === transits.length, 'brzi + spori = svi tranziti');
  const rastuce = (l: Transit[]) => l.every((t, i) => i === 0 || l[i - 1].orb <= t.orb);
  ok(rastuce(sp.fast) && rastuce(sp.slow), 'unutar grupe redosled po orbisu');
}

// --- 9d. Dokle tranzit traje ---
console.log('\n=== 9d. Dokle spori tranzit traje ===');
{
  const sp = splitBySpeed(transits);
  const danas = new Date();
  const t0 = performance.now();
  const krajevi = sp.slow.map((t) => ({ t, end: transitEnd(t, danas) }));
  const ms = performance.now() - t0;
  ok(ms < 1500, `kraj za ${sp.slow.length} sporih izracunat brzo`, `${ms.toFixed(0)} ms`);
  for (const { t, end } of krajevi) {
    const ime = `${t.transiting.name} ${t.aspect.name} ${t.natal.name}`.padEnd(30);
    if (!end) { console.log(`   ${ime} traje jos godinama`); continue; }
    // Dan posle kraja mora biti van orbisa, a sam kraj unutra: proveri ponovnim racunom.
    const posle = new Date(end); posle.setDate(end.getDate() + 1);
    const orbNa = (d: Date) => {
      const lon = findTransits(chart, d).find((x) => x.contentKey === t.contentKey);
      return lon ? lon.orb : Infinity;
    };
    ok(orbNa(end) !== Infinity && orbNa(posle) === Infinity, `${ime.trim()}: kraj je tacan dan`, `do ${end.toLocaleDateString('sr-RS')}`);
  }
  const brzi = sp.fast[0];
  if (brzi) {
    const end = transitEnd(brzi, danas);
    ok(end !== null && (end.getTime() - danas.getTime()) / 86_400_000 < 60, 'brz tranzit se zavrsi za manje od 60 dana');
  }
}

// --- 9e. Kartica Mesec ---
console.log('\n=== 9e. Kartica Mesec (Mesecevi aspekti egzaktni tog dana) ===');
{
  const WEIGHT: Record<string, number> = { sun: 1, moon: 1, ascendant: 1, midheaven: 0.9, mercury: 0.7, venus: 0.7, mars: 0.7 };
  const w = (k: string) => WEIGHT[k] ?? (['jupiter', 'saturn'].includes(k) ? 0.5 : 0.3);
  const t0 = performance.now();
  const dani = Array.from({ length: 30 }, (_, i) => new Date(2026, 8, 1 + i, 15, 0));
  const md = dani.map((d) => moonDay(chart, d));
  const ms = performance.now() - t0;
  ok(ms / dani.length < 150, 'jedan dan se racuna brzo', `${(ms / dani.length).toFixed(0)} ms/dan`);

  let sviTacni = true, uDanu = true, potpuno = true, najjaci = true, ulazak = true;
  md.forEach((m, i) => {
    const start = localMidnight(dani[i]);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    for (const h of m.hits) {
      if (h.orb > 0.01) sviTacni = false;
      if (h.exactAt < start || h.exactAt >= end) uDanu = false;
    }
    // Nezavisno: prolaz na svakih 10 minuta, prebroji prelaske preko tacaka aspekata.
    let broj = 0;
    for (const n of [...chart.planets.map((p) => p.longitude), chart.houses.ascendant, chart.houses.midheaven]) {
      for (const off of [0, 60, -60, 90, -90, 120, -120, 180]) {
        let prev = bodyLongitude('moon', start);
        for (let t = start.getTime() + 600_000; t <= end.getTime(); t += 600_000) {
          const cur = bodyLongitude('moon', new Date(Math.min(t, end.getTime() - 1)));
          if (norm360(n + off - prev) < norm360(cur - prev)) broj++;
          prev = cur;
        }
      }
    }
    if (broj !== m.hits.length) { potpuno = false; console.log(`   ${dayKey(start)}: nadjeno ${m.hits.length}, prolazom ${broj}`); }
    const s = m.strongest;
    if (m.hits.length && (!s || m.hits.some((h) => w(h.natal.key) > w(s.natal.key)))) najjaci = false;
    if (m.ingress) {
      const pre = Math.floor(bodyLongitude('moon', new Date(m.ingress.at.getTime() - 60_000)) / 30);
      const posle = Math.floor(bodyLongitude('moon', new Date(m.ingress.at.getTime() + 60_000)) / 30);
      if (pre === posle || m.ingress.at < start || m.ingress.at >= end) ulazak = false;
    }
  });
  ok(sviTacni, 'sat svakog aspekta je egzaktan (orb < 0,01°)');
  ok(uDanu, 'svi egzaktni trenuci su unutar lokalnog dana');
  ok(potpuno, 'nijedan aspekt nije propusten (provera prolazom od 10 min)');
  ok(najjaci, 'najjaci ima najvecu tezinu natalne mete');
  const ulazaka = md.filter((m) => m.ingress).length;
  ok(ulazak && ulazaka >= 10 && ulazaka <= 14, 'prelazak u znak: tacan i ~12 puta za 30 dana', `${ulazaka}`);
  // Ne mora svaki dan: na tri karte kroz 2026. bez ijednog egzaktnog aspekta je 0—9
  // dana od 365. Kartica tada pokazuje samo fazu i znak.
  const prazni = md.filter((m) => m.hits.length === 0).length;
  ok(prazni <= 3, 'dan bez Mesecevog tranzita je retkost', `${prazni} od ${md.length}`);
  ok(md.every((m, i) => moonDay(chart, dani[i], true).hits.every((h) => !['ascendant', 'midheaven'].includes(h.natal.key))),
    'bez vremena rodjenja nema ASC i MC');
  const d = md[25];
  console.log(`   ${dayKey(dani[25])}: ${d.sign.name}${d.ingress ? ` -> ${d.ingress.sign.name}` : ''}, najjaci ${d.strongest?.contentKey}`);
}

// --- 9f. Promene na nebu ---
console.log('\n=== 9f. Promene na nebu (ulazak u znak, retrogradnost) ===');
{
  const lonAt = (k: any, t: number) => bodyLongitude(k, new Date(t));
  const sgn = (l: number) => Math.floor(norm360(l) / 30);
  const vel = (k: any, t: number) => {
    let d = lonAt(k, t + 3_600_000) - lonAt(k, t - 3_600_000);
    if (d > 180) d -= 360; if (d < -180) d += 360; return d;
  };
  // Poznati datumi 2026. (efemeride): Venera Rx 3.10., Merkur Rx 24.10., Sunce u Skorpiji 23.10.
  const okt = upcomingSkyEvents(chart, new Date(2026, 8, 30, 12));
  const nadji = (k: string, kind: string) => okt.find((e) => e.planet.key === k && e.kind === kind);
  const venera = nadji('venus', 'retrograde');
  ok(!!venera && venera.at.getUTCMonth() === 9 && venera.at.getUTCDate() === 3, 'Venera postaje retrogradna 3. oktobra 2026.', venera?.at.toISOString());
  ok(!!venera?.until && venera.until.getUTCMonth() === 10 && Math.abs(venera.until.getUTCDate() - 13.5) <= 1, 'Venera direktna oko 13—14. novembra', venera?.until?.toISOString());
  const okt2 = upcomingSkyEvents(chart, new Date(2026, 9, 20, 12));
  const sunce = okt2.find((e) => e.planet.key === 'sun');
  ok(!!sunce && sunce.sign.key === 'scorpio' && sunce.at.getUTCDate() === 23, 'Sunce ulazi u Skorpiju 23. oktobra', sunce?.at.toISOString());
  const merkur = okt2.find((e) => e.planet.key === 'mercury');
  ok(!!merkur && merkur.kind === 'retrograde' && merkur.at.getUTCDate() === 24, 'Merkur postaje retrogradan 24. oktobra', merkur?.at.toISOString());

  const nov = upcomingSkyEvents(chart, new Date(2026, 10, 1, 12));
  const mDir = nov.find((e) => e.planet.key === 'mercury');
  const vDir = nov.find((e) => e.planet.key === 'venus');
  ok(mDir?.kind === 'direct' && mDir.at.getUTCMonth() === 10 && Math.abs(mDir.at.getUTCDate() - 13.5) <= 1, 'Merkur ponovo direktan oko 13—14. novembra', mDir?.at.toISOString());
  ok(vDir?.kind === 'direct' && vDir.until === null && Math.abs(vDir.at.getTime() - (venera?.until?.getTime() ?? 0)) < 60_000, 'Venera direktna tacno kad se retrogradnost zavrsava', vDir?.at.toISOString());

  ok(SIGNS.every((z) => SIGN_CASES[z.key]?.acc && SIGN_CASES[z.key]?.loc), 'svaki znak ima akuzativ i lokativ');

  let tacno = true, redom = true, razlicite = true, bezMeseca = true, kuce = true, prvi = true;
  const t0 = performance.now();
  const dani = Array.from({ length: 24 }, (_, i) => new Date(2026, 0, 1 + i * 15, 12));
  for (const d of dani) {
    const ev = upcomingSkyEvents(chart, d);
    const start = localMidnight(d).getTime();
    if (ev.length !== 3) tacno = false;
    for (let i = 1; i < ev.length; i++) if (ev[i - 1].at > ev[i].at) redom = false;
    if (new Set(ev.map((e) => e.planet.key)).size !== ev.length) razlicite = false;
    if (ev.some((e) => e.planet.key === 'moon')) bezMeseca = false;
    for (const e of ev) {
      const t = e.at.getTime(), k = e.planet.key;
      if (e.kind === 'ingress') {
        if (sgn(lonAt(k, t - 60_000)) === sgn(lonAt(k, t + 60_000)) || sgn(lonAt(k, t + 60_000)) !== SIGNS_IDX(e.sign.key)) tacno = false;
        if (e.until && sgn(lonAt(k, e.until.getTime() + 60_000)) === SIGNS_IDX(e.sign.key)) tacno = false;
      } else if (e.kind === 'direct') {
        if (!(vel(k, t - 600_000) < 0 && vel(k, t + 600_000) >= 0)) tacno = false;
      } else {
        if (!(vel(k, t - 600_000) > 0 && vel(k, t + 600_000) <= 0)) tacno = false;
        if (e.until && !(vel(k, e.until.getTime() + 600_000) > 0)) tacno = false;
      }
      if (e.house !== wholeSignHouse(chart, SIGNS_IDX(e.sign.key)) || e.house! < 1 || e.house! > 12) kuce = false;
      // Nijedna planeta nema raniji dogadjaj od prijavljenog (provera na svakih 6 sati).
      for (let x = start + 21_600_000; x < t - 21_600_000; x += 21_600_000) {
        if (sgn(lonAt(k, x)) !== sgn(lonAt(k, start)) || Math.sign(vel(k, start + 3_600_000)) !== Math.sign(vel(k, x))) { prvi = false; break; }
      }
    }
    if (upcomingSkyEvents(chart, d, true).some((e) => e.house !== null)) kuce = false;
  }
  const ms = (performance.now() - t0) / dani.length;
  ok(tacno, 'svaki dogadjaj je tacan trenutak (znak / stanica)');
  ok(prvi, 'svaki je PRVI sledeci za svoju planetu');
  ok(redom && razlicite && bezMeseca, 'tri razlicite planete, po datumu, bez Meseca');
  ok(kuce, 'kuca od podznaka; bez vremena rodjenja nema kuce');
  ok(ms < 300, 'racuna se brzo', `${ms.toFixed(0)} ms/dan (sa proverom)`);
}

// --- 9g. Mesec: procenat, crtez, lunarni dan ---
console.log('\n=== 9g. Mesec: procenat, crtez, lunarni dan ===');
{
  // Pun Mesec 26.9.2026. oko 16:49 UTC.
  const pre = moonState(new Date(Date.UTC(2026, 8, 20, 12)));
  ok(pre.nextFull.getUTCMonth() === 8 && pre.nextFull.getUTCDate() === 26, 'pun Mesec 26. septembra 2026.', pre.nextFull.toISOString());
  const pun = moonState(pre.nextFull);
  ok(pun.illumination > 0.99, 'na punom Mesecu osvetljeno > 99%', formatIllumination(pun.illumination));
  const mlad = moonState(new Date(pre.nextNew.getTime() + 3_600_000));
  ok(mlad.illumination < 0.01 && mlad.lunarDay === 1, 'sat posle mladog: < 1% i 1. lunarni dan', `${(mlad.illumination * 100).toFixed(2)}%, dan ${mlad.lunarDay}`);
  ok(pre.waxing && !moonState(new Date(pre.nextFull.getTime() + 86_400_000)).waxing, 'raste pre punog, opada posle');
  let dani = true, prev = 0;
  for (let i = 0; i < 29; i++) {
    const st = moonState(new Date(mlad.nextNew.getTime() + 3_600_000 + i * 86_400_000));
    if (st.lunarDay !== i + 1 || st.lunarDay <= prev) dani = false;
    prev = st.lunarDay;
  }
  ok(dani, 'lunarni dan raste 1, 2, 3… kroz ceo ciklus');
  ok(formatIllumination(0.9996) === '99%' && formatIllumination(0.003) === '1%' && formatIllumination(1) === '100%', 'procenat ne tvrdi 0 ni 100 kad nije');
  ok(Object.keys(PLANT_PART).length === 4, 'deo biljke za sva cetiri elementa');
  // Crtez: mlad prazan, pun ceo krug, cetvrt ravna linija (rx 0), srp desno dok raste.
  ok(moonLitPath(0, 10) === '' && moonLitPath(180, 10).includes('0 1 1'), 'mlad bez crteza, pun ceo disk');
  ok(moonLitPath(90, 10).includes('A 0.000 10'), 'prva cetvrt: terminator je prava linija');
  ok(moonLitPath(45, 10).includes('0 0 1 10 20') && moonLitPath(45, 10).endsWith('0 0 0 10 0 Z'), 'mladi srp: svetlo desno, terminator ka desno');
  ok(moonLitPath(315, 10).includes('0 0 0 10 20') && moonLitPath(315, 10).endsWith('0 0 1 10 0 Z'), 'stari srp: svetlo levo, terminator ka levo');
  const md = moonDay(chart, new Date(2026, 8, 26, 12));
  if (md.ingress) {
    ok(moonSignAt(md, new Date(md.ingress.at.getTime() - 60_000)).key === md.sign.key &&
       moonSignAt(md, new Date(md.ingress.at.getTime() + 60_000)).key === md.ingress.sign.key, 'znak u trenutku: pre i posle prelaska');
  }
}

console.log('\n  planete kroz natalne kuce:');
for (const t of houseTransits.slice(0, 4)) {
  console.log(`   ${t.transiting.glyph} ${t.transiting.name.padEnd(8)} -> ${t.house}. kuca   ${t.contentKey}`);
}

// --- 10. Razmicanje simbola na tocku ---
// Planete u istom stepenu bi se preklopile; spreadAngles ih gura razdvojeno.
console.log('\n=== 10. Razmicanje simbola planeta na tocku ===');
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
