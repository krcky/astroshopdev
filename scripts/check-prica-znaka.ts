/**
 * Provera price o znaku (pravilo 25): tekstovi i slike za svih 12 znakova, racun (element,
 * kvalitet, doba, polaritet, srodni), padezi, trajanje (staje u video od 58 s), sazvezdja.
 *
 *   npm run check:prica-znaka
 */
import { existsSync, readFileSync } from 'node:fs';
import { VIDEO } from '../src/lib/prica';
import {
  danasUPrici, datumiZnaka, LATINSKO_IME, NAJDUZA_RECENICA, NATPIS_SAZVEZDJA, NATPISI, POPUNA_SAZVEZDJA, pricaZnaka, SLIKE_ZNAKA,
  SLIKE_ZNAKA_UVOD, sunceU, pricaZaKartu, tamnaSlikaZnaka, trajanjaSlika, velicinaNaslova, vrhNatpisaSazvezdja,
} from '../src/lib/prica-znaka';
import type { PricaDana } from '../src/lib/use-prica';
import { NATAL_PODNASLOVI } from '../src/lib/natal-podnaslovi-podaci';
import { natalPodnaslov } from '../src/lib/natal-podnaslovi';
import { cityByName } from '../src/lib/cities';
import { resolveProfile, type Profile } from '../src/store/profile';
import { IKONE_OSNOVA } from '../src/lib/ikone-osnova';
import { SAZVEZDJA } from '../src/lib/sazvezdja';
import { ZNAK_OPIS } from '../src/lib/znak-opis-podaci';
import { SIGN_CASES, SIGNS, signByKey } from '../src/lib/zodiac';

let greske = 0;
function ok(uslov: boolean, opis: string, detalj = '') {
  if (!uslov) greske++;
  console.log(`${uslov ? 'OK  ' : 'FAIL'}  ${opis.padEnd(62)} ${detalj}`);
}

console.log('=== 1. Tekst i slike za svih 12 znakova ===');
for (const z of SIGNS) {
  const o = ZNAK_OPIS[z.key];
  const prazno = o ? Object.entries(o).filter(([, v]) => (Array.isArray(v) ? v.length === 0 : !String(v).trim())).map(([k]) => k) : ['ceo opis'];
  ok(prazno.length === 0, `${z.name}: sva polja sa sajta`, prazno.join(', '));
  const slike = [`${z.key}.png`, ...['kamen', 'boja', 'biljka', 'hrana'].map((s) => `${z.key}-${s}.jpg`)];
  const nema = slike.filter((f) => !existsSync(`assets/images/znakovi/${f}`));
  ok(nema.length === 0, `${z.name}: gravira i cetiri fotografije`, nema.join(', '));
  ok(!!SAZVEZDJA[z.key] && SAZVEZDJA[z.key].linije.length > 0 && SAZVEZDJA[z.key].zvezde.length >= 4, `${z.name}: sazvezdje`);
  const van = SAZVEZDJA[z.key].zvezde.filter(([x, y]) => Math.abs(x) > 0.51 || Math.abs(y) > 0.51);
  ok(van.length === 0, `${z.name}: temena sazvezdja u okviru -0,5..0,5`, `${van.length} van`);
}
ok(['srce', 'torba'].every((f) => existsSync(`assets/images/ikone/${f}.png`)), 'srce i torba (U ljubavi, Na poslu)');
ok(Object.keys(IKONE_OSNOVA).length === 9, 'Ivanovih ikonica za "Osnove znaka": 9', String(Object.keys(IKONE_OSNOVA).length));

