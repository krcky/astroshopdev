/**
 * Provera price o znaku (pravilo 25): tekstovi i slike za svih 12 znakova, racun (element,
 * kvalitet, doba, polaritet, srodni), padezi, trajanje (staje u video od 58 s), sazvezdja.
 *
 *   npm run check:prica-znaka
 */
import { existsSync } from 'node:fs';
import { VIDEO } from '../src/lib/prica';
import {
  datumiZnaka, NAJDUZA_RECENICA, NATPISI, pricaZnaka, SLIKE_ZNAKA, sunceU, tamnaSlikaZnaka, velicinaNaslova,
} from '../src/lib/prica-znaka';
import { IKONE_OSNOVA } from '../src/lib/ikone-osnova';
import { SAZVEZDJA } from '../src/lib/sazvezdja';
import { ZNAK_OPIS } from '../src/lib/znak-opis-podaci';
import { SIGNS, signByKey } from '../src/lib/zodiac';

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

console.log(greske ? `\n${greske} provera pala.` : '\nSve provere prosle.');
if (greske) process.exit(1);
