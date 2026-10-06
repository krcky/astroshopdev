/**
 * Provera deljenja teksta tumacenja na pasuse i liste. Pokreni: npx tsx scripts/check-tumacenje.ts
 *
 * Oblik "• Naslov – tekst" pravi `scripts/korpus/liste.py`. Ako se ta dva
 * razidju, stavke se na telefonu prikazu kao obican tekst sa bulletom u sebi,
 * ili se naslov ne podebljava — tiho, bez greske.
 */
import { poJeziku, jezikKorpusa, jeziciUpita } from '../src/lib/jezik-korpusa';
import { blokovi, prvaRecenica, rasporedDuge, stavka, UVOD_MAX, vrstaSekcije, vrstaOdeljka } from '../src/lib/tumacenje';

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
  ['Opšte preporuke', 'preporuke'],
  ['Mitološke paralele', null],
  ['Kako najbolje iskoristiti ovaj tranzit?', null],
];
for (const [n, v] of vrste) ok(vrstaSekcije(n) === v, n, String(vrstaSekcije(n)));
// Prevodi korpusa (6.10.2026): naslovi odeljaka na hr, bs i en moraju dobiti istu vrstu kao srpski,
// inace kartica "Tvoj dan" (Efekat / Pazi / Savet) na prevodu ostane prazna.
const prevodi: [string, ReturnType<typeof vrstaSekcije>][] = [
  ['Bit', 'sustina'], ['Specifična područja života', 'sfere'], ['Opće preporuke', 'preporuke'],
  ['Pozitivni učinci', 'efekat'], ['Pozitivna djelovanja', 'efekat'], ['Savjeti', 'savet'], ['Savjet', 'savet'],
  ['Dugoročni učinci', 'dugorocno'], ['Suština', 'sustina'], ['Specifične sfere života', 'sfere'],
  ['Essence', 'sustina'], ['Specific areas of life', 'sfere'], ['General recommendations', 'preporuke'],
  ['Positive effects', 'efekat'], ['Challenges', 'pazi'], ['Advice', 'savet'], ['Long-term effects', 'dugorocno'],
  ['Bitka za slobodu', null],
];
for (const [n, v] of prevodi) ok(vrstaSekcije(n) === v, `prevod: ${n}`, String(vrstaSekcije(n)));
ok(vrstaOdeljka('Opće preporuke') === null, 'hr/bs preporuke NISU savet u kartici "Tvoj dan"');

ok(vrstaOdeljka('Opšte preporuke') === null, 'preporuke NISU savet u kartici "Tvoj dan"');

console.log('\n=== Raspored duge verzije (uvod, stavke, nastavak) ===');
const r1 = prvaRecenica('Sunce u kvadratu sa Neptunom donosi period zbunjenosti. Pod uticajem ovog aspekta, možete se osetiti izgubljeno.');
ok(r1?.recenica === 'Sunce u kvadratu sa Neptunom donosi period zbunjenosti.', 'prva recenica do tacke', r1?.recenica);
ok(r1?.ostatak === 'Pod uticajem ovog aspekta, možete se osetiti izgubljeno.', 'ostatak pasusa', r1?.ostatak);
const r2 = prvaRecenica('U periodu između 83. i 85. godine života dolazi do promene. Drugo.');
ok(r2?.recenica === 'U periodu između 83. i 85. godine života dolazi do promene.', 'redni broj "83." ne zavrsava recenicu', r2?.recenica);
ok(prvaRecenica('Srećan rođendan! Danas vam je divan dan.')?.recenica === 'Srećan rođendan!', 'uzvicnik zavrsava recenicu');
ok(prvaRecenica('Samo jedna rečenica.')?.ostatak === '', 'pasus od jedne recenice: ostatak prazan');
ok(prvaRecenica(`${'a'.repeat(UVOD_MAX)}. Drugo.`) === null, `preko ${UVOD_MAX} znakova nema uvoda`);
const sek = [
  { heading: 'Suština', body: 'x' }, { heading: 'Opšte preporuke', body: 'p' },
  { heading: 'Pozitivni efekti', body: '• a' }, { heading: 'Izazovi', body: '• b' }, { heading: 'Saveti', body: '• c' },
];
const rd = rasporedDuge('Prva. Ostatak prvog.\n\nDrugi pasus.\n\nTreći pasus.', sek);
ok(rd.uvod === 'Prva.' && rd.prviPasus === 'Ostatak prvog.', 'uvod i ostatak prvog pasusa', `${rd.uvod} | ${rd.prviPasus}`);
ok(rd.odeljci.map((s) => s.heading).join('|') === 'Suština|Opšte preporuke|Pozitivni efekti|Izazovi|Saveti', 'SVI odeljci gore, redom astrologa');
ok(rd.nastavakTekst === 'Drugi pasus.\n\nTreći pasus.', 'ostali pasusi u nastavak');
const sve = [rd.uvod, rd.prviPasus, rd.nastavakTekst].join(' ');
ok(['Prva.', 'Ostatak prvog.', 'Drugi pasus.', 'Treći pasus.'].every((x) => sve.includes(x)), 'nijedan deo teksta se ne gubi');
const dug = rasporedDuge(`${'b'.repeat(UVOD_MAX + 5)}. Dalje.`, []);
ok(dug.uvod === null && dug.prviPasus.startsWith('bbb'), 'bez uvoda ceo prvi pasus ostaje siv');

console.log('\n=== Jezik korpusa: prevod ima prednost, srpski je rezerva ===');
{
  type R = { key: string; jezik?: string | null; t: string };
  const redovi: R[] = [
    { key: 'a', jezik: 'sr', t: 'a-sr' }, { key: 'a', jezik: 'hr', t: 'a-hr' },
    { key: 'b', jezik: 'sr', t: 'b-sr' }, { key: 'c', jezik: 'hr', t: 'c-hr' }, { key: 'c', jezik: 'sr', t: 'c-sr' },
    { key: 'd', t: 'd-bez-kolone' }, { key: 'a', jezik: 'bs', t: 'a-bs' },
  ];
  const hr = new Map(poJeziku(redovi, 'hr', (r) => r.key).map((r) => [r.key, r.t]));
  ok(hr.get('a') === 'a-hr' && hr.get('c') === 'c-hr', 'prevod ima prednost, bez obzira na redosled redova', [...hr.values()].join(','));
  ok(hr.get('b') === 'b-sr', 'kljuc bez prevoda dobija srpski');
  ok(hr.get('d') === 'd-bez-kolone', 'red bez kolone jezik je srpski');
  ok(hr.size === 4, 'po jedan red za kljuc', String(hr.size));
  const srp = new Map(poJeziku(redovi, 'sr', (r) => r.key).map((r) => [r.key, r.t]));
  ok(srp.get('a') === 'a-sr' && srp.get('c') === 'c-sr', 'srpski korisnik nikad ne dobija prevod');
  ok(jezikKorpusa('hr') === 'hr' && jezikKorpusa('bs') === 'bs', 'hr i bs imaju prevod korpusa');
  ok(jezikKorpusa('en') === 'sr' && jezikKorpusa('mk') === 'sr' && jezikKorpusa('sr') === 'sr', 'jezik bez prevoda cita srpski');
  ok(jeziciUpita('hr').join() === 'hr,sr' && jeziciUpita('sr').join() === 'sr', 'upit trazi jezik i srpski');
}

console.log(fail ? `\n${fail} FAIL` : '\nsve OK');
process.exit(fail ? 1 : 0);
