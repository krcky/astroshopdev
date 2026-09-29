/**
 * Provere "Pitaj astrologa" — cist racun iz `src/lib/pitanja.ts`.
 * Pokreni: npm run check:pitanja
 *
 * Prava pristupa u bazi proverava `scripts/check-pitanja-baza.ts` (PGlite).
 */
import { cityByName } from '../src/lib/cities';
import { buildNatalChart } from '../src/lib/natal';
import { natalAspects } from '../src/lib/natal-keys';
import { localBirthToUtc } from '../src/lib/timezone';
import {
  PITANJE_MAX, brojNeprocitanih, datumPitanja, imaOdgovor, natpisStatusa, neprocitan, oKome, pitanjeSpremno, porukaGreske,
  snimakKarte, snimakODrugoj, trajanjeZvuka,
} from '../src/lib/pitanja';
import type { ResolvedProfile, Profile } from '../src/store/profile';
import { vrstaSnimka } from '../panel/src/pomoc';
import { cistoIme, kadBeograd, mejlZaAstrologa } from '../supabase/functions/_shared/obavestenje';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};

// --- 1. Da li pitanje moze da se posalje ------------------------------------
console.log('\n1. Pitanje spremno za slanje');
ok(!pitanjeSpremno(''), 'prazno ne ide');
ok(!pitanjeSpremno('   \n  '), 'samo razmaci ne idu');
ok(pitanjeSpremno('  Da li?  '), 'razmaci oko teksta se ne racunaju');
ok(pitanjeSpremno('a'.repeat(PITANJE_MAX)), `tacno ${PITANJE_MAX} znakova ide`);
ok(!pitanjeSpremno('a'.repeat(PITANJE_MAX + 1)), `${PITANJE_MAX + 1} ne ide (isto kao baza)`);
ok(pitanjeSpremno(` ${'ž'.repeat(PITANJE_MAX)} `), 'dijakritika se broji kao jedan znak');

// --- 2. Stanja u listi ------------------------------------------------------
console.log('\n2. Natpisi stanja (bez "kasni" — roka nema)');
const PROC = '2026-09-29T10:00:00Z';
ok(natpisStatusa({ status: 'draft', audio_putanja: null, procitano_at: null }) === 'Nije poslato', 'nacrt');
ok(natpisStatusa({ status: 'paid', audio_putanja: null, procitano_at: null }) === 'Čeka odgovor', 'placeno');
ok(natpisStatusa({ status: 'answered', audio_putanja: 'a/b.m4a', procitano_at: null }) === 'Novi odgovor', 'odgovoreno, neotvoreno: "Novi odgovor"');
ok(natpisStatusa({ status: 'answered', audio_putanja: 'a/b.m4a', procitano_at: PROC }) === 'Odgovoreno', 'odgovoreno i otvoreno');
ok(natpisStatusa({ status: 'refunded', audio_putanja: null, procitano_at: null }) === 'Novac je vraćen', 'povracaj pre odgovora');
ok(natpisStatusa({ status: 'refunded', audio_putanja: 'a/b.m4a', procitano_at: PROC }) === 'Odgovoreno', 'povracaj posle odgovora: odgovor ostaje');
ok(imaOdgovor({ audio_putanja: 'a/b.m4a' }) && !imaOdgovor({ audio_putanja: null }), 'odgovor = postoji snimak');

console.log('\n2b. Novi odgovori (oznaka na tabu)');
ok(neprocitan({ audio_putanja: 'a/b.m4a', procitano_at: null }), 'snimak bez "procitano" je nov');
ok(!neprocitan({ audio_putanja: null, procitano_at: null }), 'bez snimka nema novog odgovora');
ok(brojNeprocitanih([
  { audio_putanja: 'a.m4a', procitano_at: null },
  { audio_putanja: 'b.m4a', procitano_at: PROC },
  { audio_putanja: null, procitano_at: null },
  { audio_putanja: 'c.m4a', procitano_at: null },
]) === 2, 'broji samo neotvorene odgovore');
ok(brojNeprocitanih(undefined) === 0, 'bez liste nema oznake');

