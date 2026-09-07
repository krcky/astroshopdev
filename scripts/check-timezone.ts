/** Provera konverzije lokalnog vremena rodjenja u UTC. */
import { localBirthToUtc, zoneOffsetMinutes, hasFullIntl, type TimeZoneInfo } from '../src/lib/timezone';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(56)} ${detail}`);
};

const BG: TimeZoneInfo = { name: 'Europe/Belgrade', standardOffsetMinutes: 60, europeanDst: true };
const NY: TimeZoneInfo = { name: 'America/New_York', standardOffsetMinutes: -300, europeanDst: false };

console.log(`\nIntl sa punom bazom zona: ${hasFullIntl ? 'DA' : 'NE'}\n`);

console.log('=== 1. Beograd — poznati slucajevi ===');
const cases: [string, number, number, number, number, number, string][] = [
  ['leto (CEST, UTC+2)',  1990, 6, 15, 14, 30, '1990-06-15T12:30:00.000Z'],
  ['zima (CET, UTC+1)',   1990, 1, 15, 14, 30, '1990-01-15T13:30:00.000Z'],
  ['danas (CEST)',        2026, 9,  3, 12,  0, '2026-09-03T10:00:00.000Z'],
  ['ponoc, zima',         1985,12, 31, 23, 45, '1985-12-31T22:45:00.000Z'],
];
for (const [label, y, mo, d, h, mi, expect] of cases) {
  const got = localBirthToUtc(y, mo, d, h, mi, BG).toISOString();
  ok(got === expect, label, `${got}`);
}

console.log('\n=== 2. Granice prelaska na letnje vreme (2026) ===');
// EU menja sat poslednje nedelje marta / oktobra u 01:00 UTC
ok(zoneOffsetMinutes(new Date('2026-03-29T00:59:00Z'), BG) === 60,  'sat pre prelaska: UTC+1');
ok(zoneOffsetMinutes(new Date('2026-03-29T01:01:00Z'), BG) === 120, 'sat posle prelaska: UTC+2');
ok(zoneOffsetMinutes(new Date('2026-10-25T00:59:00Z'), BG) === 120, 'pre povratka: UTC+2');
ok(zoneOffsetMinutes(new Date('2026-10-25T01:01:00Z'), BG) === 60,  'posle povratka: UTC+1');

console.log('\n=== 3. Rezervno pravilo mora da se slaze sa Intl ===');
// Ako Hermes nema punu bazu zona, koristi se eksplicitno evropsko pravilo.
// Ono mora dati IDENTICAN rezultat kao Intl za svaki dan od 1996. naovamo.
if (hasFullIntl) {
  let mismatch = 0, checked = 0, firstBad = '';
  for (let y = 1996; y <= 2030; y++) {
    for (let doy = 0; doy < 365; doy += 1) {
      const d = new Date(Date.UTC(y, 0, 1 + doy, 12, 0, 0));
      const a = zoneOffsetMinutes(d, BG, false);
      const b = zoneOffsetMinutes(d, BG, true);
      checked++;
      if (a !== b) { mismatch++; if (!firstBad) firstBad = d.toISOString(); }
    }
  }
  ok(mismatch === 0, `rezerva = Intl za sve dane 1996—2030`, `provereno ${checked} dana${firstBad ? ', prvo neslaganje ' + firstBad : ''}`);
} else {
  console.log('     (preskoceno — Intl nije dostupan u ovom runtime-u)');
}

console.log('\n=== 4. Zona van Evrope ===');
const nyJul = localBirthToUtc(1990, 7, 4, 12, 0, NY).toISOString();
const nyJan = localBirthToUtc(1990, 1, 4, 12, 0, NY).toISOString();
ok(nyJul === '1990-07-04T16:00:00.000Z', 'Njujork leto (EDT, UTC-4)', nyJul);
ok(nyJan === '1990-01-04T17:00:00.000Z', 'Njujork zima (EST, UTC-5)', nyJan);

console.log('\n=== 5. Zasto je ovo vazno ===');
const a = localBirthToUtc(1990, 6, 15, 14, 30, BG);
const b = localBirthToUtc(1990, 6, 15, 15, 30, BG);
console.log(`  Sat razlike u vremenu rodjenja = ${((b.getTime() - a.getTime()) / 3600000)} h razlike u UTC`);
console.log(`  Zemlja se okrene 15°/h -> ascendent se pomeri za ~15° (pola znaka)`);

console.log(`\n${fail === 0 ? 'SVE PROSLO' : fail + ' TESTOVA PALO'}\n`);
process.exit(fail === 0 ? 0 : 1);
