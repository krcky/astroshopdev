/**
 * Provera ekrana "Trenutno na nebu". Pokreni: npx tsx scripts/check-sky.ts
 *
 * Referenca su vrednosti sa astro-seek-a za 23.9.2026. nad Beogradom,
 * prepisane sa snimka ekrana. Sajt je ispisao "23:00", ali se svih deset
 * planeta poklopi tek na 22:00 UTC — dakle sajt je racunao po zimskom vremenu
 * (UTC+1) iako je tog dana u Srbiji bilo letnje. Trenutak je ovde zakovan na
 * 22:00 UTC, sto je 00:00 po beogradskom letnjem vremenu.
 *
 * Zasto bas ovo: cvor i Lilit su jedine dve stvari u aplikaciji koje ne dolaze
 * iz `astronomy-engine` nego iz nase formule. Ako se neko poigra sa njima,
 * greska se na ekranu ne vidi — broj i dalje izgleda kao broj.
 */
import { trebaPozivZaWidget } from '../src/lib/widget-poziv';
import { planetPositions } from '../src/lib/astro';
import {
  buildSky, danZaKalendar, istiDanUKalendaru, izKalendara, naDan, shiftDays, vremeZaOkret, zoneClock, zoneShift,
} from '../src/lib/sky';
import { formatDate } from '../src/lib/horoscope';
import { trueNodeLongitude, meanLilithLongitude, nodeSpeed } from '../src/lib/points';
import {
  BEZ_ZUMA, ZUM_MAX, chartAngle, chordAt, degreeTickPaths, ekranUKrug, krugUEkran, labelBlockWidth, levaTacka, naOsi, oseKarte, pogodiTocak, polar, primeniPokret, spreadAngles, ugloviSimbola,
  LABEL, LABEL_SEP, WHEEL_R,
} from '../src/lib/wheel';
import { buildNatalChart } from '../src/lib/natal';
import { signFromLongitude } from '../src/lib/zodiac';
import { CENTAR, OKVIR, VIEW } from '../src/lib/tocak-stil';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(46)} ${detail}`);
};
/** Poredjenje uglova, tolerancija u LUCNIM MINUTIMA. */
const near = (a: number, b: number, tolMin: number, label: string) => {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  ok(d * 60 <= tolMin, label, `${(d * 60).toFixed(2)}' (dozvoljeno ${tolMin}')`);
};

const TRENUTAK = new Date('2026-09-23T22:00:00Z');
const BEOGRAD = { latitude: 44.7866, longitude: 20.4489 };
const ZONA = { name: 'Europe/Belgrade', standardOffsetMinutes: 60, europeanDst: true };

// Longitude sa astro-seek-a, u stepenima.
const SAJT: Record<string, number> = {
  sun: 180 + 0 + 53 / 60 + 35 / 3600,
  moon: 300 + 27 + 8 / 60 + 58 / 3600,
  mercury: 180 + 20 + 48 / 60 + 48 / 3600,
  venus: 210 + 6 + 53 / 60 + 8 / 3600,
  mars: 90 + 27 + 30 / 60 + 42 / 3600,
  jupiter: 120 + 18 + 17 / 60 + 22 / 3600,
  saturn: 0 + 12 + 7 / 60 + 37 / 3600,
  uranus: 60 + 5 + 37 / 60 + 27 / 3600,
  neptune: 0 + 3 + 3 / 60 + 30 / 3600,
  pluto: 300 + 3 + 10 / 60 + 58 / 3600,
};
const SAJT_CVOR = 300 + 29 + 36 / 60 + 37 / 3600;
const SAJT_LILIT = 270 + 1 + 1 / 60 + 41 / 3600;
const SAJT_FORTUNA = 300 + 19 + 50 / 60 + 31 / 3600;

console.log('\n=== 1. Planete prema astro-seek-u ===');
for (const p of planetPositions(TRENUTAK)) {
  near(p.longitude, SAJT[p.key], 0.5, `${p.name} ${p.position.formatted}`);
}

console.log('\n=== 2. Retrogradnost ===');
const retro = planetPositions(TRENUTAK).filter((p) => p.retrograde).map((p) => p.key).sort();
ok(
  retro.join(',') === 'neptune,pluto,saturn,uranus',
  'retrogradni: Saturn, Uran, Neptun, Pluton',
  retro.join(', ')
);

console.log('\n=== 3. Cvor i Lilit — nase formule ===');
const cvor = trueNodeLongitude(TRENUTAK);
near(cvor, SAJT_CVOR, 0.5, `pravi cvor ${signFromLongitude(cvor).formatted}`);

// Srednji cvor (polinom iz Meeusa) mora biti OSETNO drugaciji — ako se ova
// provera sruši, negde je pravi cvor zamenjen srednjim.
const T = (TRENUTAK.getTime() / 86400000 + 2440587.5 - 2451545) / 36525;
const srednjiCvor = ((125.0445479 - 1934.1362891 * T) % 360 + 360) % 360;
ok(Math.abs(cvor - srednjiCvor) * 60 > 30, 'pravi cvor NIJE srednji',
   `razlika ${(Math.abs(cvor - srednjiCvor) * 60).toFixed(0)}'`);

