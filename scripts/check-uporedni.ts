/**
 * Provere uporednog horoskopa (ocena para znakova). Pokreni: npm run check:uporedni
 *
 * Referenca je tabela sa astroshop.rs/uporedni-horoskop, prepisana 13.10.2026: S = srce (povoljno), P = pola srca
 * (manje povoljno), X (nepovoljno). Redovi i kolone idu Ovan ... Ribe.
 */
import { SIGNS } from '../src/lib/zodiac';
import { ocenaPara, ocenaZnakova, razmakZnakova, type OcenaPara } from '../src/lib/uporedni';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};

const SAJT = [
  'S P S X S P S P S X S P', // Ovan
  'P S P S X S P S P S X S', // Bik
  'S P S P S X S P S P S X', // Blizanci
  'X S P S P S X S P S P S', // Rak
  'S X S P S P S X S P S P', // Lav
  'P S X S P S P S X S P S', // Devica
  'S P S X S P S P S X S P', // Vaga
  'P S P S X S P S P S X S', // Skorpija
  'S P S P S X S P S P S X', // Strelac
  'X S P S P S X S P S P S', // Jarac
  'S X S P S P S X S P S P', // Vodolija
  'P S X S P S P S X S P S', // Ribe
].map((red) => red.split(' '));
const OCENA: Record<string, OcenaPara> = { S: 'povoljno', P: 'manje', X: 'nepovoljno' };

console.log('\n=== 1. Tabela sa sajta, svih 144 polja ===');
{
  let pogresno = 0;
  for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) {
    if (ocenaPara(a, b) !== OCENA[SAJT[a][b]]) {
      pogresno++;
      console.log(`      ${SIGNS[a].key} / ${SIGNS[b].key}: racun ${ocenaPara(a, b)}, sajt ${OCENA[SAJT[a][b]]}`);
    }
  }
  ok(pogresno === 0, 'racun daje istu ocenu kao tabela za svih 144 polja', `${pogresno} razlika`);
}

console.log('\n=== 2. Svojstva ===');
{
  let simetrija = true;
  for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) if (ocenaPara(a, b) !== ocenaPara(b, a)) simetrija = false;
  ok(simetrija, 'ocena je simetricna (Ovan-Bik = Bik-Ovan)');
  ok(razmakZnakova(0, 11) === 1 && razmakZnakova(0, 6) === 6 && razmakZnakova(3, 3) === 0, 'rastojanje ide kroz kraj kruga (Ovan-Ribe = 1)');
  const brojevi = { povoljno: 0, manje: 0, nepovoljno: 0 };
  for (let a = 0; a < 12; a++) for (let b = 0; b < 12; b++) brojevi[ocenaPara(a, b)]++;
  ok(brojevi.povoljno === 72 && brojevi.manje === 48 && brojevi.nepovoljno === 24, 'raspodela 72 / 48 / 24 kao na sajtu', JSON.stringify(brojevi));
  ok(ocenaZnakova('leo', 'aries') === 'povoljno' && ocenaZnakova('leo', 'taurus') === 'nepovoljno', 'ocena po kljucevima znakova');
  ok(ocenaZnakova('leo', 'nesto') === null, 'nepoznat kljuc daje null');
}

console.log(fail ? `\n${fail} NIJE PROSLO` : '\nSve prolazi');
process.exit(fail ? 1 : 0);