// --- 3. Datum i trajanje ----------------------------------------------------
console.log('\n3. Datum i trajanje');
const danas = new Date(2026, 8, 29, 12);
ok(datumPitanja({ created_at: '2026-09-20T10:00:00Z', paid_at: '2026-09-24T10:00:00Z', answered_at: null }, danas) === '24. sep', 'ceka odgovor: datum slanja');
ok(datumPitanja({ created_at: '2026-09-20T10:00:00Z', paid_at: '2026-09-24T10:00:00Z', answered_at: '2026-09-27T10:00:00Z' }, danas) === '27. sep', 'odgovoreno: datum odgovora');
ok(datumPitanja({ created_at: '2026-09-20T10:00:00Z', paid_at: null, answered_at: null }, danas) === '20. sep', 'nacrt: datum pisanja');
ok(trajanjeZvuka(0) === '0:00' && trajanjeZvuka(95) === '1:35' && trajanjeZvuka(600) === '10:00', '0:00, 1:35, 10:00');
ok(trajanjeZvuka(59.9) === '0:59' && trajanjeZvuka(-3) === '0:00', 'odseca, ne zaokruzuje; negativno je 0');

// --- 4. Poruke o gresci -----------------------------------------------------
console.log('\n4. Greske servera na srpskom');
ok(/prazno/i.test(porukaGreske('prazno_pitanje')), 'prazno_pitanje');
ok(porukaGreske('predugo_pitanje').includes(String(PITANJE_MAX)), 'predugo_pitanje kaze granicu');
ok(PITANJE_MAX === 500, 'granica je 500 znakova (Ivan, 29.9.2026)');
ok(/već poslato/.test(porukaGreske('nema_nacrta')), 'nema_nacrta');
ok(/sačuvano na telefonu/.test(porukaGreske('TypeError: Network request failed')), 'mreza: tekst je na telefonu');
ok(!/_/.test(porukaGreske('nesto_nepoznato')), 'nepoznata greska ne prikazuje tehnicki kod');

// --- 5. Snimak karte za astrologa ---------------------------------------------
console.log('\n5. Snimak karte');
const beograd = cityByName('Beograd')!;
function razresi(time: Profile['time'], zoneUnreliable = false): ResolvedProfile {
  const profile: Profile = {
    name: 'Ana', birth: { year: 1990, month: 7, day: 10 }, time,
    cityId: beograd.id, cityName: beograd.name, latitude: beograd.latitude, longitude: beograd.longitude, timeZone: beograd.tz.name,
  };
  const t = time ?? { hour: 12, minute: 0 };
  const utc = localBirthToUtc(1990, 7, 10, t.hour, t.minute, beograd.tz);
  const chart = buildNatalChart({ date: utc, latitude: beograd.latitude, longitude: beograd.longitude }, time ? 'placidus' : 'whole-sign');
  return { profile, city: beograd, utc, chart, timeUnknown: time === null, zoneUnreliable };
}

const r = razresi({ hour: 14, minute: 30 });
const s = snimakKarte(r);
ok(s.verzija === 1 && s.ime === 'Ana', 'verzija i ime');
ok(s.rodjenje.datum === '1990-07-10' && s.rodjenje.vreme === '14:30', 'datum i vreme rodjenja', `${s.rodjenje.datum} ${s.rodjenje.vreme}`);
ok(s.rodjenje.utc === r.utc.toISOString() && s.rodjenje.zona === 'Europe/Belgrade', 'UTC i zona');
ok(s.planete.length === r.chart.planets.length, 'sve planete', String(s.planete.length));
ok(s.planete.every((p, i) => p.stepen === r.chart.planets[i].position.formatted && p.kuca === r.chart.planets[i].house), 'stepen i kuca isti kao u tabu "Ti"');
ok(s.ascendent?.stepen === r.chart.ascendantSign.formatted && s.mc?.stepen === r.chart.midheavenSign.formatted, 'ascendent i MC', s.ascendent?.stepen);
ok(s.kuce?.length === 12 && s.kuce[0].stepen === r.chart.ascendantSign.formatted, '12 kuca, prva = ascendent');
ok(s.sistemKuca === 'placidus', 'Placidus');
ok(s.aspekti.length === natalAspects(r.chart, false).length && s.aspekti.length > 0, 'isti aspekti kao u tabu "Ti"', String(s.aspekti.length));
ok(s.aspekti.every((a) => /^\d+,\d°$/.test(a.orbis)), 'orbis sa zarezom: "2,4°"', s.aspekti[0]?.orbis);
const velicina = Buffer.byteLength(JSON.stringify(s));
ok(velicina < 40000, 'staje u ogranicenje baze (40 000 bajtova)', `${velicina} B`);
ok(JSON.stringify(JSON.parse(JSON.stringify(s))) === JSON.stringify(s), 'prolazi kroz JSON bez gubitka');