console.log('\n=== 2. Racun: kvalitet, doba, polaritet, srodni ===');
const ocek: [string, string, string, string, string][] = [
  ['aries', 'Kardinalan', 'otvara proleće', 'Pozitivan', 'kao Lav i Strelac'],
  ['taurus', 'Fiksni', 'sredina proleća', 'Negativan', 'kao Devica i Jarac'],
  ['gemini', 'Promenljiv', 'kraj proleća', 'Pozitivan', 'kao Vaga i Vodolija'],
  ['cancer', 'Kardinalan', 'otvara leto', 'Negativan', 'kao Škorpija i Ribe'],
  ['libra', 'Kardinalan', 'otvara jesen', 'Pozitivan', 'kao Blizanci i Vodolija'],
  ['capricorn', 'Kardinalan', 'otvara zimu', 'Negativan', 'kao Bik i Devica'],
  ['pisces', 'Promenljiv', 'kraj zime', 'Negativan', 'kao Rak i Škorpija'],
];
for (const [k, kv, doba, pol, srodni] of ocek) {
  const p = pricaZnaka(k, 14);
  ok(p.kvalitet === kv && p.doba === doba && p.polaritet === pol && p.srodni === srodni,
    `${p.znak.name}: ${kv}, ${doba}, ${pol}, ${srodni}`, `${p.kvalitet} / ${p.doba} / ${p.polaritet} / ${p.srodni}`);
}
// Sajt kaze "pol" znaka; mora da se slaze sa polaritetom (muski = pozitivan).
for (const z of SIGNS) {
  const p = pricaZnaka(z.key, null);
  ok((p.opis.pol === 'Muški') === (p.polaritet === 'Pozitivan'), `${z.name}: pol sa sajta = polaritet`, `${p.opis.pol} / ${p.polaritet}`);
}

console.log('\n=== 3. Padezi i natpisi ===');
ok(pricaZnaka('aries', 1).vladarNaslov === 'Ovnom vlada Mars', 'Ovnom vlada Mars');
ok(pricaZnaka('pisces', 1).vladarNaslov === 'Ribama vlada Neptun', 'Ribama vlada Neptun');
ok(pricaZnaka('scorpio', 1).vladarNaslov === 'Škorpijom vlada Pluton', 'Škorpijom vlada Pluton');
ok(pricaZnaka('gemini', 1).teloOznaka === 'Deo tela kojim Blizanci vladaju', 'mnozina: Blizanci vladaju');
ok(pricaZnaka('leo', 1).teloOznaka === 'Deo tela kojim Lav vlada', 'jednina: Lav vlada');
ok(pricaZnaka('aries', 1).osnove === 'Vatreni, kardinalni znak', 'Vatreni, kardinalni znak');
ok(pricaZnaka('aquarius', 1).osnove === 'Vazdušni, fiksni znak', 'Vazdušni, fiksni znak');
ok(datumiZnaka(signByKey('aries')!) === '21. mar – 19. apr', 'datumi Ovna: 21. mar – 19. apr (bez "otprilike")', datumiZnaka(signByKey('aries')!));
ok(datumiZnaka(signByKey('capricorn')!) === '22. dec – 19. jan', 'datumi Jarca preko Nove godine', datumiZnaka(signByKey('capricorn')!));
ok(sunceU(signByKey('aries')!) === 'Sunce u Ovnu', 'Pročitaj: Sunce u Ovnu');
ok(pricaZnaka('aries', 1).ukratko === 'Otvorenost i ishitrenost.', 'naslov ukratko sa tackom', pricaZnaka('aries', 1).ukratko);
ok(NATPISI.sazvezdjeNaslov.ja.includes('moj') && NATPISI.osvojitiOznaka.ja === 'Kako da me osvojiš', 'slika za deljenje u prvom licu');
for (const z of SIGNS) {
  const p = pricaZnaka(z.key, null);
  const duge = [p.ukratkoRecenica, p.ljubavRecenica, p.posaoRecenica].filter((r) => r && r.split(/\s+/).length > NAJDUZA_RECENICA);
  ok(duge.length === 0, `${z.name}: recenice na slici do ${NAJDUZA_RECENICA} reci`);
}

console.log('\n=== 4. Trajanje: kao dnevna prica, cela staje u video ===');
for (const z of SIGNS) {
  const t = pricaZnaka(z.key, 14).trajanja;
  const ukupno = t.reduce((a, b) => a + b, 0);
  ok(t.length === SLIKE_ZNAKA.length && t.every((x) => x >= 4000 && x <= 8000) && t[0] === 4500 && t[1] === 4500,
    `${z.name}: 9 slika, svaka 4—8 s, sazvezdje i naslovna 4,5 s`);
  ok(ukupno <= VIDEO.najduze - VIDEO.zavrsni, `${z.name}: ukupno ${(ukupno / 1000).toFixed(1)} s staje u video bez skracivanja`);
}
ok(tamnaSlikaZnaka('sazvezdje') && tamnaSlikaZnaka('osvojiti') && !tamnaSlikaZnaka('naslovna'), 'tamne slike: sazvezdje i "kako te osvojiti"');

