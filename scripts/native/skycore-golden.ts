/**
 * Referentne vrednosti za SkyCore (Swift jezgro widgeta i sata).
 *
 * Racuna nebo ISTIM kodom koji koristi aplikacija (`src/lib/`) i upisuje ga u
 * `native/SkyCore/Tests/SkyCoreTests/golden.json`; Swift test (`swift test`)
 * poredi svoj racun sa tim brojevima. Tako se prepis u Swift-u ne moze
 * neprimetno razici od aplikacije.
 *
 *   tsx scripts/native/skycore-golden.ts           upisi fajl
 *   tsx scripts/native/skycore-golden.ts --check   padni ako se fajl razlikuje od koda
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { moonPhase } from '../../src/lib/astro';
import { obliquity, rightAscensionMC } from '../../src/lib/natal';
import { meanLilithLongitude, nodeSpeed, trueNodeLongitude } from '../../src/lib/points';
import { moonNow, planetaryHour, upcomingEvents, voidOfCourse } from '../../src/lib/sat';
import { buildSky } from '../../src/lib/sky';
import { signFromLongitude } from '../../src/lib/zodiac';
import { spreadAngles } from '../../src/lib/wheel';

const FAJL = path.join(__dirname, '../../native/SkyCore/Tests/SkyCoreTests/golden.json');

/** Mesta: Beograd, Madrid, Sidnej (juzna polulopta), Tromso (preko polarnog kruga -> Whole Sign), Kito (ekvator). */
const MESTA = [
  { ime: 'Beograd', lat: 44.8176, lon: 20.4633 },
  { ime: 'Madrid', lat: 40.4168, lon: -3.7038 },
  { ime: 'Sidnej', lat: -33.8688, lon: 151.2093 },
  { ime: 'Tromso', lat: 69.6492, lon: 18.9553 },
  { ime: 'Kito', lat: -0.1807, lon: -78.4678 },
];

/** Trenuci: zakovani (ne `new Date()`), rasuti od 1950. do 2060, gusce oko danas. */
function trenuci(): Date[] {
  const out: Date[] = [];
  for (let g = 1950; g <= 2060; g += 10) out.push(new Date(Date.UTC(g, (g / 10) % 12, 1 + (g % 27), g % 24, (g * 7) % 60)));
  const pocetak = Date.UTC(2026, 9, 13, 0, 0);
  for (let i = 0; i < 40; i++) out.push(new Date(pocetak + i * (37 * 3600_000 + 13 * 60_000)));
  return out;
}

const z = (x: number) => Number(x.toFixed(9));

const slucajevi = trenuci().map((date, i) => {
  const mesto = MESTA[i % MESTA.length];
  const sky = buildSky(date, mesto.lat, mesto.lon);
  return {
    unix: date.getTime() / 1000,
    mesto: mesto.ime,
    lat: mesto.lat,
    lon: mesto.lon,
    planete: sky.chart.planets.map((p) => ({
      key: p.key, lon: z(p.longitude), brzina: z(p.speed), kuca: p.house,
      znak: signFromLongitude(p.longitude).sign.key, deg: p.position.deg, min: p.position.min,
    })),
    obliquity: z(obliquity(date)),
    ramc: z(rightAscensionMC(date, mesto.lon)),
    asc: z(sky.chart.houses.ascendant),
    mc: z(sky.chart.houses.midheaven),
    kuspide: sky.chart.houses.cusps.map(z),
    fellBack: sky.chart.houses.fellBack,
    cvor: z(trueNodeLongitude(date)),
    cvorBrzina: z(nodeSpeed(date)),
    lilit: z(meanLilithLongitude(date)),
    sreca: z(sky.points.find((p) => p.key === 'fortune')!.longitude),
    faza: z(moonPhase(date).angle),
    aspekti: sky.aspects.map((a) => ({ key: a.contentKey, orb: z(a.orb) })),
    // Razmicanje simbola na krugu — isti ulaz (longitude planeta, ASC levo), dva razmaka.
    // Racun za sat (`src/lib/sat.ts`): vremena u sekundama od 1970.
    sat: (() => {
      const ms = date.getTime();
      const m = moonNow(ms);
      const v = voidOfCourse(ms, m);
      const h = planetaryHour(ms, mesto.lat, mesto.lon);
      const sek = (t: number) => Math.round(t / 1000);
      return {
        mesec: { znak: m.sign, stepen: z(m.degree), usao: sek(m.enteredAt), izlazi: sek(m.ingressAt), osvetljen: z(m.illumination), faza: m.phase, mlad: sek(m.lastNew), dan: m.lunarDay },
        voc: { od: sek(v.start), do: sek(v.end), sada: v.active },
        sat: h && { vladar: h.ruler, sledeci: h.next, od: sek(h.start), do: sek(h.end), indeks: h.index, dan: h.day, izlazak: sek(h.sunrise), zalazak: sek(h.sunset) },
        dogadjaji: upcomingEvents(ms).map((e) => ({
          vrsta: e.kind, kad: sek(e.at),
          telo: 'body' in e ? e.body : '', broj: e.kind === 'moonSign' || e.kind === 'ingress' ? e.sign : e.kind === 'phase' ? e.quarter : e.kind === 'station' ? (e.retrograde ? 1 : 0) : 0,
        })),
      };
    })(),
    razmaknuto: spreadAngles(sky.chart.planets.map((p) => 180 + (p.longitude - sky.chart.houses.ascendant)), 9.5).map(z),
  };
});

const tekst = JSON.stringify({ slucajevi }, null, 1) + '\n';

if (process.argv.includes('--check')) {
  const naDisku = fs.existsSync(FAJL) ? fs.readFileSync(FAJL, 'utf8') : '';
  if (naDisku !== tekst) {
    console.error('✗ golden.json se razlikuje od racuna u src/lib — pokreni `tsx scripts/native/skycore-golden.ts`, pa `swift test`.');
    process.exit(1);
  }
  console.log(`✓ golden.json odgovara racunu aplikacije (${slucajevi.length} trenutaka)`);
} else {
  fs.writeFileSync(FAJL, tekst);
  console.log(`upisano ${slucajevi.length} trenutaka -> ${path.relative(process.cwd(), FAJL)}`);
}