const bez = snimakKarte(razresi(null));
ok(bez.vremeNepoznato && bez.rodjenje.vreme === null, 'bez vremena: vreme je null');
ok(bez.ascendent === null && bez.mc === null && bez.kuce === null && bez.sistemKuca === null, 'bez vremena: nema ascendenta, MC ni kuca');
ok(bez.planete.every((p) => p.kuca === null), 'bez vremena: planete bez kuca');
ok(!bez.aspekti.some((a) => a.a === 'Mesec' || a.b === 'Mesec'), 'bez vremena: Mesecevi aspekti se ne salju');
ok(!bez.aspekti.some((a) => a.b === 'Ascendent'), 'bez vremena: nema aspekata na Ascendent');

const zona = snimakKarte(razresi({ hour: 14, minute: 30 }, true));
ok(zona.zonaNepouzdana && zona.planete.length === 0 && zona.aspekti.length === 0 && zona.kuce === null, 'nepouzdana zona: karta se ne salje');
ok(zona.rodjenje.datum === '1990-07-10', 'nepouzdana zona: podaci o rodjenju ostaju');

// --- 5b. Pitanje o drugoj osobi (snimak v2, 29.9.2026) ----------------------
console.log('\n5b. Pitanje o drugoj osobi');
const marko = { ...razresi(null), profile: { ...razresi(null).profile, name: 'Marko' } };
const oMarku = snimakODrugoj(marko, 'partner', r, false);
ok(oMarku.verzija === 2 && oMarku.ime === 'Marko', 'v2, karta je osobe o kojoj se pita', oMarku.ime);
ok(oMarku.drugaOsoba?.pita === 'Ana' && oMarku.drugaOsoba?.odnos === 'Partner', 'ko pita i odnos', JSON.stringify({ ...oMarku.drugaOsoba, mojaKarta: null }));
ok(oMarku.drugaOsoba?.mojaKarta === null, 'samo o njemu: bez karte onoga ko pita');
ok(oMarku.vremeNepoznato && oMarku.ascendent === null, 'pravila 4 i 5 vaze i za drugu osobu (bez vremena nema ascendenta)');
const par = snimakODrugoj(marko, 'drugo', r, true);
ok(par.drugaOsoba?.mojaKarta?.ime === 'Ana' && par.drugaOsoba.mojaKarta.verzija === 1, 'o odnosu: i karta onoga ko pita');
ok(par.drugaOsoba?.odnos === null, '"Neko drugi" se astrologu ne pise kao odnos');
ok(snimakKarte(r).drugaOsoba === undefined && snimakKarte(r).verzija === 1, 'pitanje o sebi ostaje v1, bez `drugaOsoba`');
const vel2 = Buffer.byteLength(JSON.stringify(snimakODrugoj(razresi({ hour: 14, minute: 30 }), 'dete', r, true)));
ok(vel2 < 40000, 'dve karte staju u ogranicenje baze (40 000 bajtova)', `${vel2} B`);
ok(oKome({ karta_pita: null, karta_ime: 'Ana', karta_par: null }) === null, 'lista: pitanje o sebi bez oznake');
ok(oKome({ karta_pita: 'Ana', karta_ime: 'Marko', karta_par: null }) === 'Marko', 'lista: o drugoj osobi — njeno ime');
ok(oKome({ karta_pita: 'Ana', karta_ime: 'Marko', karta_par: 'Ana' }) === 'Ja i Marko', 'lista: o odnosu — "Ja i Marko"');
ok(/više nije na tvojoj listi/.test(porukaGreske('nema_osobe')), 'greska nema_osobe na srpskom');