console.log('\n=== 5. Velicina naslova ===');
const v1 = velicinaNaslova('Otvorenost i ishitrenost.', 342, 44, 30, 3);
const v2 = velicinaNaslova('Jedinstvena kombinacija mudrosti i humora.', 342, 44, 30, 3);
ok(v1 >= v2 && v1 <= 44 && v2 >= 30, 'duzi naslov nije veci od kraceg', `${v1} / ${v2}`);
ok(velicinaNaslova('a b', 342, 40, 30, 1) === 40, 'kratak tekst ostaje najveci');

console.log('\n=== 6. Latinsko ime sazvezdja ispod crteza ===');
ok(SIGNS.every((z) => LATINSKO_IME[z.key]) && new Set(Object.values(LATINSKO_IME)).size === 12, 'latinsko ime za svih 12, sva razlicita');
ok(LATINSKO_IME.scorpio === 'Scorpius' && LATINSKO_IME.capricorn === 'Capricornus', 'ime SAZVEZDJA (IAU): Scorpius, Capricornus');
// Prostor crteza (sirina × visina, razmera): iPhone SE, iPhone 16/17 Pro, kartica za deljenje 360 × 640.
const PROSTORI: [string, number, number, number][] = [['SE', 327, 412, 0.82], ['Pro', 354, 521, 1], ['kartica', 316, 299, 0.74]];
for (const [ime, w, h, r] of PROSTORI) {
  const van = SIGNS.filter((z) => {
    const najnize = Math.max(...SAZVEZDJA[z.key].zvezde.map((t) => t[1]));
    const vrh = vrhNatpisaSazvezdja(najnize, w, h, POPUNA_SAZVEZDJA, NATPIS_SAZVEZDJA.razmak * r);
    const ispodZvezda = vrh > h / 2 + najnize * Math.min(w, h) * POPUNA_SAZVEZDJA;
    return !ispodZvezda || vrh + NATPIS_SAZVEZDJA.red * r > h;
  }).map((z) => z.name);
  ok(van.length === 0, `${ime}: natpis ispod najnize zvezde i u prostoru crteza, svih 12`, van.join(', '));
}

console.log('\n=== 7. Recenica ispod vladara (Ivan, 1.10.2026) ===');
ok(pricaZnaka('aries', 14, ['taurus']).vladarRecenica === 'U tvojoj natalnoj karti Mars je u Biku.', 'U tvojoj natalnoj karti Mars je u Biku.');
ok(pricaZnaka('cancer', null, ['gemini', 'cancer']).vladarRecenica === 'U tvojoj natalnoj karti Mesec je u Blizancima ili Raku.',
  'dva znaka: "u Blizancima ili Raku"', String(pricaZnaka('cancer', null, ['gemini', 'cancer']).vladarRecenica));
ok(pricaZnaka('leo', 14, ['leo']).vladarRecenica === 'Grci su ga zvali Helios.' && pricaZnaka('leo', null).vladarRecenica === 'Grci su ga zvali Helios.',
  'Lav: Sunce je uvek u Lavu, pa ime iz mita');
ok(pricaZnaka('aries', 14, ['taurus']).vladarRecenicaJa === 'U mojoj natalnoj karti Mars je u Biku.', 'kartica i video u prvom licu');
ok(pricaZnaka('aries', 14).vladarRecenica === null, 'bez znaka vladara nema recenice (ne izmisljati)');
// Iz prave karte: znak vladara je onaj koji karta kaze; Mesec bez vremena rodjenja ume da bude u dva znaka.
const beograd = cityByName('Beograd')!;
const profil = (y: number, m: number, d: number, vreme: boolean): Profile => ({
  name: 'Proba', birth: { year: y, month: m, day: d }, time: vreme ? { hour: 14, minute: 20 } : null,
  cityId: beograd.id, cityName: beograd.name, latitude: beograd.latitude, longitude: beograd.longitude, timeZone: beograd.tz.name,
});
const ovan = resolveProfile(profil(1994, 4, 4, true))!;
const mars = ovan.chart.planets.find((x) => x.key === 'mars')!.position.sign;
ok(pricaZaKartu(ovan)?.vladarRecenica === `U tvojoj natalnoj karti Mars je u ${SIGN_CASES[mars.key].loc}.`, 'prava karta: Mars u znaku iz karte',
  String(pricaZaKartu(ovan)?.vladarRecenica));