// Pravi cvor nije uvek retrogradan. Bas 23.9.2026. ide napred (+0,004°/dan) i
// astro-seek ga tog dana prikazuje bez "R" — da je oznaka bila zakucana na
// "uvek retrogradan", ovo bi je otkrilo.
ok(nodeSpeed(TRENUTAK) > 0, 'cvor je tog dana DIREKTAN',
   `${nodeSpeed(TRENUTAK).toFixed(4)}°/dan`);

// Tolerancija je 10' jer se programi oko SREDNJEG apogeja razilaze za oko
// desetinku stepena (razlicite serije lunarne teorije). Razlika prema
// astro-seek-u je 6,5'. Pravi apogej bi bio 11° dalje, pa ova granica i dalje
// hvata zamenu srednjeg pravim.
const lilit = meanLilithLongitude(TRENUTAK);
near(lilit, SAJT_LILIT, 10, `srednja Lilit ${signFromLongitude(lilit).formatted}`);

console.log('\n=== 4. Sklopljeno nebo nad Beogradom ===');
const sky = buildSky(TRENUTAK, BEOGRAD.latitude, BEOGRAD.longitude);
const sunce = sky.chart.planets.find((p) => p.key === 'sun')!;
ok(!sky.dayChart, 'ponoc je nocna karta', `Sunce u ${sunce.house}. kuci`);

const fortuna = sky.points.find((p) => p.key === 'fortune')!;
// Tacka srece se racuna IZ ascendenta, pa ovo posredno proverava i njega:
// greska od 1' u ASC-u pomerila bi i Tacku srece za 1'.
near(fortuna.longitude, SAJT_FORTUNA, 1.5, `Tacka srece ${fortuna.position.formatted}`);

ok(sky.chart.houses.system === 'placidus', 'Placidus kuce', sky.chart.houses.system);

// Kuce su najjaca provera ascendenta koju imamo: sajt ih ispisuje uz svako
// telo, a greska od 1° u ASC-u vec prebaci telo blizu kuspide u susednu kucu.
const SAJT_KUCE: Record<string, number> = {
  sun: 4, moon: 9, mercury: 4, venus: 5, mars: 1,
  jupiter: 2, saturn: 10, uranus: 11, neptune: 10, pluto: 7,
};
for (const p of sky.chart.planets) {
  ok(p.house === SAJT_KUCE[p.key], `${p.name} u ${SAJT_KUCE[p.key]}. kuci`, `nasa ${p.house}.`);
}
const SAJT_KUCE_TACKE: Record<string, number> = { northNode: 9, lilith: 6, fortune: 8 };
for (const t of sky.points) {
  ok(t.house === SAJT_KUCE_TACKE[t.key], `${t.name} u ${SAJT_KUCE_TACKE[t.key]}. kuci`, `nasa ${t.house}.`);
}
const cvorTacka = sky.points.find((p) => p.key === 'northNode')!;
ok(cvorTacka.retrograde === false, 'cvor se NE prikazuje sa oznakom R',
   String(cvorTacka.retrograde));
ok(sky.points.find((p) => p.key === 'lilith')!.retrograde === undefined,
   'Lilit nema oznaku kretanja');

ok(sky.points.every((p) => p.house !== undefined && p.house >= 1 && p.house <= 12),
   'sve tacke imaju kucu 1—12',
   sky.points.map((p) => `${p.name} ${p.house}`).join(', '));

ok(zoneClock(TRENUTAK, ZONA) === '00:00', 'sat nad Beogradom', zoneClock(TRENUTAK, ZONA));
// 22:00 UTC je vec 24. septembar po beogradskom letnjem vremenu. Datum mora da
// prati sat, inace bi korisniku u drugoj zoni pisalo "00:00" uz juceresnji dan.
const datum = formatDate(zoneShift(TRENUTAK, ZONA), true);
ok(datum === 'Čet, 24. sep', 'datum prati sat, ne uredjaj', datum);

console.log('\n=== 5. Drugo mesto posmatranja ===');
// Ekran dozvoljava da se nebo gleda iz drugog grada. Pozicije tela su
// GEOCENTRICNE i ne smeju da se pomere ni za lucnu sekundu — menja se samo ono
// sto zavisi od horizonta: uglovi, kuce i dan/noc. Ako bi se ovde nesto
// razislo, znacilo bi da je grad procurio tamo gde mu nije mesto.
const SIDNEJ = { latitude: -33.8688, longitude: 151.2093 };
const ZONA_SIDNEJ = { name: 'Australia/Sydney', standardOffsetMinutes: 600, europeanDst: false };
const odande = buildSky(TRENUTAK, SIDNEJ.latitude, SIDNEJ.longitude);

