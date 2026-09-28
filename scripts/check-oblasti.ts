/**
 * Provere ekrana "Tranziti" (oblasti sa ocenom). Pokreni: npm run check:oblasti
 *
 * Karte i datumi se RACUNAJU (pretraga, trenuci faza iz astronomy-engine);
 * rucno su zadati samo vestacki redovi za proveru formule ocene.
 */
import * as Astronomy from 'astronomy-engine';

import { ASPECTS, BODIES } from '../src/lib/astro';
import { buildNatalChart } from '../src/lib/natal';
import { dana, josTraje, meseci } from '../src/lib/mnozina';
import {
  jacinaTranzita, oblastiDana, oceneOblasti, ocenaIzDoprinosa, parseNaslov, rasporedi, tekstReda,
  type TranzitRed,
} from '../src/lib/oblasti';
import { OBLASTI } from '../src/lib/oblasti-config';
import { findTransits } from '../src/lib/transits';
import { BEOGRAD, primerZaOblasti } from '../src/lib/test-karta';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};

/** Vestacki red: tranzit sa zadatim kucama i jacinom — samo za formulu ocene. */
function red(t: string, aspekt: string, n: string, o: Partial<TranzitRed> = {}): TranzitRed {
  const body = BODIES.find((b) => b.key === t)!;
  const natal = BODIES.find((b) => b.key === n);
  return {
    kind: 'tranzit',
    key: `transit.${t}.${aspekt}.natal.${n}`,
    transiting: { key: body.key, name: body.name, glyph: body.glyph },
    aspect: ASPECTS.find((a) => a.key === aspekt)!,
    natal: { key: n, name: natal?.name ?? n, glyph: natal?.glyph ?? n, longitude: 0 },
    exact: true,
    distance: 0,
    transitHouse: null,
    natalHouse: null,
    ruler: null,
    jacina: 1,
    ...o,
  };
}
const oblast = (r: ReturnType<typeof rasporedi>, k: string) => r.oblasti.find((o) => o.def.key === k)!;

