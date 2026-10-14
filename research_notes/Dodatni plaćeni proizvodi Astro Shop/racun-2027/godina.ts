// Throwaway: koliko tranzita (orbis liste) ima 2027. za tri probne karte. Ne dira repo.
import * as Astronomy from 'astronomy-engine';
import { buildNatalChart, houseOf } from '@/lib/natal';
import { localBirthToUtc } from '@/lib/timezone';
import { aktivniTranziti, LISTA_ORB } from '@/lib/oblasti';
import { bodyLongitude, BODIES, type PlanetKey } from '@/lib/astro';
import { phaseDay } from '@/lib/moon';
import { natalTargets } from '@/lib/transits';
import { trueNodeLongitude, meanLilithLongitude } from '@/lib/points';

const BG = { name: 'Europe/Belgrade', standardOffsetMinutes: 60, europeanDst: true };
const ZG = { name: 'Europe/Zagreb', standardOffsetMinutes: 60, europeanDst: true };
const SAMPLES = [
  { ime: 'Beograd 15.6.1990 14:30', y: 1990, m: 6, d: 15, h: 14, mi: 30, lat: 44.804, lon: 20.4651, tz: BG, unknown: false },
  { ime: 'Zagreb 3.1.1985 08:00', y: 1985, m: 1, d: 3, h: 8, mi: 0, lat: 45.8144, lon: 15.978, tz: ZG, unknown: false },
  { ime: 'Nis 22.11.1978 vreme nepoznato', y: 1978, m: 11, d: 22, h: 12, mi: 0, lat: 43.3247, lon: 21.9033, tz: BG, unknown: true },
];
const SLOW: PlanetKey[] = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const FAST: PlanetKey[] = ['sun', 'mercury', 'venus'];
const SHORT_MISSING = new Set(['transit.pluto.square.natal.ascendant']);
const LONG_MISSING = new Set(['transit.pluto.square.natal.ascendant', 'transit.pluto.trine.natal.pluto']);
const LONG_PLACEHOLDER = new Set(['transit.pluto.conjunction.natal.neptune', 'transit.pluto.opposition.natal.pluto']);
const day = (i: number) => new Date(2027, 0, 1 + i); // TZ=Europe/Belgrade
const NDAYS = 365;
const fmt = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`;

const out: string[] = [];
const log = (s: string) => { out.push(s); console.log(s); };

for (const s of SAMPLES) {
  const utc = localBirthToUtc(s.y, s.m, s.d, s.h, s.mi, s.tz);
  const chart = buildNatalChart({ date: utc, latitude: s.lat, longitude: s.lon }, s.unknown ? 'whole-sign' : 'placidus');
  log(`\n=== ${s.ime} | ASC ${s.unknown ? '-' : chart.ascendantSign.sign.key + ' ' + chart.ascendantSign.degree.toFixed(1)} | Sunce ${chart.planets.find(p=>p.key==='sun')!.position.sign.key}`);
  // dan po dan: aktivni tranziti orbisom liste (Mesec iskljucen kao u aplikaciji)
  const runs = new Map<string, { planet: PlanetKey; passes: { start: number; end: number; exact: number[] }[] }>();
  const perDay: number[] = [];
  for (let i = -1; i <= NDAYS; i++) {
    const list = aktivniTranziti(chart, day(i), s.unknown, LISTA_ORB);
    if (i >= 0 && i < NDAYS) perDay.push(list.length);
    if (i < 0 || i >= NDAYS) continue;
    for (const r of list) {
      let e = runs.get(r.key);
      if (!e) { e = { planet: r.transiting.key, passes: [] }; runs.set(r.key, e); }
      const last = e.passes[e.passes.length - 1];
      if (last && last.end === i - 1) last.end = i; else e.passes.push({ start: i, end: i, exact: [] });
      if (r.exact) e.passes[e.passes.length - 1].exact.push(i);
    }
  }
  const grp = (keys: PlanetKey[]) => [...runs.entries()].filter(([, v]) => keys.includes(v.planet));
  const sum = (arr: [string, any][]) => ({
    tranzita: arr.length,
    prolaza: arr.reduce((a, [, v]) => a + v.passes.length, 0),
    egzaktnih: arr.reduce((a, [, v]) => a + v.passes.reduce((b: number, p: any) => b + p.exact.length, 0), 0),
    viseEgzaktnih: arr.filter(([, v]) => v.passes.reduce((b: number, p: any) => b + p.exact.length, 0) >= 2).length,
  });
  log(`spore (Jup-Plu): ${JSON.stringify(sum(grp(SLOW)))}`);
  log(`Mars: ${JSON.stringify(sum(grp(['mars'])))}`);
  log(`brze (Sun/Mer/Ven): ${JSON.stringify(sum(grp(FAST)))}`);
  log(`ukupno bez Meseca: ${JSON.stringify(sum([...runs.entries()]))}`);
  log(`aktivnih po danu: min ${Math.min(...perDay)} / prosek ${(perDay.reduce((a, b) => a + b, 0) / perDay.length).toFixed(1)} / max ${Math.max(...perDay)}`);
  const exactSlow = grp([...SLOW]).filter(([, v]) => v.passes.some((p: any) => p.exact.length)).length;
  log(`spori tranziti sa bar jednim egzaktnim danom u 2027: ${exactSlow}`);
  log('spori tranziti (start-kraj u 2027 po prolazima; * = egzaktan dan):');
  for (const [k, v] of grp(SLOW)) {
    log(`  ${k.replace('transit.', '').replace('.natal', '')}: ` + v.passes.map((p: any) => `${fmt(day(p.start))}-${fmt(day(p.end))}${p.exact.length ? ' *' + p.exact.map((x: number) => fmt(day(x))).join(',') : ''}`).join(' | '));
  }
  const keys = [...runs.keys()];
  log(`kljucevi bez kratkog teksta: ${keys.filter((k) => SHORT_MISSING.has(k)).join(',') || 'nijedan'}; bez dugog: ${keys.filter((k) => LONG_MISSING.has(k)).join(',') || 'nijedan'}; dugi = napomena: ${keys.filter((k) => LONG_PLACEHOLDER.has(k)).join(',') || 'nijedan'}`);
  const asc = keys.filter((k) => k.endsWith('ascendant') || k.endsWith('midheaven')).length;
  log(`tranziti na ASC/MC (kratki tekst = NACRT): ${asc} od ${keys.length}`);

  // Mesec: tacni aspekti na natalne mete (procena broja u godini)
  const targets = natalTargets(chart).filter((n) => !(s.unknown && (n.key === 'ascendant' || n.key === 'midheaven')));
  let moonHits = 0;
  const ANG = [0, 60, 90, 120, 180, 240, 270, 300];
  for (let i = 0; i < NDAYS * 4; i++) {
    const a = bodyLongitude('moon', new Date(day(0).getTime() + i * 6 * 3600e3));
    const b = bodyLongitude('moon', new Date(day(0).getTime() + (i + 1) * 6 * 3600e3));
    for (const n of targets) for (const g of ANG) {
      const da = ((a - n.longitude - g + 540) % 360) - 180, db = ((b - n.longitude - g + 540) % 360) - 180;
      if (da < 0 && db >= 0 && db - da < 90) moonHits++;
    }
  }
  log(`Mesec: tacnih aspekata na natalne mete u 2027: ${moonHits}`);

  // ulasci sporih planeta u natalne kuce (Placidus) — tekstovi transit.X.in.house.N (0/120)
  if (!s.unknown) {
    const ing: string[] = [];
    for (const k of ['mars', ...SLOW] as PlanetKey[]) {
      let h0 = houseOf(bodyLongitude(k, day(0)), chart.houses);
      for (let i = 1; i <= NDAYS; i++) {
        const h = houseOf(bodyLongitude(k, day(i)), chart.houses);
        if (h !== h0) { ing.push(`${k}->${h} (${fmt(day(i))})`); h0 = h; }
      }
    }
    log(`ulasci Mars..Pluton u natalne kuce 2027: ${ing.length}: ${ing.join(', ')}`);
  }

  // pomracenja 2027 na natalne tacke (konjunkcija/opozicija <= 3 i <= 5 stepeni)
  const ecl: string[] = [];
  let le = Astronomy.SearchLunarEclipse(new Date(2027, 0, 1));
  while (le.peak.date.getFullYear() === 2027) {
    const lonMoon = bodyLongitude('moon', le.peak.date);
    for (const n of targets) {
      const d = Math.abs(((lonMoon - n.longitude + 540) % 360) - 180);
      const o = Math.abs(((lonMoon - n.longitude + 360) % 360) - 180);
      if (d <= 5) ecl.push(`L ${fmt(le.peak.date)} konj ${n.key} ${d.toFixed(1)}°`);
      if (o <= 5) ecl.push(`L ${fmt(le.peak.date)} opoz ${n.key} ${o.toFixed(1)}°`);
    }
    le = Astronomy.NextLunarEclipse(le.peak);
  }
  let se = Astronomy.SearchGlobalSolarEclipse(new Date(2027, 0, 1));
  while (se.peak.date.getFullYear() === 2027) {
    const lonSun = bodyLongitude('sun', se.peak.date);
    for (const n of targets) {
      const d = Math.abs(((lonSun - n.longitude + 540) % 360) - 180);
      const o = Math.abs(((lonSun - n.longitude + 360) % 360) - 180);
      if (d <= 5) ecl.push(`S ${fmt(se.peak.date)} konj ${n.key} ${d.toFixed(1)}°`);
      if (o <= 5) ecl.push(`S ${fmt(se.peak.date)} opoz ${n.key} ${o.toFixed(1)}°`);
    }
    se = Astronomy.NextGlobalSolarEclipse(se.peak.date);
  }
  log(`pomracenja 2027 u 5° od natalne tacke (konj/opoz): ${ecl.join('; ') || 'nijedno'}`);

  // solarni povratak 2027
  const natalSun = chart.planets.find((p) => p.key === 'sun')!.longitude;
  let lo = new Date(2027, s.m - 1, s.d - 3).getTime(), hi = new Date(2027, s.m - 1, s.d + 3).getTime();
  const f = (t: number) => ((bodyLongitude('sun', new Date(t)) - natalSun + 540) % 360) - 180;
  for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid; }
  const sr = buildNatalChart({ date: new Date(hi), latitude: s.lat, longitude: s.lon });
  log(`solarni povratak 2027: ${new Date(hi).toISOString()} (Beograd/mesto rodjenja: ASC ${sr.ascendantSign.sign.key} ${sr.ascendantSign.degree.toFixed(1)})`);

  // sekundarne progresije: progresivno Sunce i Mesec 1.1.2027 i 31.12.2027 (dan po godini)
  const age0 = (day(0).getTime() - utc.getTime()) / (365.2422 * 864e5);
  const age1 = (day(NDAYS).getTime() - utc.getTime()) / (365.2422 * 864e5);
  const pr = (age: number, k: PlanetKey) => bodyLongitude(k, new Date(utc.getTime() + age * 864e5));
  const zn = (l: number) => ['ari','tau','gem','can','leo','vir','lib','sco','sag','cap','aqu','pis'][Math.floor(l / 30)] + ' ' + (l % 30).toFixed(1);
  log(`progresivni Mesec 2027: ${zn(pr(age0, 'moon'))} -> ${zn(pr(age1, 'moon'))}; progresivno Sunce: ${zn(pr(age0, 'sun'))} -> ${zn(pr(age1, 'sun'))}`);

  // cvor i Lilit: koliko bi tranzita bilo na natalni cvor (da postoje u targets)
  const natalNode = trueNodeLongitude(utc), natalLil = meanLilithLongitude(utc);
  let nodeHits = 0;
  for (const k of ['mars', ...SLOW] as PlanetKey[]) for (const g of [0, 60, 90, 120, 180, 240, 270, 300]) for (const tgt of [natalNode, natalLil]) {
    for (let i = 0; i < NDAYS; i++) {
      const a = ((bodyLongitude(k, day(i)) - tgt - g + 540) % 360) - 180, b = ((bodyLongitude(k, day(i + 1)) - tgt - g + 540) % 360) - 180;
      if (a * b <= 0 && Math.abs(a) < 20) nodeHits++;
    }
  }
  log(`egzaktni aspekti Mars..Pluton na natalni cvor i Lilit 2027 (nema tekstova): ${nodeHits}`);
}

// opste nebo 2027
log('\n=== OPSTE NEBO 2027');
const lunar: string[] = [];
let le = Astronomy.SearchLunarEclipse(new Date(2027, 0, 1));
while (le.peak.date.getFullYear() === 2027) { lunar.push(`${le.peak.date.toISOString().slice(0, 10)} ${le.kind} (Mesec ${bodyLongitude('moon', le.peak.date).toFixed(1)}°)`); le = Astronomy.NextLunarEclipse(le.peak); }
log(`pomracenja Meseca: ${lunar.join('; ')}`);
const solar: string[] = [];
let se = Astronomy.SearchGlobalSolarEclipse(new Date(2027, 0, 1));
while (se.peak.date.getFullYear() === 2027) { solar.push(`${se.peak.date.toISOString().slice(0, 10)} ${se.kind} (Sunce ${bodyLongitude('sun', se.peak.date).toFixed(1)}°)`); se = Astronomy.NextGlobalSolarEclipse(se.peak.date); }
log(`pomracenja Sunca: ${solar.join('; ')}`);
const loc = Astronomy.SearchLocalSolarEclipse(new Date(2027, 0, 1), new Astronomy.Observer(44.804, 20.4651, 100));
log(`prvo lokalno pomracenje Sunca iz Beograda od 1.1.2027: ${loc.peak.time.date.toISOString()} ${loc.kind} obskuracija ${(loc.obscuration * 100).toFixed(0)}%`);
// stanice i ulasci
const st: string[] = []; let ingN = 0;
for (const b of BODIES) {
  if (b.key === 'moon') continue;
  let z0 = Math.floor(bodyLongitude(b.key, day(0)) / 30);
  let v0 = ((bodyLongitude(b.key, new Date(day(0).getTime() + 3600e3)) - bodyLongitude(b.key, day(0)) + 540) % 360) - 180;
  for (let i = 1; i <= NDAYS * 4; i++) {
    const t = new Date(day(0).getTime() + i * 6 * 3600e3);
    const z = Math.floor(bodyLongitude(b.key, t) / 30);
    const v = ((bodyLongitude(b.key, new Date(t.getTime() + 3600e3)) - bodyLongitude(b.key, t) + 540) % 360) - 180;
    if (z !== z0) { ingN++; z0 = z; }
    if (b.key !== 'sun' && (v < 0) !== (v0 < 0)) st.push(`${b.key} ${v < 0 ? 'R' : 'D'} ${fmt(t)}`);
    v0 = v;
  }
}
log(`ulazaka planeta (bez Meseca) u znak 2027: ${ingN}`);
log(`stanice 2027: ${st.join(', ')}`);
// lunarni kalendar: koliko razlicitih (faza, znak) kombinacija
const combos = new Set<string>(); let newFull = 0;
for (let i = 0; i < NDAYS; i++) {
  const p = phaseDay(new Date(day(i).getTime() + 12 * 3600e3));
  combos.add(`${p.textPhase}.${Math.floor(bodyLongitude('moon', new Date(day(i).getTime() + 12 * 3600e3)) / 30)}`);
  if (p.key === 'new' || p.key === 'full') newFull++;
}
log(`lunarni kalendar 2027: ${combos.size} razlicitih (faza, znak) kombinacija od 84 moguce; dana sa Mladim/Punim Mesecom: ${newFull}`);