const najveceOdstupanje = Math.max(...sky.chart.planets.map((p, i) =>
  Math.abs(p.longitude - odande.chart.planets[i].longitude)));
ok(najveceOdstupanje === 0, 'pozicije planeta se NE menjaju sa mestom',
   `${(najveceOdstupanje * 3600).toFixed(3)}"`);

ok(Math.abs(sky.chart.houses.ascendant - odande.chart.houses.ascendant) > 30,
   'ascendent se menja sa mestom',
   `Beograd ${sky.chart.ascendantSign.formatted} / Sidnej ${odande.chart.ascendantSign.formatted}`);

// Isti trenutak: u Beogradu je ponoc, u Sidneju 8 ujutru. Tacka srece zato
// prelazi sa nocne na dnevnu formulu — to je jedina razlika u `points.ts` koja
// zavisi od horizonta.
ok(odande.dayChart && !sky.dayChart, 'isti trenutak, dnevna karta u Sidneju',
   `Sunce u ${odande.chart.planets.find((p) => p.key === 'sun')!.house}. kuci`);
ok(zoneClock(TRENUTAK, ZONA_SIDNEJ) === '08:00', 'sat nad Sidnejem',
   zoneClock(TRENUTAK, ZONA_SIDNEJ));

console.log('\n=== 6. Pomeranje vremena ===');
// "dan >" mora da pogodi ISTI SAT sledeceg dana, i onda kad se te noci pomera
// sat. U Srbiji se 2026. na zimsko prelazi u nedelju 25. oktobra, pa je pomak
// sa 24. na 25. oktobar dug 25 stvarnih sati. Da je dugme radilo prosto
// "+24h", korisnik bi umesto 12:00 dobio 11:00 i mislio da je kvar.
const uocilaz = new Date('2026-10-24T10:00:00Z'); // 12:00 po beogradskom letnjem
ok(zoneClock(uocilaz, ZONA) === '12:00', 'polaziste 24.10. u 12:00', zoneClock(uocilaz, ZONA));

const sutra = shiftDays(uocilaz, ZONA, 1);
ok(zoneClock(sutra, ZONA) === '12:00', 'dan > pogadja isti sat preko prelaska',
   zoneClock(sutra, ZONA));
ok(Math.round((sutra.getTime() - uocilaz.getTime()) / 3_600_000) === 25,
   'taj dan stvarno traje 25 sati',
   `${((sutra.getTime() - uocilaz.getTime()) / 3_600_000).toFixed(0)} h`);

// Napred pa nazad mora da vrati u isti minut, inace bi se listanjem po danima
// vreme polako odseljavalo.
ok(shiftDays(sutra, ZONA, -1).getTime() === uocilaz.getTime(),
   'dan > pa dan < vraca u isti trenutak');

// Obican dan bez prelaska: 24 sata.
const obican = new Date('2026-06-10T10:00:00Z');
ok(Math.round((shiftDays(obican, ZONA, 1).getTime() - obican.getTime()) / 3_600_000) === 24,
   'obican dan je 24 sata');

// Karta zaista prati pomereni trenutak: Mesec za dan predje 12—15°.
const danas = buildSky(obican, BEOGRAD.latitude, BEOGRAD.longitude);
const sutraSky = buildSky(shiftDays(obican, ZONA, 1), BEOGRAD.latitude, BEOGRAD.longitude);
const mesecPomak = ((sutraSky.chart.planets.find((p) => p.key === 'moon')!.longitude -
  danas.chart.planets.find((p) => p.key === 'moon')!.longitude) + 360) % 360;
ok(mesecPomak > 11 && mesecPomak < 16, 'Mesec za dan predje 11—16°', `${mesecPomak.toFixed(1)}°`);

// Dan iz kalendara (Ivan, 28.9.2026): isti zid-sat i preko letnjeg vremena.
// 15. mart u 12:00 je zimsko (UTC+1), 15. jul u 12:00 letnje (UTC+2).
const zid = (d: Date) => zoneShift(d, ZONA).toISOString().slice(0, 16);
const mart = new Date('2026-03-15T11:00:00Z'); // 12:00 po beogradskom zimskom
ok(zid(naDan(mart, ZONA, 2026, 7, 15)) === '2026-07-15T12:00', 'dan iz kalendara zadrzava sat preko prelaska',
   zid(naDan(mart, ZONA, 2026, 7, 15)));
ok(zid(naDan(mart, ZONA, 1990, 1, 1)) === '1990-01-01T12:00', 'kalendar ide i u proslost',
   zid(naDan(mart, ZONA, 1990, 1, 1)));

