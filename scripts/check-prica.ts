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
  boljeNegoJuce, brojTonova, brojTranzita, fazaOsmina, kadarVidea, legendaTonova, luk, najbolja, poluprecnikKruga, rasporedVidea, reciZaPrelom, redovaTeksta, REDOSLED, slikeDana, VIDEO,
  tackaNaKrugu, tackaNaTocku, TRAJANJE, TRAJANJE_STALNO, trajanjeSlike, ugloviCrteza, velicinaSaveta, VELICINE_SAVETA, VELICINE_SAVETA_KARTICA, visinaNatpisa, ZNAK_EM, zraciDuzina,
} from '../src/lib/prica';
import { BEOGRAD } from '../src/lib/test-karta';
import { LOGO_OKRET_S, polozajZnaka, ugaoLoga } from '../src/lib/logo-price';
import { LOGO_KRUG, LOGO_ZNAKOVI } from '../src/lib/logo-price-oblici';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(62)} ${detail}`);
};
const blizu = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e;

console.log('\n1. Trajanje slike: 1 s + 0,25 s po reci, 4—8 s');
ok(trajanjeSlike('') === TRAJANJE.min, 'bez teksta: najmanje 4 s', String(trajanjeSlike('')));
ok(trajanjeSlike('Budite strpljivi i dosledni.') === 4000, 'kratka recenica: 4 s');
const td = 'Stabilan i odgovoran napredak Donosite važne odluke i planove s jasnoćom. Osećate veću odgovornost i spremnost da prihvatite savete koji vam pomažu da rastete.';
ok(trajanjeSlike(td) === 1000 + 24 * 250, '"Tvoj dan" (24 reci): 7 s', String(trajanjeSlike(td)));
ok(trajanjeSlike(Array(60).fill('rec').join(' ')) === TRAJANJE.max, 'dug tekst: najvise 8 s');
ok(trajanjeSlike('  jedna   dve  ') === 4000, 'visak razmaka ne broji reci');
const tipican = TRAJANJE_STALNO.naslovna + trajanjeSlike(td) + TRAJANJE_STALNO.ocene + trajanjeSlike(Array(24).fill('rec').join(' '))
  + trajanjeSlike(Array(19).fill('rec').join(' ')) + TRAJANJE_STALNO.savet;
ok(tipican <= 36000, 'tipican dan (6 slika) traje do 36 s', `${tipican / 1000} s`);

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

console.log('\n10. Savet: velicina slova po duzini (ne sme preci zaglavlje ni dugme)');
const KRATAK = 'Budite strpljivi i dosledni.';
const S72 = 'Iskoristite ovu energiju za unapređenje ljubavnih i kreativnih odnosa.';
const S141 = 'Otvorite se za ljubav – Iskoristite ovaj period za jačanje ljubavnih i prijateljskih odnosa, rešite nesuglasice i uživajte u lepim trenucima.';
const S196 = 'Umesto da reagujete naglo, koristite strpljenje i taktiku. Kanalizujte višak energije kroz fizičku aktivnost i konstruktivne projekte. Pametno birajte bitke i ne dozvolite da ego vodi vaše odluke.';
const uRedu44 = Math.floor(354 / (44 * ZNAK_EM));
ok(redovaTeksta(S72, uRedu44) === 6, 'podeseno: 72 znaka pri 44 = 6 redova (snimak iz simulatora)', String(redovaTeksta(S72, uRedu44)));
ok(redovaTeksta(S141, uRedu44) === 12, 'podeseno: 141 znak pri 44 = 12 redova (snimak sa telefona)', String(redovaTeksta(S141, uRedu44)));
// iPhone 16/17 (402 × 874): sirina 354, visina za savet 501; iPhone SE (375 × 667): 327 × 370.
const VELIKI = { w: 354, h: 874 - 126 - 162 - 85 };
const MALI = { w: 327, h: 667 - 84 - 128 - 85 };
// Kartica: blok 332 pt oko sredine zraka, bez oznake (25), razmaka (14) i natpisa u jednom redu (18).
const KARTICA_H = 332 - 25 - 14 - visinaNatpisa('Iz tumačenja tranzita Sunce kvadrat Sunce.', 316);
ok(visinaNatpisa('Iz tumačenja tranzita Sunce kvadrat Sunce.', 316) === 18, 'natpis ispod saveta na kartici: jedan red');
ok(velicinaSaveta(S72, 316, KARTICA_H, VELICINE_SAVETA_KARTICA).velicina === 39, 'kartica: savet od 72 znaka ostaje 39 (kao do sada)');
ok(velicinaSaveta(KRATAK, VELIKI.w, VELIKI.h).velicina === 44, 'kratak savet ostaje 44');
ok(velicinaSaveta(S72, VELIKI.w, VELIKI.h).velicina === 44, 'savet od 72 znaka (6 redova) ostaje 44');
const v141 = velicinaSaveta(S141, VELIKI.w, VELIKI.h);
ok(v141.velicina < 44 && v141.redova * v141.prored <= VELIKI.h, 'savet sa slike (141) je manji i staje', `${v141.velicina} pt, ${v141.redova} redova`);
for (const [ime, t] of [['141', S141], ['196 (najduzi)', S196]] as const) {
  for (const [telefon, m] of [['iPhone 16/17', VELIKI], ['iPhone SE', MALI]] as const) {
    const v = velicinaSaveta(t, m.w, m.h);
    ok(v.redova * v.prored <= m.h, `${ime} staje na ${telefon}`, `${v.velicina} pt, ${v.redova} redova, ${v.redova * v.prored}/${m.h} pt`);
  }
  const k = velicinaSaveta(t, 316, KARTICA_H, VELICINE_SAVETA_KARTICA);
  ok(k.redova * k.prored <= KARTICA_H, `${ime} staje na karticu za deljenje`, `${k.velicina} pt, ${k.redova} redova`);
}
ok(VELICINE_SAVETA.includes(velicinaSaveta(S196, 100, 50).velicina as never), 'kad nista ne staje: najmanja iz spiska, ne izmisljena', String(velicinaSaveta(S196, 100, 50).velicina));

console.log('\n11. Video price: raspored kadrova');
{
  const obicna = [9000, 11600, 7000, 8000, 9000, 6000];
  const r = rasporedVidea(obicna);
  ok(r.ukupno === 50600 && r.trajanje.join() === obicna.join(), 'prica do 58 s: ista trajanja kao u prici', `${r.ukupno} ms`);
  ok(r.kadrova === Math.ceil((50600 * 30) / 1000), 'broj kadrova = trajanje × 30', String(r.kadrova));
  const duga = rasporedVidea([12000, 12000, 12000, 12000, 12000, 12000]);
  ok(duga.ukupno <= VIDEO.najduze, 'sest slika po 12 s: skraceno na najvise 58 s (Instagram prica 60 s)', `${duga.ukupno} ms`);
  ok(duga.trajanje.every((d) => d >= VIDEO.najkrace), 'nijedna slika ispod 3,5 s');
  const mesana = rasporedVidea([12000, 12000, 12000, 12000, 12000, 3000]);
  ok(mesana.ukupno <= VIDEO.najduze && mesana.trajanje[5] === VIDEO.najkrace, 'kratka slika ostaje najkraca, duge se skrate', mesana.trajanje.join(' '));
  const k0 = kadarVidea(r, 0);
  ok(k0.gore.i === 0 && k0.gore.sat === 0 && k0.dole === null && k0.prelaz === 1, 'prvi kadar: prva slika od pocetka, bez prelaza');
  const naPrelazu = kadarVidea(r, Math.ceil((r.pocetak[1] * 30) / 1000));
  ok(naPrelazu.gore.i === 1 && naPrelazu.dole?.i === 0 && naPrelazu.prelaz < 0.1, 'pocetak druge slike: krug krece, prva je ispod', naPrelazu.prelaz.toFixed(3));
  const posle = kadarVidea(r, Math.ceil(((r.pocetak[1] + VIDEO.prelaz) * 30) / 1000));
  ok(posle.dole === null && posle.prelaz === 1, 'posle 750 ms: druga slika cela, prve nema');
  let dobro = true;
  let poslednja = 0;
  for (let f = 0; f < r.kadrova; f++) {
    const k = kadarVidea(r, f);
    if (k.gore.sat < 0 || k.gore.sat >= r.trajanje[k.gore.i] || k.gore.i < poslednja) dobro = false;
    poslednja = k.gore.i;
  }
  ok(dobro && poslednja === 5, 'svaki kadar: slika po redu, sat unutar njenog trajanja, kraj na poslednjoj');
  const sKrajem = rasporedVidea(obicna, VIDEO.zavrsni);
  ok(sKrajem.trajanje.length === 7 && sKrajem.trajanje[6] === VIDEO.zavrsni && sKrajem.ukupno === 50600 + VIDEO.zavrsni,
    'zavrsni kadar (logo): posle poslednje slike, 2,2 s', `${sKrajem.ukupno} ms`);
  const dugaSKrajem = rasporedVidea([12000, 12000, 12000, 12000, 12000, 12000], VIDEO.zavrsni);
  ok(dugaSKrajem.ukupno <= VIDEO.najduze && dugaSKrajem.trajanje[6] === VIDEO.zavrsni,
    'duga prica + zavrsni: i dalje najvise 58 s, zavrsni se ne skracuje', `${dugaSKrajem.ukupno} ms`);
  const kraj = kadarVidea(sKrajem, sKrajem.kadrova - 1);
  ok(kraj.gore.i === 6 && kraj.dole === null, 'poslednji kadar je zavrsni, ceo');
  const R0 = poluprecnikKruga(360, 640, 306, 352);
  ok([[0, 0], [360, 0], [0, 640], [360, 640]].every(([x, y]) => Math.hypot(x - 306, y - 352) < R0), 'krug iz (0,85; 0,55) pokrije sva cetiri ugla kartice', R0.toFixed(1));
}

console.log('\n12. Logo u videu: krug se vrti (lice miruje, znakovi kruze uspravni)');
ok(LOGO_ZNAKOVI.length === 12 && LOGO_ZNAKOVI.reduce((n, z) => n + z.delovi.length, 0) === 15, '12 znakova od 15 delova (Rak, Vaga, Vodolija po dva)');
ok(Math.abs(LOGO_KRUG.rLice - 16) < 0.1, 'ivica lica: r = 13,5 / 40 poluprecnika (kao u logu)', String(LOGO_KRUG.rLice));
ok(ugaoLoga(0) === 0 && Math.abs(ugaoLoga(1500) - 90) < 1e-9 && Math.abs(ugaoLoga(LOGO_OKRET_S * 1000)) < 1e-9, 'jedan krug na 6 s; posle kruga isto kao na pocetku');
const z0 = LOGO_ZNAKOVI[0];
const p0 = polozajZnaka(z0, 0);
ok(blizu(p0.x, z0.cx) && blizu(p0.y, z0.cy), 'ugao 0: znak na svom mestu (slika za deljenje = kao u fajlu)');
const udaljenost = (p: { x: number; y: number }) => Math.hypot(p.x - LOGO_KRUG.cx, p.y - LOGO_KRUG.cy);
ok(LOGO_ZNAKOVI.every((z) => blizu(udaljenost(polozajZnaka(z, 137)), udaljenost({ x: z.cx, y: z.cy }), 1e-9)), 'znakovi ostaju na istom krugu dok kruze');
const desno = polozajZnaka({ cx: LOGO_KRUG.cx + 10, cy: LOGO_KRUG.cy }, 90);
ok(blizu(desno.x, LOGO_KRUG.cx) && blizu(desno.y, LOGO_KRUG.cy + 10), 'smer kazaljke na ekranu: desno -> dole posle 90°');

console.log(fail ? `\n${fail} FAIL` : '\nSve provere prosle.');
process.exit(fail ? 1 : 0);
