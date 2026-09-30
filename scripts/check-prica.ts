/**
 * Provere dnevne price (`src/lib/prica.ts`). Pokreni: npm run check:prica
 *
 * Prica ne racuna nista novo — proverava se izbor slika, trajanje, mnozina u
 * legendi i geometrija crteza (tocak na pravim polozajima, ugao aspekta).
 * Primer dana je RACUNAT za probnu kartu, ne upisan rucno.
 */
import { buildNatalChart } from '../src/lib/natal';
import { oblastiDana } from '../src/lib/oblasti';
import {
  boljeNegoJuce, brojTonova, brojTranzita, fazaOsmina, legendaTonova, luk, najbolja, reciZaPrelom, REDOSLED, slikeDana,
  tackaNaKrugu, tackaNaTocku, TRAJANJE, trajanjeSlike, ugloviCrteza, zraciDuzina,
} from '../src/lib/prica';
import { BEOGRAD } from '../src/lib/test-karta';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(62)} ${detail}`);
};
const blizu = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;

console.log('\n1. Trajanje slike: 2 s + 0,4 s po reci, 5—12 s');
ok(trajanjeSlike('') === TRAJANJE.min, 'bez teksta: najmanje 5 s', String(trajanjeSlike('')));
ok(trajanjeSlike('Budite strpljivi i dosledni.') === 5000, 'kratka recenica: 5 s');
const td = 'Stabilan i odgovoran napredak Donosite važne odluke i planove s jasnoćom. Osećate veću odgovornost i spremnost da prihvatite savete koji vam pomažu da rastete.';
ok(trajanjeSlike(td) === 2000 + 24 * 400, '"Tvoj dan" (24 reci): 11,6 s', String(trajanjeSlike(td)));
ok(trajanjeSlike(Array(60).fill('rec').join(' ')) === TRAJANJE.max, 'dug tekst: najvise 12 s');
ok(trajanjeSlike('  jedna   dve  ') === 5000, 'visak razmaka ne broji reci');

console.log('\n1b. Prelom naslova: jednoslovna rec ide uz sledecu');
const N = '\u00A0';
ok(reciZaPrelom('Opadajući Mesec u Biku').join('|') === `Opadajući|Mesec|u${N}Biku`, '"u Biku" ostaje zajedno');
ok(reciZaPrelom('ljubavnih i kreativnih odnosa.').join('|') === `ljubavnih|i${N}kreativnih|odnosa.`, '"i kreativnih" ostaje zajedno');
ok(reciZaPrelom('a u tebi').join('|') === `a${N}u${N}tebi`, 'dve jednoslovne zaredom idu obe uz sledecu');
ok(reciZaPrelom('Ja i').join('|') === 'Ja|i', 'jednoslovna na kraju ostaje sama (nema sledece)');
ok(reciZaPrelom('  Saturn   sekstil  Sunce ').join('|') === 'Saturn|sekstil|Sunce', 'visak razmaka ne pravi prazne reci');

console.log('\n2. Koje slike postoje');
const sve = { tranzita: 10, tvojDan: true, ocene: true, ideKoci: true, savet: true };
ok(slikeDana(sve).join() === REDOSLED.join(), 'sve postoji: svih 6, ovim redom', slikeDana(sve).join(' '));
ok(!slikeDana({ ...sve, ideKoci: false }).includes('ideKoci'), 'bez teksta za Ide ti / Koči te: slike nema');
ok(!slikeDana({ ...sve, savet: false }).includes('savet'), 'bez saveta: slike nema');
const prazno = slikeDana({ tranzita: 0, tvojDan: false, ocene: false, ideKoci: false, savet: false });
ok(prazno.join() === 'naslovna,mesec', 'prazan dan: naslovna i Mesec ostaju', prazno.join(' '));

console.log('\n3. Legenda tona i mnozina');
ok(legendaTonova({ povoljno: 7, mesovito: 2, izazovno: 1 }) === '7 skladnih · 2 mešovita · 1 napet', '7 · 2 · 1');
ok(legendaTonova({ povoljno: 1, mesovito: 0, izazovno: 3 }) === '1 skladan · 3 napeta', 'ton kog nema se ne pise; 1 / 3');
ok(legendaTonova({ povoljno: 21, mesovito: 12, izazovno: 22 }) === '21 skladan · 12 mešovitih · 22 napeta', '21 / 12 / 22');
ok(brojTranzita(1) === '1 tranzit' && brojTranzita(3) === '3 tranzita' && brojTranzita(11) === '11 tranzita', 'tranzit / tranzita');
const b = brojTonova(['povoljno', 'izazovno', 'mesovito', 'povoljno']);
ok(b.povoljno === 2 && b.izazovno === 1 && b.mesovito === 1, 'brojanje tonova');

console.log('\n4. Tocak: Ascendent levo, zodijak suprotno kazaljci');
const c = 180, r = 150, asc = 45.6;
const a0 = tackaNaTocku(asc, asc, c, r);
ok(blizu(a0.x, c - r) && blizu(a0.y, c), 'Ascendent je na 9 sati', `${a0.x.toFixed(1)}, ${a0.y.toFixed(1)}`);
const a90 = tackaNaTocku(asc + 90, asc, c, r);
ok(blizu(a90.x, c) && blizu(a90.y, c + r), '+90° je na 6 sati (IC strana, ispod horizonta)', `${a90.x.toFixed(1)}, ${a90.y.toFixed(1)}`);
const a180 = tackaNaTocku(asc + 180, asc, c, r);
ok(blizu(a180.x, c + r) && blizu(a180.y, c), '+180° (descendent) je na 3 sata');

console.log('\n5. Ugao aspekta na crtezu');
for (const u of [0, 60, 90, 120, 180]) {
  const g = ugloviCrteza(u);
  const A = tackaNaKrugu(g.tranzitna, 170, 185, 124);
  const B = tackaNaKrugu(g.natalna, 170, 185, 124);
  // Ugao izmedju dve tacke gledano iz sredine = ugao aspekta.
  const v1 = [A.x - 170, 185 - A.y], v2 = [B.x - 170, 185 - B.y];
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]));
  const izmeren = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
  ok(blizu(izmeren, u, 1e-6), `${u}°: tacke su razmaknute tacno ${u}° iz sredine`, izmeren.toFixed(3));
}
ok(luk(170, 185, 44, 90, 90) === '', 'konjunkcija: luka nema');
ok(luk(170, 185, 44, 180, 0).includes('A44 44 0 0 1'), 'opozicija: polukrug preko vrha, u smeru kazaljke');

console.log('\n6. Mesec: osam faza');
ok(fazaOsmina(0) === 0 && fazaOsmina(180) === 4 && fazaOsmina(90) === 2 && fazaOsmina(270) === 6, 'mlad 0, prva cetvrt 2, pun 4, poslednja 6');
ok(fazaOsmina(228.3) === 5, 'opadajuci posle punog (228°): peta');
ok(fazaOsmina(350) === 0 && fazaOsmina(-10) === 0, 'oko mladog: 0');

console.log('\n7. Ocene');
const oc = [{ key: 'ljubav', ocena: 4 }, { key: 'zdravlje', ocena: 4 }, { key: 'karijera', ocena: 5 }, { key: 'kuca', ocena: 4 }];
ok(najbolja(oc)?.key === 'karijera', 'najbolja: najveca ocena');
ok(najbolja([{ key: 'a', ocena: 3 }, { key: 'b', ocena: 3 }])?.key === 'a', 'pri istoj oceni: prva po redosledu');
ok(najbolja([]) === null, 'prazna lista: nema najbolje');
ok(boljeNegoJuce(4, 3) && !boljeNegoJuce(4, 4) && !boljeNegoJuce(4, null), 'bolje nego juce samo kad je juce poznato i manje');

console.log('\n8. Zraci');
ok(zraciDuzina(110, 150, 318) === 24 * 208 + 24 * 168, 'ukupna duzina 48 zraka', String(zraciDuzina(110, 150, 318)));

console.log('\n9. Primer dana (probna karta, 30.9.2026): legenda iz liste "Tranziti"');
const chart = buildNatalChart({ date: new Date(Date.UTC(1978, 0, 30, 9, 45)), ...BEOGRAD });
const dan = oblastiDana({ chart, date: new Date(2026, 8, 30, 12), timeUnknown: false });
const leg = legendaTonova(brojTonova(dan.poVaznosti.map((s) => s.ton)));
ok(dan.poVaznosti.length === 10, '10 tranzita na listi dana', String(dan.poVaznosti.length));
ok(leg === '7 skladnih · 2 mešovita · 1 napet', 'legenda kao na prototipu', leg);

console.log(fail ? `\n${fail} FAIL` : '\nSve provere prosle.');
process.exit(fail ? 1 : 0);