// Kalendar radi u zoni UREDJAJA: nosilac dana mora da vrati isti dan u koji
// god zoni je uredjaj — i oko ponoci, kad su zid-sat mesta i UTC u razlicitim
// danima (00:30 u Beogradu je jos prethodni dan po UTC-u).
const ponoc = new Date('2026-09-27T22:30:00Z'); // 28.9. u 00:30 po beogradskom
ok(danZaKalendar(ponoc, ZONA).getDate() === 28, 'nosilac dana je dan na zid-satu mesta',
   `${danZaKalendar(ponoc, ZONA).getDate()}.`);
ok(izKalendara(ponoc, ZONA, danZaKalendar(ponoc, ZONA)).getTime() === ponoc.getTime(),
   'kalendar bez promene vraca isti trenutak');
ok(istiDanUKalendaru(ponoc, ZONA, danZaKalendar(ponoc, ZONA)), 'isti dan se prepoznaje');
const sutraNosilac = danZaKalendar(shiftDays(ponoc, ZONA, 1), ZONA);
ok(!istiDanUKalendaru(ponoc, ZONA, sutraNosilac), 'drugi dan se razlikuje');
ok(zid(izKalendara(ponoc, ZONA, sutraNosilac)) === '2026-09-29T00:30', 'izabran sutrasnji dan, isti sat',
   zid(izKalendara(ponoc, ZONA, sutraNosilac)));

console.log('\n=== 7. Simboli na tocku se ne preklapaju ===');
// Sa tri izvedene tacke tocak crta 13 simbola umesto 10 — provera da ih
// razmicanje i dalje razdvoji i da nijedan ne pobegne sa svog mesta.
const svi = [...sky.chart.planets.map((p) => p.longitude), ...sky.points.map((p) => p.longitude)];
const razmaknuti = spreadAngles(svi, 8.5);
const sortirani = [...razmaknuti].sort((a, b) => a - b);
let najmanji = 360;
for (let i = 1; i < sortirani.length; i++) najmanji = Math.min(najmanji, sortirani[i] - sortirani[i - 1]);
ok(razmaknuti.length === 13, 'trinaest simbola', String(razmaknuti.length));
ok(najmanji >= 8.4, 'najmanji razmak >= 8.4°', `${najmanji.toFixed(2)}°`);
const pomak = Math.max(...svi.map((v, i) => {
  let d = Math.abs(razmaknuti[i] - v);
  if (d > 180) d = 360 - d;
  return d;
}));
ok(pomak < 20, 'nijedan simbol nije odlutao vise od 20°', `najveci pomak ${pomak.toFixed(1)}°`);

console.log('\n=== 8. Crtice za stepene ===');
// Tocak crta lenjir po celom krugu: 360 crtica u tri debljine, spojenih u tri
// SVG putanje. Provera je da su sve tu, da se nijedan stepen ne crta dvaput i
// da crtica zaista pocinje na ivici prstena.
const OUTER = 144;
const LEN = { d1: 2.5, d5: 5, d10: 8 };
const staze = degreeTickPaths(180, 180, sky.chart.houses.ascendant, OUTER, LEN);
const broj = (d: string) => (d.match(/M/g) ?? []).length;
ok(broj(staze.d10) === 36, 'crtica na svakih 10°', String(broj(staze.d10)));
ok(broj(staze.d5) === 36, 'crtica na svakih 5° (bez onih na 10°)', String(broj(staze.d5)));
ok(broj(staze.d1) === 288, 'crtica na svaki preostali stepen', String(broj(staze.d1)));
ok(broj(staze.d1) + broj(staze.d5) + broj(staze.d10) === 360, 'ukupno 360, nijedan stepen dvaput');

// Pocetna tacka svake crtice mora lezati na krugu poluprecnika OUTER,
// a krajnja tacno za svoju duzinu blize centru.
let najgoriPocetak = 0;
let najgoriKraj = 0;
for (const [tier, d] of Object.entries(staze) as ['d1' | 'd5' | 'd10', string][]) {
  for (const m of d.matchAll(/M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/g)) {
    const r0 = Math.hypot(+m[1] - 180, +m[2] - 180);
    const r1 = Math.hypot(+m[3] - 180, +m[4] - 180);
    najgoriPocetak = Math.max(najgoriPocetak, Math.abs(r0 - OUTER));
    najgoriKraj = Math.max(najgoriKraj, Math.abs(r1 - (OUTER - LEN[tier])));
  }
}
ok(najgoriPocetak < 0.02, 'sve crtice krecu sa ivice prstena', `odstupanje ${najgoriPocetak.toFixed(4)}`);
ok(najgoriKraj < 0.02, 'sve crtice imaju duzinu svog nivoa', `odstupanje ${najgoriKraj.toFixed(4)}`);