// --- 6. Otpremanje snimka sa telefona (panel) -------------------------------
console.log('\n6. Formati snimka sa telefona');
const vrsta = (ime: string, mime = '') => { const v = vrstaSnimka(ime, mime); return 'greska' in v ? 'greska' : `${v.ext} ${v.tip}`; };
ok(vrsta('Nova snimka 12.m4a', 'audio/x-m4a') === 'm4a audio/mp4', 'Diktafon na iPhone-u (.m4a)');
ok(vrsta('Voice 001.M4A') === 'm4a audio/mp4', 'nastavak velikim slovima, bez MIME-a');
ok(vrsta('snimak.mp3', 'audio/mpeg') === 'mp3 audio/mpeg', 'mp3');
ok(vrsta('Recording_20260929.aac') === 'aac audio/aac', 'aac ostaje aac (ne preimenuje se u m4a)');
ok(vrsta('odgovor', 'audio/mp4') === 'm4a audio/mp4', 'bez nastavka: po MIME-u');
ok(vrsta('PTT-20260929.opus', 'audio/ogg') === 'greska', 'WhatsApp opus se odbija');
ok(vrsta('snimak.amr') === 'greska' && vrsta('snimak.wav', 'audio/wav') === 'greska', 'amr i wav se odbijaju');
const zasto = vrstaSnimka('x.ogg', '');
ok('greska' in zasto && /iPhone ne pušta/.test(zasto.greska) && /m4a, mp3 ili aac/.test(zasto.greska), 'poruka kaze zasto i sta da posalje');

// --- 7. Mejl astrologu ---------------------------------------------------------
console.log('\n7. Mejl astrologu o novom pitanju');
ok(kadBeograd('2026-09-29T12:05:00Z') === '29. septembra u 14:05', 'letnje vreme: UTC+2', kadBeograd('2026-09-29T12:05:00Z'));
ok(kadBeograd('2026-12-01T12:05:00Z') === '1. decembra u 13:05', 'zimsko vreme: UTC+1', kadBeograd('2026-12-01T12:05:00Z'));
ok(kadBeograd('2026-09-29T22:30:00Z') === '30. septembra u 00:30', 'posle ponoci je sledeci dan u Beogradu', kadBeograd('2026-09-29T22:30:00Z'));
const ID = '10000000-0000-4000-8000-000000000001';
const m1 = mejlZaAstrologa({ id: ID, ime: 'Ana', poslato: '2026-09-29T12:05:00Z', sandbox: false }, 'https://panel.astroshop.rs/');
ok(m1.naslov === 'Novo pitanje: Ana', 'naslov sa imenom', m1.naslov);
ok(m1.link === `https://panel.astroshop.rs/#/pitanje/${ID}`, 'link vodi na pitanje (bez dvostruke kose crte)', m1.link);
ok(m1.tekst.includes(m1.link) && m1.html.includes(m1.link), 'link je i u tekstu i u HTML-u');
ok(!/TEST/.test(m1.naslov + m1.tekst), 'prava kupovina nema oznaku TEST');
const m2 = mejlZaAstrologa({ id: ID, ime: 'Marko', poslato: '2026-09-29T12:05:00Z', sandbox: true }, 'https://x.pages.dev');
ok(m2.naslov === 'Novo pitanje [TEST]: Marko' && /sandbox/.test(m2.tekst), 'probna kupovina ima [TEST] i objasnjenje');
const zlo = mejlZaAstrologa({ id: ID, ime: '<script>alert(1)</script>\nBcc: x@y.z', poslato: '2026-09-29T12:05:00Z', sandbox: false }, 'https://p');
ok(!zlo.html.includes('<script>') && zlo.html.includes('&lt;script&gt;'), 'ime se u HTML-u ne izvrsava');
ok(!/\n/.test(zlo.naslov), 'novi red iz imena ne ulazi u naslov mejla', zlo.naslov);
ok(cistoIme(null) === 'bez imena' && cistoIme('  ') === 'bez imena' && cistoIme('x'.repeat(90)).length === 60, 'prazno ime i predugacko ime');

console.log(fail ? `\n${fail} PROVERA PALO` : '\nSve provere prosle.');
process.exit(fail ? 1 : 0);
