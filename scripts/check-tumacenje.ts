/**
 * Provera deljenja teksta tumacenja na pasuse i liste. Pokreni: npx tsx scripts/check-tumacenje.ts
 *
 * Oblik "• Naslov – tekst" pravi `scripts/korpus/liste.py`. Ako se ta dva
 * razidju, stavke se na telefonu prikazu kao obican tekst sa bulletom u sebi,
 * ili se naslov ne podebljava — tiho, bez greske.
 */
import { blokovi, stavka, vrstaSekcije, vrstaOdeljka } from '../src/lib/tumacenje';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(50)} ${detail}`);
};

console.log('\n=== Stavka ===');
const s1 = stavka('• Duhovni rast / Unutrašnji svet – Osećate potrebu za iskrenošću – prema sebi.');
ok(s1.naslov === 'Duhovni rast / Unutrašnji svet', 'naslov do PRVE crte', s1.naslov);
ok(s1.tekst === 'Osećate potrebu za iskrenošću – prema sebi.', 'ostatak zadrzava sledecu crtu', s1.tekst);
const s2 = stavka('• Preispitajte motive za širenje');
ok(s2.naslov === undefined && s2.tekst === 'Preispitajte motive za širenje', 'stavka bez naslova');
const s3 = stavka('• Sve-u-jednom bez razmaka-oko crte');
ok(s3.naslov === undefined, 'crtica bez razmaka nije naslov');

console.log('\n=== Blokovi ===');
const b = blokovi('Uvodni pasus.\nDrugi red istog pasusa.\n\n• Prvo – a\n• Drugo\n\nZavrsni pasus.');
ok(b.length === 3, 'tri bloka', String(b.length));
ok(b[0].vrsta === 'pasus' && b[0].tekst.includes('\n'), 'pasus cuva prelom reda');
ok(b[1].vrsta === 'lista' && b[1].stavke.length === 2, 'lista sa dve stavke');
ok(b[2].vrsta === 'pasus', 'pasus posle liste');
const mesano = blokovi('• Stavka\nobican red');
ok(mesano[0].vrsta === 'pasus', 'blok sa redom bez bulleta je pasus, ne lista');
ok(blokovi('').length === 0 && blokovi('\n\n\n').length === 0, 'prazan tekst -> nema blokova');

console.log('\n=== Vrsta sekcije (ikona) ===');
const vrste: [string, string | null][] = [
  ['Suština', 'sustina'],
  ['Dugoročni efekti', 'dugorocno'],
  ['Specifične sfere života', 'sfere'],
  ['Specifične oblasti života', 'sfere'],
  ['Pozitivni efekti', 'efekat'],
  ['Pozitivna dejstva', 'efekat'],
  ['ozitivni efekti', 'efekat'],
  ['Izazovi', 'pazi'],
  ['Izazov', 'pazi'],
  ['Saveti', 'savet'],
  ['Opšte preporuke', 'savet'],
  ['Mitološke paralele', null],
  ['Kako najbolje iskoristiti ovaj tranzit?', null],
];
for (const [n, v] of vrste) ok(vrstaSekcije(n) === v, n, String(vrstaSekcije(n)));
ok(vrstaOdeljka('Opšte preporuke') === null, 'preporuke NISU savet u kartici "Tvoj dan"');

console.log(fail ? `\n${fail} FAIL` : '\nsve OK');
process.exit(fail ? 1 : 0);