console.log('\n=== 9. Tocak i lista ispod njega govore isto ===');
// Tocak crta `deg` i `min` kao dva odvojena broja, lista ispisuje `formatted`.
// Oba izlaze iz istog odsecanja u `signFromLongitude`, ali to mora da se
// drzi: ranije je lista koristila `formattedPrecise`, koji je SKRACIVAO dok je
// tocak zaokruzivao, pa je isto Sunce bilo "24 09'" gore i "24° 08' 57\""
// dole. Ova provera pada cim se dva prikaza raziju.
let razislo = 0;
let primer = '';
for (const p of [...sky.chart.planets, ...sky.points]) {
  const q = signFromLongitude(p.longitude);
  const saTocka = `${q.deg}° ${String(q.min).padStart(2, '0')}'`;
  if (!q.formatted.startsWith(saTocka)) {
    razislo++;
    if (!primer) primer = `${p.name}: tocak ${saTocka}, lista ${q.formatted}`;
  }
}
ok(razislo === 0, 'svih 13 pozicija se poklapa', primer || 'tocak i lista daju isti minut');

// Minuti se ODSECAJU kao na astro.com i astro-seek. Vrednosti ispod su
// astro-seek za Nis 30.6.1988. 03:30 CEST (proverano 26.9.2026.); sa
// zaokruzivanjem bi prve dve bile minut vise.
const ODSECANJE: Array<[number, string]> = [
  [77.2317, "17° 13' Blizanci"],   // ASC 17°13.9'
  [74.3325, "14° 19' Blizanci"],   // Venera 14°19.95'
  [29.9999, "29° 59' Ovan"],       // ne sme da preskoci u Bika
  [12 + 34 / 60, "12° 34' Ovan"],  // tacan minut ne sme da padne na 33'
];
for (const [lon, ocekivano] of ODSECANJE) {
  const f = signFromLongitude(lon).formatted;
  ok(f === ocekivano, `odseca minute: ${ocekivano}`, f);
}
const precizanIsti = [...sky.chart.planets, ...sky.points].every((p) => {
  const q = signFromLongitude(p.longitude);
  return q.formattedPrecise.startsWith(`${q.deg}° ${String(q.min).padStart(2, '0')}'`);
});
ok(precizanIsti, 'precizan oblik ima isti stepen i minut kao prikaz');

console.log('\n=== 10. Blok sa stepenom staje tamo gde treba ===');
// Ovo pada cim neko digne `LABEL.minSize` a ne prosiri razmak. Blok je uvek
// vodoravan, pa istu sirinu trosi u dva smera: po luku prema susednom simbolu,
// i po poluprecniku prema glifu iznad i prstenu ispod.
const sirina = labelBlockWidth();
const tetiva = chordAt(WHEEL_R.number, LABEL_SEP);
ok(tetiva > sirina + 1, 'dva susedna bloka se ne dodiruju',
   `tetiva ${tetiva.toFixed(1)} vs sirina ${sirina.toFixed(1)}, rezerva ${(tetiva - sirina).toFixed(1)}`);

// Na 3 i 9 sati glif i blok se sire jedan prema drugom po istoj osi.
const zazorGlif = (WHEEL_R.planetUp - WHEEL_R.number)
  - (LABEL.glyphSize * 0.82) / 2 - sirina / 2;
ok(zazorGlif > 1, 'blok ne naleti na svoj glif', `rezerva ${zazorGlif.toFixed(1)}`);

// A ka centru ne sme da propadne u polje aspekata (od 30.9.2026 bez linije, ivica su tacke planeta).
const zazorPrsten = (WHEEL_R.number - sirina / 2) - WHEEL_R.houseRing;
ok(zazorPrsten > 1, 'blok ostaje iznad ivice polja aspekata', `rezerva ${zazorPrsten.toFixed(1)}`);

// Sto je razmak veci, to simbol stoji dalje od svog stvarnog stepena. Crtica
// do prstena to pokriva, ali samo do granice.
const razmaknutiStepeni = spreadAngles(svi, LABEL_SEP);
const pomakSaStepenima = Math.max(...svi.map((v, i) => {
  let d = Math.abs(razmaknutiStepeni[i] - v);
  if (d > 180) d = 360 - d;
  return d;
}));
ok(pomakSaStepenima < 20, 'i sa stepenima nijedan simbol ne odluta vise od 20°',
   `najveci pomak ${pomakSaStepenima.toFixed(1)}°`);

console.log('\n=== 11. Kuce do centra (30.9.2026) ===');
// Kuspide staju na malom krugu `hub`, brojevi kuca stoje oko njega. Dvocifren
// broj je vodoravan, pa na 3 i 9 sati celu svoju sirinu trosi po poluprecniku.
const sirinaBroja = 2 * LABEL.houseSize * LABEL.digit;
ok(WHEEL_R.houseNum - sirinaBroja / 2 - WHEEL_R.hub > 1, 'broj kuce ne ulazi u mali krug',
   `rezerva ${(WHEEL_R.houseNum - sirinaBroja / 2 - WHEEL_R.hub).toFixed(1)}`);