/* ------------------------------------------------------------------------- */
console.log('\n=== 1. Naslov tumacenja ===');
{
  const p = parseNaslov('Sunce konjunkcija Jupiter natal – Pozitivne tendencije');
  ok(p.naslov === 'Pozitivne tendencije', 'veci tekst posle "–"', JSON.stringify(p.naslov));
  ok(p.planete === 'Sunce konjunkcija Jupiter', 'manji tekst bez "natal"', JSON.stringify(p.planete));
  const q = parseNaslov('Sunce konjunkcija Jupiter natal - Pozitivne tendencije');
  ok(q.naslov === 'Pozitivne tendencije' && q.planete === 'Sunce konjunkcija Jupiter', 'isto sa "-"');
  ok(parseNaslov('Pozitivne tendencije').naslov === 'Pozitivne tendencije', 'naslov iz baze (vec bez crte) ostaje ceo');
  ok(parseNaslov('Novi e-mail').naslov === 'Novi e-mail', 'crtica unutar reci nije separator');

  const r = red('sun', 'conjunction', 'jupiter');
  const t = tekstReda(r, 'Sunce konjunkcija Jupiter natal – Pozitivne tendencije');
  ok(t.veci === 'Pozitivne tendencije' && t.manji === 'Sunce konjunkcija Jupiter' && !t.zaProveru, 'red: veci i manji tekst');
  const bez = tekstReda(r, '');
  ok(bez.veci === 'Sunce konjunkcija Jupiter' && bez.manji === null && bez.zaProveru, 'bez naslova: ime tranzita, bez manjeg, za proveru');
  const samoIme = tekstReda(r, 'Sunce konjunkcija Jupiter natal');
  ok(samoIme.manji === null && samoIme.zaProveru, 'naslov bez podnaslova = nema naslova');
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 2. Mnozina ===');
{
  const d = [1, 2, 5, 11, 21, 22].map(dana);
  ok(d.join(', ') === '1 dan, 2 dana, 5 dana, 11 dana, 21 dan, 22 dana', 'dan', d.join(', '));
  const m = [1, 3, 5, 12, 21].map(meseci);
  ok(m.join(', ') === '1 mesec, 3 meseca, 5 meseci, 12 meseci, 21 mesec', 'mesec', m.join(', '));
  ok(josTraje(0) === 'Poslednji dan', '0 dana -> "Poslednji dan"');
  ok(josTraje(30) === 'Još 30 dana', '30 -> dani', josTraje(30));
  ok(josTraje(31) === 'Još 1 mesec', '31 -> meseci', josTraje(31));
  ok(josTraje(95) === 'Još 3 meseca', '95 -> 3 meseca', josTraje(95));
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 3. Ocena ===');
{
  const prazno = rasporedi([], null, new Map());
  ok(prazno.oblasti.every((o) => o.ocena === 3 && o.oznaka === 'Miran dan' && o.stavke.length === 0),
    'oblast bez tranzita: 3, "Miran dan"');

  // Jupiter trigon Venera je povoljan po pravilu; tacan, jacina 1, kroz 5. kucu.
  const jedan = rasporedi([red('jupiter', 'trine', 'venus', { transitHouse: 5 })], null, new Map());
  const lj = oblast(jedan, 'ljubav');
  ok(lj.ocena === 5 && lj.oznaka === 'Odličan dan', 'jedan tacan povoljan tranzit preko kuce -> 5', `${lj.ocena} ${lj.oznaka}`);

  const mnogoDobrih = [1, 2, 3, 4].map((i) => red('jupiter', 'trine', 'venus', { key: `d${i}`, transitHouse: 5 }));
  const mnogoLosih = [1, 2, 3, 4].map((i) => red('saturn', 'square', 'venus', { key: `l${i}`, transitHouse: 7 }));
  ok(oblast(rasporedi(mnogoDobrih, null, new Map()), 'ljubav').ocena === 5, 'gornja granica 5');
  ok(oblast(rasporedi(mnogoLosih, null, new Map()), 'ljubav').ocena === 1, 'donja granica 1');
  const zaokr = [-9, -2.5, -1.5, -0.4, 0, 0.4, 1.5, 2.5, 9].map((z) => ocenaIzDoprinosa([z]));
  ok(zaokr.join(',') === '1,1,1,3,3,3,5,5,5', 'simetricno zaokruzivanje i granice', zaokr.join(','));

  // Mesovit se prikazuje, ali ne pomera ocenu: Saturn konjunkcija Venera (teska + blaga).
  const mes = oblast(rasporedi([red('saturn', 'conjunction', 'venus', { transitHouse: 5 })], null, new Map()), 'ljubav');
  ok(mes.stavke.length === 1 && mes.stavke[0].ton === 'mesovito' && mes.ocena === 3, 'mesovit: u listi, ocena 3');

  // Rucna oznaka astrologa ima prednost nad pravilom.
  const rucno = rasporedi([red('jupiter', 'trine', 'venus', { transitHouse: 5 })], null, new Map([['transit.jupiter.trine.natal.venus', 'Izazovno']]));
  ok(oblast(rucno, 'ljubav').ocena === 1, 'rucni ton "Izazovno" obara ocenu na 1');

  // Jacina: tacan Pluton konjunkcija Sunce = 1 × 1 × 1,2 -> ograniceno na 1; ivica orbisa = polovina.
  ok(jacinaTranzita('pluto', 'conjunction', 'sun', 0, false) === 1, 'jacina ogranicena na 1');
  ok(Math.abs(jacinaTranzita('mars', 'trine', 'uranus', 1.5, false) - 0.7 * 0.7 * 0.5) < 1e-9, 'ivica orbisa: blizina 0,5');
  ok(Math.abs(jacinaTranzita('mars', 'trine', 'saturn', 0, true) - 0.7 * 0.7 * 1.2) < 1e-9, 'vladar kao meta: x1,2');
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 4. Raspodela po oblastima ===');
{
  // Pluton kroz 5. kucu (ljubav) na natalnog Urana u 10. kuci (karijera).
  const dve = red('pluto', 'trine', 'uranus', { transitHouse: 5, natalHouse: 10 });
  // Pluton kroz 3. kucu na Neptun u 9. — nijedna kuca ni planeta sa liste.
  const nijedna = red('pluto', 'sextile', 'neptune', { transitHouse: 3, natalHouse: 9 });
  const r = rasporedi([dve, nijedna], null, new Map());
  const u = (k: string, key: string) => oblast(r, k).stavke.some((s) => s.red.key === key);
  ok(u('ljubav', dve.key) && u('karijera', dve.key), 'tranzit vezan za dve oblasti je u obe');
  ok(!u('zdravlje', dve.key) && !u('kuca', dve.key), '...i samo u njima');
  ok(r.ostali.length === 1 && r.ostali[0].red.key === nijedna.key, 'tranzit bez veze -> "Ostali tranziti"');

  // Slabija kuca: 8. kuca daje karijeri vezu 0,5.
  const slaba = rasporedi([red('pluto', 'trine', 'uranus', { transitHouse: 8 })], null, new Map());
  ok(oblast(slaba, 'karijera').stavke[0]?.veza === 0.5, 'karijera: 8. kuca = slabija veza 0,5');
  // Planeta: tranzitni Mars je na listi ljubavi i zdravlja.
  const mars = rasporedi([red('mars', 'trine', 'uranus', { transitHouse: 3 })], null, new Map());
  ok(oblast(mars, 'ljubav').stavke[0]?.veza === 0.5 && oblast(mars, 'zdravlje').stavke[0]?.veza === 0.5, 'veza preko planete 0,5');
  // Iskljucena oblast se ne prikazuje; tranzit vezan samo za nju ide u ostale.
  const bezLjubavi = rasporedi([red('venus', 'trine', 'uranus', { transitHouse: 3 })], null, new Map(), undefined, ['ljubav']);
  ok(!bezLjubavi.oblasti.some((o) => o.def.key === 'ljubav') && bezLjubavi.ostali.length === 1, 'iskljucena oblast: nema je, tranzit u ostalima');
  // Redosled prati interesovanja.
  const red2 = rasporedi([], null, new Map(), ['kuca', 'ljubav', 'karijera', 'zdravlje']);
  ok(red2.oblasti.map((o) => o.def.key).join(',') === 'kuca,ljubav,karijera,zdravlje', 'redosled oblasti po interesovanjima');
  // Sortiranje: po velicini uticaja na ocenu.
  const sort = oblast(rasporedi([
    red('venus', 'sextile', 'uranus', { key: 'slab', transitHouse: 5, jacina: 0.2 }),
    red('saturn', 'square', 'uranus', { key: 'jak', transitHouse: 5, jacina: 0.9 }),
  ], null, new Map()), 'ljubav');
  ok(sort.stavke.map((s) => s.red.key).join(',') === 'jak,slab', 'lista po velicini uticaja');
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 5. Prava karta: lista "Tranziti", ocene, vreme rodjenja ===');
{
  const chart = buildNatalChart({ date: new Date(Date.UTC(1990, 6, 10, 12, 30)), ...BEOGRAD });
  const danas = new Date(2026, 8, 28, 12);
  const ekran = oblastiDana({ chart, date: danas, timeUnknown: false });
  const pocetna = oceneOblasti(ekran);
  ok(pocetna.every((p, i) => p.key === ekran.oblasti[i].def.key && p.ocena === ekran.oblasti[i].ocena),
    'ocene za pocetnu = ocene oblasti', pocetna.map((p) => `${p.key}:${p.ocena}`).join(' '));

  // Tab "Tranziti": svaki tranziti TACNO jednom, bez oblasti, po vaznosti (jacini).
  const lista = ekran.poVaznosti;
  ok(new Set(lista.map((t) => t.red.key)).size === lista.length, 'lista: svaki tranzit tacno jednom', `${lista.length}`);
  // Lista ide sirim orbisom (LISTA_ORB = "Tema perioda"): sadrzi sve iz uske
  // (od kojih su ocene) i sve spore koje "Tema perioda" prikazuje (Ivan, 28.9.2026).
  const uLisi = new Set(lista.map((t) => t.red.key));
  ok(ekran.tranziti.every((t) => uLisi.has(t.key)), 'lista: sadrzi sve tranzite od kojih su ocene',
    `${ekran.tranziti.length} u uskom, ${lista.length} u listi`);
  const spori = findTransits(chart, danas).filter((t) => ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(t.transiting.key));
  ok(spori.every((t) => uLisi.has(t.contentKey)), 'lista: svi spori tranziti iz "Teme perioda"',
    spori.map((t) => `${t.contentKey.replace('transit.', '')} ${t.orb.toFixed(1)}°`).join(', '));
  ok(lista.every((t, i) => i === 0 || lista[i - 1].red.jacina >= t.red.jacina), 'lista: po vaznosti, najjaci prvi',
    lista.map((t) => t.red.jacina.toFixed(2)).join(' '));
  ok(ekran.tranziti.every((t) => t.transiting.key !== 'moon'), 'tranziti Meseca ne ulaze');
  ok(ekran.oblasti.every((o) => o.ocena >= 1 && o.ocena <= 5), 'sve ocene u 1—5');
  // Ista ocena ceo dan: jutro i vece daju isto.
  const jutro = oceneOblasti(oblastiDana({ chart, date: new Date(2026, 8, 28, 0, 5), timeUnknown: false }));
  const vece = oceneOblasti(oblastiDana({ chart, date: new Date(2026, 8, 28, 23, 55), timeUnknown: false }));
  ok(JSON.stringify(jutro) === JSON.stringify(vece), 'ista ocena u 00:05 i u 23:55');

  // Dan Mladog Meseca, racunat.
  const mlad = Astronomy.SearchMoonPhase(0, new Date(2026, 8, 1), 40)!.date;
  const dan = new Date(mlad.getFullYear(), mlad.getMonth(), mlad.getDate(), 12);
  const sa = oblastiDana({ chart, date: dan, timeUnknown: false });
  const sviRedovi = [...sa.oblasti.flatMap((o) => o.stavke), ...sa.ostali];
  ok(sviRedovi.some((s) => s.red.kind === 'lunacija' && s.ton === 'povoljno'), 'Mlad Mesec: red u oblasti kuce (ili u ostalima), Povoljno');
  ok(sa.poVaznosti.every((t) => t.red.kind === 'tranzit'), 'lista "Tranziti": bez reda za Mlad Mesec');
  ok(sa.tranziti.every((t) => t.kind === 'tranzit'), '"Aktivnih" ne broji red za Mlad Mesec');

  const bez = oblastiDana({ chart, date: dan, timeUnknown: true });
  const bezRedovi = [...bez.oblasti.flatMap((o) => o.stavke), ...bez.ostali];
  ok(bez.bezKuca, 'bez vremena rodjenja: poruka o vremenu rodjenja');
  ok(!bezRedovi.some((s) => s.red.kind === 'lunacija'), 'bez vremena rodjenja: nema reda za Mlad/Pun Mesec');
  ok(bez.tranziti.every((t) => t.transitHouse === null && t.natalHouse === null), 'bez vremena rodjenja: bez kuca');
  ok(bez.tranziti.every((t) => t.natal.key !== 'ascendant' && t.natal.key !== 'midheaven'), 'bez vremena rodjenja: bez Asc i MC');
  ok(bez.oblasti.every((o) => o.stavke.every((s) => s.veza === 0.5)), 'bez vremena rodjenja: veza samo preko planeta (0,5)');
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 6. Pregled /dev-tranziti ===');
{
  const t0 = Date.now();
  const p = primerZaOblasti(new Date(2026, 8, 28));
  ok(!!p, 'postoji test karta sa redom u svakoj oblasti i u ostalima', p ? `${p.chart.birth.date.toISOString().slice(0, 13)}h UT, ${p.date.toDateString()}, ${Date.now() - t0} ms` : '');
  ok(OBLASTI.length === 4, 'cetiri oblasti');
}

console.log(fail ? `\n${fail} FAIL` : '\nSve provere prosle.');
process.exit(fail ? 1 : 0);
