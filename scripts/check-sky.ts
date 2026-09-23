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
import { planetPositions } from '../src/lib/astro';
import { buildSky, shiftDays, zoneClock, zoneShift } from '../src/lib/sky';
import { formatDate } from '../src/lib/horoscope';
import { trueNodeLongitude, meanLilithLongitude, nodeSpeed } from '../src/lib/points';
import { spreadAngles } from '../src/lib/wheel';
import { signFromLongitude } from '../src/lib/zodiac';

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
ok(datum === 'Četvrtak, 24. septembar', 'datum prati sat, ne uredjaj', datum);

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

console.log(fail ? `\n${fail} PROVERA PALO\n` : '\nSve provere prosle.\n');
process.exit(fail ? 1 : 0);