ok(WHEEL_R.houseRing - WHEEL_R.houseNum - sirinaBroja / 2 > 1, 'broj kuce ne stize do tacaka planeta',
   `rezerva ${(WHEEL_R.houseRing - WHEEL_R.houseNum - sirinaBroja / 2).toFixed(1)}`);

// Susedni brojevi na karti iz ove provere (Placidus nad Beogradom) se ne dodiruju.
// Na severu (Stokholm) kuca ume da bude i 11° pa se brojevi zbiju — to je poznata cena.
const kuspide = sky.chart.houses.cusps;
const brojevi = kuspide.map((c, i) => {
  const mid = c + (((kuspide[(i + 1) % 12] - c) % 360) + 360) % 360 / 2;
  return polar(0, 0, WHEEL_R.houseNum, chartAngle(mid, sky.chart.houses.ascendant));
});
const najblizi = Math.min(...brojevi.map((b, i) => {
  const n = brojevi[(i + 1) % 12];
  return Math.hypot(n.x - b.x, n.y - b.y);
}));
ok(najblizi > sirinaBroja, 'susedni brojevi kuca se ne dodiruju', `${najblizi.toFixed(1)} vs sirina ${sirinaBroja.toFixed(1)}`);

// Ose (debele) dolaze iz ASC i MC. Po Placidusu su to tacno 1., 4., 7. i 10. kuspida.
const ose = oseKarte(sky.chart.houses.ascendant, sky.chart.houses.midheaven);
const naOsama = kuspide.map((c, i) => (naOsi(c, ose) ? i : -1)).filter((i) => i >= 0);
ok(naOsama.join(',') === '0,3,6,9', 'Placidus: ose su 1., 4., 7. i 10. kuspida', naOsama.map((i) => i + 1).join(', '));
// Iznad ~66° Placidus pada na Whole Sign: kuspide su granice znakova, ose NISU medju njima.
const tromse = buildNatalChart({ date: TRENUTAK, latitude: 69.6492, longitude: 18.9553 }, 'placidus');
const oseSever = oseKarte(tromse.houses.ascendant, tromse.houses.midheaven);
ok(tromse.houses.fellBack && tromse.houses.cusps.filter((c) => naOsi(c, oseSever)).length === 0,
   'Whole Sign: ose se crtaju posebno, ne po kuspidi',
   `Tromse, ASC ${signFromLongitude(tromse.houses.ascendant).formatted}`);

// Bez vremena rodjenja nema kuca ni ASC: levo je 0° Ovna, ne ascendent za podne.
ok(chartAngle(0, levaTacka(sky.chart.houses.ascendant, true)) === 180, 'bez vremena rodjenja levo je 0° Ovna');
ok(levaTacka(sky.chart.houses.ascendant, false) === sky.chart.houses.ascendant, 'sa vremenom levo je ascendent');

console.log('\n=== 12. Dodir na tocak ===');
// Tocak se crta u viewBox-u (VIEW x VIEW) na `size` tacaka; dodir stize u tackama.
const VELICINA = 400;
const zaTacku = (r: number, ugao: number) => {
  const q = polar(CENTAR, CENTAR, r, ugao);
  return { x: ((q.x + OKVIR) * VELICINA) / VIEW, y: ((q.y + OKVIR) * VELICINA) / VIEW };
};
const nebo = sky.chart;
const leva = levaTacka(nebo.houses.ascendant, false);
const simboli = [...nebo.planets, ...sky.points];
const uglovi = ugloviSimbola(simboli.map((s) => s.longitude), leva, true);
const opis: Parameters<typeof pogodiTocak>[2] = {
  size: VELICINA, leva, degrees: true,
  planete: simboli.map((s, i) => ({ key: s.key, ugao: uglovi[i] })),
  kuspide: nebo.houses.cusps, ascendant: nebo.houses.ascendant, midheaven: nebo.houses.midheaven,
};
const pogodi = (r: number, ugao: number, o = opis) => { const q = zaTacku(r, ugao); return pogodiTocak(q.x, q.y, o); };

// Svaki simbol, dodirnut na mestu gde je nacrtan (i malo sa strane), je ta planeta.
const promasaji = simboli.filter((s, i) => {
  const a = pogodi(WHEEL_R.planetUp, uglovi[i]);
  const b = pogodi(WHEEL_R.number, uglovi[i] + 3);
  return !(a?.tip === 'planeta' && a.key === s.key && b?.tip === 'planeta' && b.key === s.key);
});
ok(promasaji.length === 0, 'dodir na simbol pogadja bas tu planetu', promasaji.map((s) => s.key).join(', '));

// Sredina svake kuce je ta kuca; broj kuce je isti kao u `houseOf`.
const losaKuca: number[] = [];
nebo.houses.cusps.forEach((c, i) => {
  const raspon = (((nebo.houses.cusps[(i + 1) % 12] - c) % 360) + 360) % 360;
  // Poluprecnik izmedju brojeva i polja planeta: tu planete ne smetaju.
  const h = pogodi(WHEEL_R.houseNum + 20, chartAngle(c + raspon / 2, leva));
  if (!(h?.tip === 'kuca' && h.broj === i + 1)) losaKuca.push(i + 1);
});
ok(losaKuca.length === 0, 'sredina svake kuce je ta kuca', losaKuca.join(', '));

