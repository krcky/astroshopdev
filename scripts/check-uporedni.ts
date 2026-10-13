/**
 * Provere uporednog horoskopa (ocena para znakova). Pokreni: npm run check:uporedni
 *
 * Referenca je tabela sa astroshop.rs/uporedni-horoskop, prepisana 13.10.2026: S = srce (povoljno), P = pola srca
 * (manje povoljno), X (nepovoljno). Redovi i kolone idu Ovan ... Ribe.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { SIGNS } from '../src/lib/zodiac';
import {
  OBLASTI_PARA, ocenaPara, ocenaZnakova, razmakZnakova, uporedniKey, type OcenaPara,
} from '../src/lib/uporedni';

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

console.log('\n=== 3. Kljucevi i CSV tekstova (ako je izvoz na Desktopu) ===');
{
  ok(uporedniKey('aries', 'taurus', 'ljubav') === 'uporedni.aries.taurus.ljubav', 'oblik kljuca: uporedni.<prvi>.<drugi>.<oblast>');
  ok(OBLASTI_PARA.join() === 'ljubav,prijateljstvo,posao', 'oblasti idu Ljubav, Prijateljstvo, Posao');
  const csvPut = join(homedir(), 'Desktop/Astroshop App/Uporedni horoskop/uporedni-texts.csv');
  if (!existsSync(csvPut)) {
    console.log('      (nema CSV-a, preskoceno: python3 scripts/korpus/uporedni.py)');
  } else {
    // Minimalan CSV citac (navodnici, "" kao navodnik, prelomi reda unutar polja).
    const t = readFileSync(csvPut, 'utf8');
    const redovi: string[][] = [];
    let red: string[] = [], polje = '', u = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (u) { if (c === '"') { if (t[i + 1] === '"') { polje += '"'; i++; } else u = false; } else polje += c; }
      else if (c === '"') u = true;
      else if (c === ',') { red.push(polje); polje = ''; }
      else if (c === '\n') { red.push(polje); redovi.push(red); red = []; polje = ''; }
      else if (c !== '\r') polje += c;
    }
    const [zag, ...podaci] = redovi;
    const kol = Object.fromEntries(zag.map((n, i) => [n, i]));
    const kljucevi = podaci.map((r) => r[kol.key]);
    ok(new Set(kljucevi).size === kljucevi.length, 'nema duplih kljuceva', String(kljucevi.length));
    const znaci = new Set(SIGNS.map((s) => s.key));
    ok(podaci.every((r) => znaci.has(r[kol.prvi]) && znaci.has(r[kol.drugi])), 'prvi i drugi su znakovi iz SIGNS');
    ok(podaci.every((r) => r[kol.key] === uporedniKey(r[kol.prvi], r[kol.drugi], r[kol.area] as never)), 'kljuc = prvi + drugi + oblast');
    ok(podaci.every((r) => (OBLASTI_PARA as readonly string[]).includes(r[kol.area])), 'oblast je ljubav, prijateljstvo ili posao');
    ok(podaci.every((r) => r[kol.jezik] === 'sr'), 'jezik je sr');
    ok(podaci.every((r) => !/[<>]|&#|&[a-z]+;/.test(r[kol.body])), 'nema ostataka HTML-a');
    ok(podaci.every((r) => /[.!?\u201d")]$/.test(r[kol.body])), 'svaki tekst zavrsava recenicom (odseceni nisu uvezeni)');
    ok(podaci.every((r) => r[kol.body].split(/\s+/).length >= 30), 'nijedan tekst nije kraci od 30 reci');
    ok(podaci.length >= 428 && podaci.length <= 432, 'oko 430 od 432 teksta (sajt ne drzi sve)', String(podaci.length));
  }
}

console.log(fail ? `\n${fail} NIJE PROSLO` : '\nSve prolazi');
process.exit(fail ? 1 : 0);