ok(pricaZaKartu(ovan)?.stepen !== null && pricaZaKartu(resolveProfile(profil(1994, 4, 4, false))!)?.stepen === null, 'stepen Sunca samo uz tacno vreme');
const rakovi = Array.from({ length: 33 }, (_, i) => {
  const d = new Date(Date.UTC(1990, 5, 21 + i));
  return resolveProfile(profil(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), false))!;
}).filter((r) => r.chart.planets.find((x) => x.key === 'sun')!.position.sign.key === 'cancer');
const dva = rakovi.filter((r) => / ili /.test(pricaZaKartu(r)?.vladarRecenica ?? ''));
const jedan = rakovi.filter((r) => !/ ili /.test(pricaZaKartu(r)?.vladarRecenica ?? '') && pricaZaKartu(r)?.vladarRecenica?.startsWith('U tvojoj natalnoj karti Mesec je u '));
ok(rakovi.length > 20 && dva.length > 0 && jedan.length > 0 && dva.length + jedan.length === rakovi.length,
  'Rak bez vremena: Mesec u jednom znaku ili "X ili Y" kad promeni znak tog dana', `${jedan.length} + ${dva.length} od ${rakovi.length}`);

console.log('\n=== 8. Video: bez RN ivica koje `layer.render` crta pogresno (pravilo 23) ===');
// Kartica sa ivicom koja ne sece sadrzaj dobija od RN-a sloj podloge iza sadrzaja (zPosition), a `layer.render`
// ga crta PREKO — u videu bleda kartica; ivicu samo sa jedne strane crta kao sliku koju razvuce u debelu sivu
// prugu (Ivan, 1.10.2026). Zato u fajlovima koje video snima: linija = View visine 1, puna ivica samo uz overflow.
const FAJLOVI_VIDEA = [
  'src/components/prica/kartica.tsx', 'src/components/prica/crtezi.tsx', 'src/components/prica/logo-price.tsx',
  'src/components/prica/pozadina.tsx', 'src/components/prica-znaka/slike.tsx', 'src/components/prica-znaka/kartica.tsx',
  'src/components/prica-znaka/sazvezdje.tsx', 'src/components/prica-znaka/ikona-osnove.tsx',
];
const JEDNA_STRANA = /border(Top|Bottom|Left|Right|Start|End)Width|(?<![\w-])border-(t|b|l|r|x|y|s|e)(-\d+)?(?![\w-])/;
const PUNA = /borderWidth|(?<![\w-])border(-\d+)?(?![\w-])|CARD_SURFACE\b(?!\s*=)/;
for (const f of FAJLOVI_VIDEA) {
  if (!existsSync(f)) { ok(false, `${f} postoji`); continue; }
  const redovi = readFileSync(f, 'utf8').split('\n');
  const kod = (r: string) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(r);
  const jedna = redovi.map((r, i) => [r, i + 1] as const).filter(([r]) => kod(r) && JEDNA_STRANA.test(r)).map(([, i]) => i);
  const bezOverflow = redovi.map((r, i) => [r, i + 1] as const)
    .filter(([r]) => kod(r) && PUNA.test(r) && !/import /.test(r) && !/overflow/.test(r)).map(([, i]) => i);
  ok(jedna.length === 0 && bezOverflow.length === 0, `${f.replace('src/components/', '')}: bez ivice sa jedne strane, puna ivica uz overflow`,
    [jedna.length ? `jedna strana: ${jedna.join(', ')}` : '', bezOverflow.length ? `bez overflow: ${bezOverflow.join(', ')}` : ''].filter(Boolean).join('; '));
}

console.log('\n=== 9. Prica u onboardingu: kraca, sa slikom "A sta je danas?" (Ivan, 2.10.2026) ===');
ok(SLIKE_ZNAKA_UVOD.length === 8 && !SLIKE_ZNAKA_UVOD.includes('osnove') && !SLIKE_ZNAKA_UVOD.includes('stvari'),
  'uvod: 8 slika, bez "osnova znaka" i "kamen, boja…"');
ok(SLIKE_ZNAKA_UVOD[SLIKE_ZNAKA_UVOD.length - 1] === 'danas' && SLIKE_ZNAKA_UVOD[SLIKE_ZNAKA_UVOD.length - 2] === 'vladar',
  'uvod: "A sta je danas?" je poslednja, pred njom vladar');