// Prsten znakova: sredina znaka. Ascendent je levo, pa je znak ascendenta pogodjen levo.
const znakAsc = Math.floor(nebo.houses.ascendant / 30);
const zn = pogodi((WHEEL_R.outer + WHEEL_R.zodiacIn) / 2, 180);
ok(zn?.tip === 'znak' && zn.indeks === znakAsc, 'prsten znakova: levo je znak ascendenta', `${zn && 'indeks' in zn ? zn.indeks : '-'} vs ${znakAsc}`);

// Natpisi ASC i MC van kruga; mali krug u sredini i sve van tocka nisu nista.
const a1 = pogodi(WHEEL_R.outer + 16, 180);
ok(a1?.tip === 'ugao' && a1.key === 'ascendant', 'natpis ASC van kruga je ugao ascendenta');
const m1 = pogodi(WHEEL_R.outer + 16, chartAngle(nebo.houses.midheaven, leva));
ok(m1?.tip === 'ugao' && m1.key === 'midheaven', 'natpis MC van kruga je ugao MC');
ok(pogodi(5, 40) === null, 'mali krug u sredini nije nista');
ok(pogodi(WHEEL_R.outer + 60, 90) === null, 'van tocka nije nista');

// Bez vremena rodjenja nema kuca ni uglova, ali planete i znakovi rade.
const bezKuca = { ...opis, kuspide: null, leva: levaTacka(nebo.houses.ascendant, true) };
const ugBez = ugloviSimbola(simboli.map((s) => s.longitude), bezKuca.leva, true);
const bezOpis = { ...bezKuca, planete: simboli.map((s, i) => ({ key: s.key, ugao: ugBez[i] })) };
const planBez = pogodi(WHEEL_R.planetUp, ugBez[0], bezOpis);
ok(planBez?.tip === 'planeta' && planBez.key === simboli[0].key, 'bez vremena rodjenja planeta se i dalje pogadja');
ok(pogodi(WHEEL_R.houseNum + 20, 100, bezOpis) === null, 'bez vremena rodjenja nema kuca');
ok(pogodi(WHEEL_R.outer + 16, 180, bezOpis) === null, 'bez vremena rodjenja nema uglova');
ok(pogodi((WHEEL_R.outer + WHEEL_R.zodiacIn) / 2, 100, bezOpis)?.tip === 'znak', 'bez vremena rodjenja znakovi rade');

console.log('\n=== 13. Zum kruga ===');
const Z = VELICINA;
const blizu = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// Zum 2x oko tacke (100, 150): ta tacka na ekranu ostaje na istom mestu, a ekran->krug->ekran je identitet.
const f = { x: 100, y: 150 };
const r2 = primeniPokret(BEZ_ZUMA, Z, 2, f, { x: 0, y: 0 });
const pod = ekranUKrug(f.x, f.y, Z, r2.zum);
ok(blizu(r2.zum.s, 2) && blizu(r2.g, 2), 'stezanje 2x daje razmeru 2');
ok(blizu(pod.x, f.x) && blizu(pod.y, f.y), 'tacka pod prstima ostaje pod prstima', `${pod.x.toFixed(2)},${pod.y.toFixed(2)}`);
const nazad = krugUEkran(...(Object.values(ekranUKrug(70, 220, Z, r2.zum)) as [number, number]), Z, r2.zum);
ok(blizu(nazad.x, 70) && blizu(nazad.y, 220), 'ekran -> krug -> ekran vraca istu tacku');

// Pomeraj: bez promene razmere sredina ide suprotno od prsta.
const pan = primeniPokret(r2.zum, Z, 1, { x: Z / 2, y: Z / 2 }, { x: 40, y: 0 });
ok(pan.zum.fx < r2.zum.fx && blizu(pan.zum.fy, r2.zum.fy), 'pomeranje udesno pokazuje levlji deo kruga');

// Granice: ne moze preko ZUM_MAX, ne moze ispod 1, sredina ne izlazi iz kruga, a `t` prati ogranicenje.
const veliki = primeniPokret(BEZ_ZUMA, Z, 99, f, { x: 0, y: 0 });
ok(blizu(veliki.zum.s, ZUM_MAX), 'razmera se zaustavlja na ZUM_MAX', String(veliki.zum.s));
const odzum = primeniPokret(BEZ_ZUMA, Z, 0.3, f, { x: 0, y: 0 });
ok(blizu(odzum.zum.s, 1) && blizu(odzum.zum.fx, 0.5), 'odzumiranje se vraca na pun krug');
const izvan = primeniPokret(r2.zum, Z, 1, { x: Z / 2, y: Z / 2 }, { x: 9999, y: 9999 });
ok(izvan.zum.fx >= 0.25 - 1e-9 && izvan.zum.fy >= 0.25 - 1e-9, 'pomeranje ne izlazi iz kruga', `${izvan.zum.fx.toFixed(3)}`);
ok(Math.abs(izvan.t.x) < 9999, 'ogranicen pomeraj se vraca kao `t` (prikaz = ono sto se upise)');

