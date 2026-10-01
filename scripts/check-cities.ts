/**
 * Provera predloga gradova. Pokreni: npx tsx scripts/check-cities.ts
 *
 * Predlozi (ono sto se vidi pre nego sto korisnik nesto otkuca) su rucno
 * izabrani po GeoNames id-jevima. Ako se `PACKED` lista ikad regenerise i neki
 * id se promeni, `suggestedCities()` taj grad preskace u tisini — korisnik bi
 * video sedam predloga umesto osam i niko ne bi primetio. Zato ova provera.
 */
import { searchCities, suggestedCities, suggestedCityIds, cityById, predloziPoZemlji, AMERICKI_GRADOVI } from '../src/lib/cities';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(46)} ${detail}`);
};

console.log('\n=== Predlozi ===');
const nepoznati = suggestedCityIds.filter((id) => !cityById(id));
ok(nepoznati.length === 0, 'svi predlozeni id-jevi postoje u listi',
   nepoznati.length ? nepoznati.join(', ') : `${suggestedCityIds.length} gradova`);

ok(new Set(suggestedCityIds).size === suggestedCityIds.length, 'nema ponovljenih id-jeva');

const predlozi = suggestedCities(8);
ok(predlozi.length === 8, 'osam predloga', String(predlozi.length));

const strani = predlozi.filter((c) => c.country !== 'Srbija');
ok(strani.length === 0, 'svi predlozi su iz Srbije',
   strani.map((c) => `${c.name} (${c.country})`).join(', ') || predlozi.map((c) => c.name).join(', '));

ok(predlozi[0].name === 'Beograd', 'prvi predlog je Beograd', predlozi[0].name);

// Prazan upit mora da vrati PREDLOGE, a ne pocetak liste poredjane po velicini
// na nivou regiona — tamo je drugi grad Sarajevo.
const prazno = searchCities('', 8);
ok(prazno[1]?.name === 'Novi Sad', 'prazan upit daje predloge, ne region',
   `drugi je ${prazno[1]?.name}`);

console.log('\n=== Pretraga se NIJE suzila ===');
// Predlozi su samo pocetno stanje. Cim se otkuca slovo, mora da se nadje ceo
// region — dijaspora i ljudi rodjeni van Srbije ne smeju da ostanu bez grada.
for (const [upit, ocekivan, zemlja] of [
  ['Zag', 'Zagreb', 'Hrvatska'],
  ['Sara', 'Sarajevo', 'BiH'],
  ['Ljublj', 'Ljubljana', 'Slovenija'],
  ['nis', 'Niš', 'Srbija'],
] as const) {
  const r = searchCities(upit, 8);
  ok(r[0]?.name === ocekivan && r[0]?.country === zemlja,
     `"${upit}" nalazi ${ocekivan}`, `${r[0]?.name} (${r[0]?.country})`);
}

console.log('\n=== Predlozi po jeziku (Ivan, 2.10.2026) ===');
// Svaki rucno izabran grad postoji, pripada SVOJOJ zemlji i nije ponovljen.
for (const [zemlja, ids] of Object.entries(predloziPoZemlji)) {
  const gradovi = ids.map((id) => cityById(id));
  const fali = ids.filter((_, i) => !gradovi[i]);
  const tudji = gradovi.filter((c) => c && c.kodZemlje !== zemlja).map((c) => `${c!.name} (${c!.kodZemlje})`);
  ok(!fali.length && !tudji.length && new Set(ids).size === ids.length && ids.length >= 8,
     `${zemlja}: ${ids.length} predloga, svi iz zemlje`, fali.join(', ') || tudji.join(', ') || gradovi.slice(0, 3).map((c) => c!.name).join(', '));
  const prvih = suggestedCities(8, zemlja as keyof typeof predloziPoZemlji);
  ok(prvih.length === 8, `${zemlja}: osam predloga`, String(prvih.length));
}
ok(AMERICKI_GRADOVI.length >= 8 && AMERICKI_GRADOVI.every((c) => c.kodZemlje === 'US' && c.tz.name.startsWith('America/') && !c.tz.europeanDst),
   'US: americki gradovi, americke zone', suggestedCities(3, 'US').map((c) => c.name).join(', '));
ok(cityById(5128581)?.name === 'New York City', 'americki grad se nalazi po id-ju (sacuvan profil)');
// Pretraga ostaje po velicini i za drugi jezik: zemlja jezika menja samo PREDLOGE.
ok(searchCities('Sar', 8, 'HR')[0]?.name === 'Sarajevo', 'hrvatski: "Sar" i dalje nalazi Sarajevo', searchCities('Sar', 8, 'HR')[0]?.name);
ok(searchCities('', 8, 'HR')[0]?.name === 'Zagreb', 'hrvatski: prazan upit daje hrvatske predloge', searchCities('', 8, 'HR')[0]?.name);

console.log(fail ? `\n${fail} PROVERA PALO\n` : '\nSve provere prosle.\n');
process.exit(fail ? 1 : 0);