const lazniDan = (tekst: { efekat: string; izazov: string; savet: string }, ljubav = true): PricaDana => ({
  tvojDan: { naslov: 'Planovi koji donose uspeh', efekat: tekst.efekat, izazov: tekst.izazov },
  savet: tekst.savet ? { tekst: tekst.savet, ime: 'x', kljuc: 'k' } : null,
  ocene: ljubav ? { redovi: [{ key: 'ljubav', name: 'Ljubav', ocena: 4, oznaka: 'Dobar dan', juce: 3 }], najbolja: null } : null,
} as unknown as PricaDana);
const puna = danasUPrici(lazniDan({ efekat: 'Lakše donosiš odluke.', izazov: 'Ne žuri sa obećanjima.', savet: 'Zapiši šta ti je važno.' }));
ok(puna !== null && puna.redovi.length === 3 && puna.redovi.map((r) => r.tekst).join('|').startsWith('Lakše'),
  'danas: tri reda redom efekat, izazov, savet');
ok(puna !== null && puna.ljubav?.ocena === 4 && puna.ljubav.ime === 'Ljubav', 'danas: ocena Ljubavi');
ok(puna !== null && puna.trajanje >= 4000 && puna.trajanje <= 8000, 'danas: trajanje 4—8 s po tekstu', String(puna?.trajanje));
const dvaReda = danasUPrici(lazniDan({ efekat: 'Lakše donosiš odluke.', izazov: '', savet: 'Zapiši šta ti je važno.' }, false));
ok(dvaReda !== null && dvaReda.redovi.length === 2 && dvaReda.ljubav === null, 'danas: red bez teksta i ocena bez podataka se ne prikazuju');
ok(danasUPrici(lazniDan({ efekat: '', izazov: '', savet: '' })) === null && danasUPrici(null) === null,
  'danas: bez ijednog reda teksta slike nema (prica ide bez nje, ne sa praznom)');
for (const z of SIGNS) {
  const p = pricaZnaka(z.key, 14);
  const t = trajanjaSlika(p, SLIKE_ZNAKA_UVOD, puna);
  const ukupno = t.reduce((a, b) => a + b, 0);
  const iste = SLIKE_ZNAKA_UVOD.slice(0, 7).every((k, i) => t[i] === p.trajanja[SLIKE_ZNAKA.indexOf(k)]);
  ok(t.length === 8 && iste && ukupno < p.trajanja.reduce((a, b) => a + b, 0) + 8000 && ukupno <= 45_000,
    `${z.name}: uvod ${(ukupno / 1000).toFixed(1)} s (do 45 s), trajanja slika znaka ista kao u tabu "Ti"`);
}

console.log('\n=== 10. Podnaslovi astrologa na ekranu sa velikom trojkom (Ivan, 2.10.2026) ===');
for (const jez of ['sr', 'hr', 'bs', 'en']) {
  const prazno: string[] = [];
  for (const tacka of ['sun', 'moon', 'ascendant'] as const) {
    for (const z of SIGNS) if (!NATAL_PODNASLOVI[jez]?.[tacka]?.[z.key]?.trim()) prazno.push(`${tacka}.${z.key}`);
  }
  ok(prazno.length === 0, `${jez}: 36 fraza (Sunce, Mesec, Ascendent x 12 znakova)`, prazno.join(', '));
}
ok(natalPodnaslov('sun', 'leo') === 'Kralj Zodijaka' && natalPodnaslov('ascendant', 'aries') === 'Brzina kao vrlina', 'srpski: fraze astrologa po znaku');
ok(natalPodnaslov('moon', 'nepoznat') === null, 'nepoznat znak: nema fraze (ne izmisljati)');
const sveFraze = Object.values(NATAL_PODNASLOVI).flatMap((j) => Object.values(j).flatMap((m) => Object.values(m)));
ok(sveFraze.every((f) => f.length <= 40), 'fraze su kratke (do 40 znakova), staju u jedan-dva reda', sveFraze.filter((f) => f.length > 40).join(' | '));
ok(!sveFraze.some((f) => /\b(vama|vam|vas|vaš\w*)\b/i.test(f)), 'nijedna fraza ne obraca sa "Vi" (UI je na "ti")');

console.log(greske ? `\n${greske} provera pala.` : '\nSve provere prosle.');
// Izlaz odmah: `store/profile` posle uvoza pokusa da pise u AsyncStorage, koga u Node-u nema (kao check-osobe).
process.exit(greske ? 1 : 0);