// Dodir pod zumom: zumiraj tacno na simbol pa dodirni sredinu — to je ta planeta.
const prvi = simboli[0];
const tacka = zaTacku(WHEEL_R.planetUp, uglovi[0]);
const zumPlaneta = primeniPokret(BEZ_ZUMA, VELICINA, 2, tacka, { x: 0, y: 0 }).zum;
const pod2 = ekranUKrug(tacka.x, tacka.y, VELICINA, zumPlaneta);
const pogodak2 = pogodiTocak(pod2.x, pod2.y, opis);
ok(pogodak2?.tip === 'planeta' && pogodak2.key === prvi.key, 'dodir pod zumom pogadja planetu pod prstom', prvi.key);

console.log('\n=== 14. Okretanje neba prstom ===');
const asc0 = sky.chart.houses.ascendant;
const ascU = (d: Date) => buildSky(d, BEOGRAD.latitude, BEOGRAD.longitude).chart.houses.ascendant;
const raz = (a: number, b: number) => Math.abs((((a - b + 540) % 360) + 360) % 360 - 180);
for (const stepeni of [10, 30, 90, 200]) {
  const t = vremeZaOkret(TRENUTAK, BEOGRAD.latitude, BEOGRAD.longitude, stepeni);
  ok(raz(ascU(t), asc0 + stepeni) < 0.01, `ascendent ide ${stepeni}° napred`, `${raz(ascU(t), asc0 + stepeni).toFixed(4)}° odstupanja`);
  ok(t > TRENUTAK, `${stepeni}° napred je kasnije vreme`);
}
const unazad = vremeZaOkret(TRENUTAK, BEOGRAD.latitude, BEOGRAD.longitude, -45);
ok(unazad < TRENUTAK && raz(ascU(unazad), asc0 - 45) < 0.01, '-45° je ranije vreme sa ascendentom 45° iza');
const ceo = vremeZaOkret(TRENUTAK, BEOGRAD.latitude, BEOGRAD.longitude, 360);
ok(Math.abs(ceo.getTime() - TRENUTAK.getTime() - 86_164_090) < 2000, '360° je jedan zvezdani dan', `${((ceo.getTime() - TRENUTAK.getTime()) / 3600000).toFixed(3)} h`);
ok(vremeZaOkret(TRENUTAK, BEOGRAD.latitude, BEOGRAD.longitude, 0).getTime() === TRENUTAK.getTime(), '0° je isti trenutak');
// Neravnomerno: sat vremena ne pomera ascendent uvek isto — to je razlog za trazenje vremena, a ne 15° na sat.
const satKasnije = (d: Date) => raz(ascU(new Date(d.getTime() + 3600000)), ascU(d));
const brzine = [0, 6, 12, 18].map((h) => satKasnije(new Date(TRENUTAK.getTime() + h * 3600000)));
ok(Math.max(...brzine) - Math.min(...brzine) > 3, 'ascendent se ne krece ravnomerno kroz dan', brzine.map((b) => b.toFixed(1)).join(', ') + ' °/h');
// Polarna sirina: ravnomerno, ne puca.
const polarno = vremeZaOkret(TRENUTAK, 69.6492, 18.9553, 90);
ok(Math.abs(polarno.getTime() - TRENUTAK.getTime() - 86_164_090.5 / 4) < 5, 'iznad polarnog kruga ide ravnomerno');

console.log('\n=== 15. Poziv za widget na tabu "Nebo" ===');
const poziv = { imaWidget: true, posete: 1, sklonjeno: false, naEkranu: 0 as number | null };
ok(trebaPozivZaWidget(poziv), 'od druge posete se pokazuje');
ok(!trebaPozivZaWidget({ ...poziv, posete: 0 }), 'pri prvoj poseti ne');
ok(!trebaPozivZaWidget({ ...poziv, sklonjeno: true }), 'sklonjena se ne vraca');
ok(!trebaPozivZaWidget({ ...poziv, naEkranu: 1 }), 'ko widget vec ima, ne vidi je');
ok(!trebaPozivZaWidget({ ...poziv, naEkranu: null }), 'dok se ne zna ima li widgeta, ceka');
ok(!trebaPozivZaWidget({ ...poziv, imaWidget: false }), 'u buildu bez widgeta je nema');

console.log(fail ? `\n${fail} PROVERA PALO\n` : '\nSve provere prosle.\n');
process.exit(fail ? 1 : 0);
