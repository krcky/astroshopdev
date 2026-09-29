/**
 * Druge osobe — cist racun iz `src/lib/osobe.ts` (granica, ko je otvoren, poruke).
 * Pokreni: npm run check:osobe
 *
 * Prava i granicu u bazi proverava `scripts/check-osobe-baza.ts` (PGlite).
 */
import {
  ODNOSI, granicaOsoba, mozeDaDoda, nazivOdnosa, otvoreneOsobe, poRedu, porukaOsobe, type Osoba,
} from '../src/lib/osobe';
import { BESPLATNO, PREMIUM } from '../src/lib/pristup';
import { cityByName } from '../src/lib/cities';
import { gradProfila, resolveProfile, type Profile } from '../src/store/profile';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};

console.log('\n1. Granica');
ok(granicaOsoba(false) === 1 && BESPLATNO.osobe === 1, 'besplatno 1 (Ivan, 29.9.2026)');
ok(granicaOsoba(true) === 10 && PREMIUM.osobe === 10, 'Premium 10');
ok(mozeDaDoda(0, false) && !mozeDaDoda(1, false), 'besplatni: prva da, druga ne');
ok(mozeDaDoda(9, true) && !mozeDaDoda(10, true), 'Premium: deseta da, jedanaesta ne');

console.log('\n2. Ko je otvoren');
const o = (id: string, createdAt: string) => ({ id, createdAt });
const spisak = [o('c', '2026-09-03'), o('a', '2026-09-01'), o('b', '2026-09-02')];
ok(poRedu(spisak).map((x) => x.id).join('') === 'abc', 'redom dodavanja, najstarija prva');
ok(poRedu([o('z', '2026-09-01'), o('y', '2026-09-01')]).map((x) => x.id).join('') === 'yz', 'isti trenutak: stalan redosled po id-u');
ok([...otvoreneOsobe(spisak, false)].join('') === 'a', 'bez Premium-a otvorena samo PRVA dodata');
ok(otvoreneOsobe(spisak, true).size === 3, 'uz Premium sve');
const jedanaest = Array.from({ length: 11 }, (_, i) => o(`p${String(i).padStart(2, '0')}`, `2026-09-${String(i + 1).padStart(2, '0')}`));
ok(otvoreneOsobe(jedanaest, true).size === 10 && !otvoreneOsobe(jedanaest, true).has('p10'), 'i uz Premium najvise 10 (visak iz baze je zakljucan)');
ok(otvoreneOsobe([], false).size === 0, 'prazan spisak');

console.log('\n3. Odnos i poruke');
ok(nazivOdnosa('partner') === 'Partner' && nazivOdnosa('brat_sestra') === 'Brat ili sestra', 'naziv odnosa');
ok(nazivOdnosa('drugo') === null && nazivOdnosa(null) === null, '"Neko drugi" i neizabran: bez naziva');
ok(new Set(ODNOSI.map((x) => x.key)).size === ODNOSI.length, 'kljucevi odnosa jedinstveni');
ok(/Premium/.test(porukaOsobe('granica_osoba')), 'granica -> Premium', porukaOsobe('granica_osoba'));
ok(/internet/.test(porukaOsobe('TypeError: Network request failed')), 'mreza -> internet');
ok(/Prijava je istekla/.test(porukaOsobe('JWT expired')), 'istekla prijava');
ok(!/[a-z]+_[a-z]+/.test(porukaOsobe('nesto_drugo')), 'nepoznata greska bez tehnickih reci', porukaOsobe('nesto_drugo'));

console.log('\n4. Osoba je profil — ista karta, isti grad');
const beograd = cityByName('Beograd')!;
const ana: Osoba = {
  id: 'x', odnos: 'partner', createdAt: '2026-09-29',
  name: 'Ana', birth: { year: 1990, month: 7, day: 10 }, time: { hour: 14, minute: 30 },
  cityId: beograd.id, cityName: beograd.name, latitude: beograd.latitude, longitude: beograd.longitude, timeZone: beograd.tz.name,
};
const kaoProfil: Profile = { ...ana };
const r1 = resolveProfile(ana)!;
const r2 = resolveProfile(kaoProfil)!;
ok(r1.chart.ascendantSign.formatted === r2.chart.ascendantSign.formatted && r1.utc.getTime() === r2.utc.getTime(), 'osoba i profil sa istim podacima = ista karta');
ok(resolveProfile({ ...ana, time: null })!.timeUnknown, 'bez vremena: Whole Sign i timeUnknown (pravilo 5)');
// Grad dijaspore nije u ugradjenoj listi — izmena ga ne sme izgubiti (ranije: `cityById` -> null).
const bec: Profile = { ...kaoProfil, cityId: 2761369, cityName: 'Beč', latitude: 48.2085, longitude: 16.3721, timeZone: 'Europe/Vienna' };
const g = gradProfila(bec);
ok(!!g && g.name === 'Beč' && g.latitude === 48.2085 && g.tz.name === 'Europe/Vienna', 'grad dijaspore ostaje iz sacuvanih koordinata', g ? `${g.name} ${g.latitude}` : 'null');

console.log(fail ? `\n${fail} PROVERA PALO` : '\nSve provere prosle.');
process.exit(fail ? 1 : 0);
