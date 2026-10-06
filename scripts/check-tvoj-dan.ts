/**
 * Provere kartica "Tvoj dan" i "Mesec danas". Pokreni: npm run check:tvoj-dan
 *
 * Svi datumi i vrednosti se RACUNAJU (trenuci faza iz astronomy-engine,
 * rodjenje sa Ascendentom u Ribama nadjeno pretragom), ne upisuju rucno.
 */
import * as Astronomy from 'astronomy-engine';

import { bodyLongitude } from '../src/lib/astro';
import { buildNatalChart } from '../src/lib/natal';
import { signFromLongitude } from '../src/lib/zodiac';
import { phaseDay, lunationHouse, MAIN_PHASES } from '../src/lib/moon';
import { signRulers, chartRulers } from '../src/lib/rulers';
import { toneByRule, transitTone, type Tone } from '../src/lib/tone';
import {
  dayStatus, pickTvojDan, tvojDanCandidates, tvojDanWindow, tvojDanInfo, TD_ORB, type TvojDanLog,
} from '../src/lib/tvoj-dan';
import { dayKey, moonDay, strongestMoonHit } from '../src/lib/transits';
import { kartaSaAscendentom } from '../src/lib/test-karta';
import { triOdeljka, stavkaZaPrikaz, prveRecenice, stavka, lunarneStavke } from '../src/lib/tumacenje';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(62)} ${detail}`);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const noon = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

const BG = { latitude: 44.8125, longitude: 20.4612 };

/* ------------------------------------------------------------------------- */
console.log('\n=== 1. Osvetljenost u trenutku glavne faze (12 lunacija) ===');
{
  const od = new Date(Date.UTC(2026, 0, 1));
  let najgore = { new: 0, first: 100, full: 100, last: 100 } as Record<string, number>;
  let losih = 0;
  for (const p of MAIN_PHASES) {
    let t = od;
    for (let i = 0; i < 12; i++) {
      const hit = Astronomy.SearchMoonPhase(p.angle, t, 40)!;
      const pct = phaseDay(hit.date).illuminationPct;
      const dobro =
        p.key === 'new' ? pct <= 2 : p.key === 'full' ? pct >= 98 : pct >= 48 && pct <= 52;
      if (!dobro) losih++;
      if (p.key === 'new') najgore.new = Math.max(najgore.new, pct);
      else if (p.key === 'full') najgore.full = Math.min(najgore.full, pct);
      else najgore[p.key] = Math.abs(pct - 50) > Math.abs(najgore[p.key] - 50) || najgore[p.key] === 100 ? pct : najgore[p.key];
      t = new Date(hit.date.getTime() + 86_400_000);
    }
  }
  ok(losih === 0, 'Mlad <= 2%, Pun >= 98%, cetvrti 48—52%', JSON.stringify(najgore));

  // Nasa osvetljenost prema formuli iz briefa (1 − cos D)/2, D iz ECT longituda.
  let maxRazlika = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.UTC(2026, 8, 1) + i * 0.5 * 86_400_000);
    const D = (bodyLongitude('moon', d) - bodyLongitude('sun', d)) * (Math.PI / 180);
    const formula = Math.round(((1 - Math.cos(D)) / 2) * 100);
    maxRazlika = Math.max(maxRazlika, Math.abs(formula - phaseDay(d).illuminationPct));
  }
  ok(maxRazlika <= 1, 'Illumination() prema (1 − cos D)/2', `najveca razlika ${maxRazlika}%`);
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 2. Ime faze i znak — na dan faze i dan posle ===');
{
  let t = new Date(2026, 8, 1);
  for (const p of MAIN_PHASES) {
    const hit = Astronomy.SearchMoonPhase(p.angle, t, 40)!.date;
    const dan = phaseDay(noon(hit));
    const znakTacno = signFromLongitude(bodyLongitude('moon', hit)).sign.key;
    ok(dan.key === p.key && dan.name === p.name, `${p.name}, ${dayKey(hit)}: ime`, dan.name);
    ok(signFromLongitude(dan.moonLongitude).sign.key === znakTacno, `${p.name}: znak u tacnom trenutku`, znakTacno);
    // Isti dan u ponoc i pred kraj dana: ime faze nosi CEO kalendarski dan.
    const ponoc = phaseDay(new Date(hit.getFullYear(), hit.getMonth(), hit.getDate(), 0, 1));
    const kasno = phaseDay(new Date(hit.getFullYear(), hit.getMonth(), hit.getDate(), 23, 59));
    ok(ponoc.key === p.key && kasno.key === p.key, `${p.name}: ceo dan (00:01 i 23:59)`);

    const posle = phaseDay(noon(addDays(hit, 1)));
    const ocekivano = p.key === 'new' || p.key === 'first' ? 'waxing' : 'waning';
    const znakSad = signFromLongitude(bodyLongitude('moon', noon(addDays(hit, 1)))).sign.key;
    ok(posle.key === ocekivano, `${p.name}: dan posle`, posle.name);
    ok(signFromLongitude(posle.moonLongitude).sign.key === znakSad, `${p.name}: dan posle, znak SADA`, znakSad);
    ok(posle.next.at > addDays(hit, 2), `${p.name}: sledeca faza je posle ovog dana`, `${posle.next.name} ${dayKey(posle.next.at)}`);
    t = addDays(hit, 1);
  }
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 3. Vladar ===');
ok(signRulers('pisces', 'traditional').join() === 'jupiter', 'Ribe, traditional -> Jupiter');
ok(signRulers('pisces', 'modern').join() === 'neptune', 'Ribe, modern -> Neptun');
ok(signRulers('pisces', 'both').join() === 'jupiter,neptune', 'Ribe, both -> Jupiter i Neptun');
ok(signRulers('leo', 'both').join() === 'sun', 'Lav, both -> samo Sunce (bez ponavljanja)');

const ribe = kartaSaAscendentom('pisces');
console.log(`      test karta: rodjen ${ribe.birth.date.toISOString()} UT, ASC ${ribe.ascendantSign.formatted}`);
ok(chartRulers(ribe, false).join() === 'jupiter', 'karta sa ASC u Ribama -> vladar Jupiter');

/* Prvi dan od 27.9.2026. kad je tranzitno Sunce TACNO na natalnom Jupiteru. */
const jupiter = ribe.planets.find((p) => p.key === 'jupiter')!.longitude;
let danKonj: Date | null = null;
for (let o = 0; o < 400 && !danKonj; o++) {
  const d = addDays(new Date(2026, 8, 27), o);
  const s = dayStatus(bodyLongitude('sun', d), bodyLongitude('sun', addDays(d, 1)), jupiter, 0, TD_ORB.sun);
  if (s.exact) danKonj = d;
}
{
  const kandidati = tvojDanCandidates(ribe, danKonj!, false);
  const k = kandidati.find((c) => c.contentKey === 'transit.sun.conjunction.natal.jupiter');
  ok(!!k && k.ruler === 'natal', `Sunce konj. natalni Jupiter (${dayKey(danKonj!)}): oznaka vladara`, k ? `ruler=${k.ruler}, skor ${k.score.toFixed(2)}` : 'nije kandidat');
  const bezVladara = tvojDanCandidates({ ...ribe }, danKonj!, true).find((c) => c.contentKey === k?.contentKey);
  ok(!!bezVladara && bezVladara.ruler === null && bezVladara.score < k!.score, 'isti tranzit bez vremena rodjenja: bez oznake, nizi skor');
}

{
  // List "Na osnovu cega je ovaj tekst" (`app/tvoj-dan-info.tsx`).
  const i = tvojDanInfo(ribe, false, 'transit.sun.conjunction.natal.jupiter');
  ok(i?.ruler === 'natal' && i.rulerText === 'Jupiter je vladar tvog Ascendenta u Ribama. Kad ga tranzit dodirne, dan se oseća ličnije i jače, zato ovaj tranzit danas ima prednost.', 'list: vladar natalni, recenica iz briefa', i?.rulerText ?? '');
  const t = tvojDanInfo(ribe, false, 'transit.jupiter.square.natal.venus');
  ok(t?.ruler === 'transiting' && t.rulerText === 'Jupiter je vladar tvog Ascendenta u Ribama, a danas pokreće tvoju Veneru. Zato ovaj tranzit danas ima prednost.', 'list: vladar tranzitni, akuzativ "tvoju Veneru"');
  ok(tvojDanInfo(ribe, false, 'transit.mars.trine.natal.venus')?.rulerText === null, 'list: tranzit bez vladara -> bez recenice');
  ok(tvojDanInfo(ribe, true, 'transit.sun.conjunction.natal.jupiter')?.ruler === null, 'list: bez vremena rodjenja nema vladara');
  ok(tvojDanInfo(ribe, true, 'transit.sun.trine.natal.ascendant') === null && tvojDanInfo(ribe, false, 'nesto.drugo') === null, 'list: ASC bez vremena i los kljuc -> null');
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 4. Bez vremena rodjenja ===');
{
  ok(chartRulers(ribe, true).length === 0, 'nema vladara');
  let bezOznake = true;
  let bezUglova = true;
  let zaTebe = 0;
  let t = new Date(2026, 8, 27);
  for (let i = 0; i < 30; i++) {
    const d = addDays(t, i);
    for (const c of tvojDanCandidates(ribe, d, true)) {
      if (c.ruler) bezOznake = false;
      if (c.natal.key === 'ascendant' || c.natal.key === 'midheaven') bezUglova = false;
    }
    if (lunationHouse(phaseDay(noon(d)), ribe, true)) zaTebe++;
  }
  ok(bezOznake, '30 dana: nijedan kandidat nema oznaku vladara');
  ok(bezUglova, '30 dana: nijedan tranzit na ASC ili MC');
  ok(zaTebe === 0, '30 dana: nema reda "Za tebe"');
  // Sa vremenom: red postoji tacno na dan Mladog i Punog Meseca.
  let saVremenom = 0;
  for (let i = 0; i < 30; i++) if (lunationHouse(phaseDay(noon(addDays(t, i))), ribe, false)) saVremenom++;
  ok(saVremenom === 2, 'sa vremenom: "Za tebe" samo na Mlad i Pun Mesec', `${saVremenom} dana od 30`);
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 5. Rotacija — 20 dana (karta iz docs/tvoj_dan_simulacija.py) ===');
{
  // Rodjen 10.7.1990. u 14:30 u Beogradu = 12:30 UT, kao u simulaciji.
  const natal = buildNatalChart({ date: new Date(Date.UTC(1990, 6, 10, 12, 30)), ...BG });
  const log: TvojDanLog = {};
  const redovi: { dan: string; key: string | null; moment: string; n: number }[] = [];
  for (let i = 0; i < 20; i++) {
    const d = addDays(new Date(2026, 8, 27), i);
    const p = pickTvojDan(natal, d, false, log);
    if (p) log[dayKey(d)] = p.contentKey;
    redovi.push({ dan: dayKey(d), key: p?.contentKey ?? null, moment: p?.moment ?? '—', n: p?.shownBefore ?? 0 });
  }
  for (const r of redovi) {
    const ime = r.key ? r.key.replace('transit.', '').replace('.natal.', ' -> ') : '— (nema kartice)';
    console.log(`      ${r.dan}  ${ime.padEnd(34)} ${r.moment.padEnd(9)} prikaz ${r.n + 1}`);
  }
  const zaredom = redovi.filter((r, i) => i > 0 && r.key && r.key === redovi[i - 1].key).length;
  ok(zaredom === 0, 'nijedan tranzit dva dana zaredom', `${zaredom}`);
  const razlicitih = new Set(redovi.map((r) => r.key).filter(Boolean)).size;
  ok(razlicitih >= 10, 'bar 10 razlicitih u 20 dana', `${razlicitih}`);

  // Odmor: brzi tranzit prikazan danas ne sme sutra ni prekosutra (osim egzaktnog prekosutra).
  let prekrsaja = 0;
  for (let i = 0; i < redovi.length; i++) {
    const k = redovi[i].key;
    if (!k || !/transit\.(sun|mercury|venus|mars)\./.test(k)) continue;
    if (redovi[i + 1]?.key === k) prekrsaja++;
    if (redovi[i + 2]?.key === k && redovi[i + 2].moment !== 'egzaktan') prekrsaja++;
  }
  ok(prekrsaja === 0, 'brzi: odmor 3 dana (izuzetak: egzaktan posle 2)', `${prekrsaja}`);
  // Spori: samo na dan pocetka, egzaktnosti ili kraja.
  const spori = redovi.filter((r) => r.key && /transit\.(jupiter|saturn|uranus|neptune|pluto)\./.test(r.key));
  ok(spori.every((r) => r.moment !== 'traje'), 'spori: samo pocetak, egzaktnost ili kraj', `${spori.length} prikaza`);
  // Mesec: samo egzaktan.
  const mesec = redovi.filter((r) => r.key?.startsWith('transit.moon.'));
  ok(mesec.every((r) => r.moment === 'egzaktan'), 'Mesec: samo na dan tacnog aspekta', `${mesec.length} prikaza`);

  // Trajanje: pocetak <= danas <= kraj, i dan pre pocetka / posle kraja nije aktivan.
  const d0 = new Date(2026, 8, 27);
  const p0 = pickTvojDan(natal, d0, false, {})!;
  const w = tvojDanWindow(p0, d0);
  ok(!!w.start && !!w.end && w.start <= d0 && w.end >= addDays(d0, 0), `trajanje ${p0.contentKey}`, `${w.start && dayKey(w.start)} — ${w.end && dayKey(w.end)}`);
  if (w.start && w.end && p0.transiting.key !== 'moon') {
    const aktivan = (d: Date) => dayStatus(
      bodyLongitude(p0.transiting.key, d), bodyLongitude(p0.transiting.key, addDays(d, 1)),
      p0.natal.longitude, p0.aspect.angle, TD_ORB[p0.transiting.key]
    ).active;
    ok(!aktivan(addDays(w.start, -1)) && aktivan(w.start), 'pocetak = dan ulaska u orbis');
    ok(!aktivan(addDays(w.end, 1)) && aktivan(w.end), 'kraj = poslednji dan u orbisu');
  }
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 5b. Licni Mesecev aspekt na kartici "Mesec danas" ===');
{
  // Prvi dan sa bar dva Meseceva aspekta koji postaju tacni: bez iskljucenja je
  // najjaci isti kao u `moonDay`; kad je on vec u "Tvom danu", ide sledeci.
  let proveren = false;
  for (let o = 0; o < 30 && !proveren; o++) {
    const d = addDays(new Date(2026, 8, 27), o);
    const m = moonDay(ribe, d, false);
    if (m.hits.length < 2) continue;
    const prvi = strongestMoonHit(m.hits);
    const drugi = strongestMoonHit(m.hits, prvi!.contentKey);
    ok(prvi?.contentKey === m.strongest?.contentKey, `${dayKey(d)}: bez iskljucenja = moonDay.strongest`, prvi?.contentKey);
    ok(!!drugi && drugi.contentKey !== prvi!.contentKey, 'tranzit iz "Tvog dana" se ne ponavlja', drugi?.contentKey);
    proveren = true;
  }
  ok(proveren, 'nadjen dan sa dva Meseceva aspekta');
}

console.log('\n=== 6. Ton ===');
const TON: [string, string, string, Tone][] = [
  ['sun', 'conjunction', 'jupiter', 'povoljno'],
  ['sun', 'conjunction', 'mars', 'mesovito'],
  ['saturn', 'square', 'sun', 'izazovno'],
  ['venus', 'sextile', 'venus', 'povoljno'],
  ['saturn', 'trine', 'moon', 'povoljno'],
  ['pluto', 'conjunction', 'venus', 'mesovito'],
  ['saturn', 'conjunction', 'mars', 'izazovno'],
  ['jupiter', 'square', 'sun', 'mesovito'],
  ['venus', 'opposition', 'mars', 'mesovito'],
  ['neptune', 'square', 'sun', 'izazovno'],
  ['moon', 'conjunction', 'saturn', 'izazovno'],
  ['mars', 'square', 'ascendant', 'izazovno'],
];
for (const [t, a, n, ocekivano] of TON) {
  const dobijeno = toneByRule(t, a, n);
  ok(dobijeno === ocekivano, `${t} ${a} ${n}`, dobijeno);
}
{
  const r = transitTone('mars', 'square', 'ascendant', 'Povoljno');
  ok(r.tone === 'povoljno' && r.source === 'manual', 'rucna oznaka "Povoljno" na Mars kvadrat Asc ima prednost', `${r.tone}/${r.source}`);
  const b = transitTone('mars', 'square', 'ascendant', null);
  ok(b.tone === 'izazovno' && b.source === 'rule', 'bez oznake: pravilo, izvor "rule"', `${b.tone}/${b.source}`);
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 7. Odeljci duge verzije i rotacija stavki ===');
{
  const o = triOdeljka([
    { heading: 'Suština', body: 'Uvod.' },
    { heading: 'Pozitivna dejstva', body: '• Uspeh – Lakše ide.\n• Odnosi – Podrška.' },
    { heading: 'Izazovi', body: '• Troškovi: Pazi na novac.\n• Previše poverenja – Granice.\n• Umor – Odmori.' },
    { heading: 'Saveti', body: '• Ekspanzija – Širi vidike.\n\nOvaj aspekt donosi prilike.' },
  ]);
  ok(o.efekat.length === 2 && o.pazi.length === 3 && o.savet.length === 1, 'varijanta naslova + zavrsni pasus se preskace', `${o.efekat.length}/${o.pazi.length}/${o.savet.length}`);
  ok(o.pazi[0].naslov === 'Troškovi' && o.pazi[0].tekst === 'Pazi na novac.', 'separator ":"');
  ok(o.pazi[1].naslov === 'Previše poverenja', 'separator "–"');
  ok(stavkaZaPrikaz(o.efekat, 0)?.naslov === 'Uspeh' && stavkaZaPrikaz(o.efekat, 1)?.naslov === 'Odnosi' && stavkaZaPrikaz(o.efekat, 2)?.naslov === 'Uspeh', 'n-ti prikaz -> n-ta stavka, ukrug');
  ok(stavkaZaPrikaz([], 3) === null, 'prazan odeljak -> nista');
  ok(stavka('Ovo je rečenica koja ima dvotačku tek posle mnogo, mnogo, mnogo reči: kraj.').naslov === undefined, 'duga recenica sa dvotackom nije naslov');
  ok(prveRecenice('Prva. Druga! Treća? Četvrta.') === 'Prva. Druga!', 'sazetak: prve dve recenice');
}

console.log('\n=== 8. Lunarni kalendar na kartici: tri stavke, Basta uradi/izbegavaj ===');
{
  // Oblik teksta iz `lunar_texts.body`: uvod, lista, pa red o delu biljke.
  const kratka = lunarneStavke('Prva. Druga recenica uvoda. Poslednja, savet.\n\n• Jedina stavka.\n\nOdgovarajući deo biljke: cvet (kupus).');
  ok(kratka.stavke.length === 3 && kratka.izUvoda === 2, 'lista od 1 -> dopuna do 3 iz uvoda', String(kratka.stavke.length));
  ok(kratka.stavke[0].tekst === 'Jedina stavka.' && kratka.stavke[2].tekst === 'Poslednja, savet.', 'prvo lista, pa POSLEDNJE recenice uvoda');
  ok(!kratka.stavke.some((x) => /deo biljke/i.test(x.tekst)), 'red o delu biljke se preskace');
  // Prevod (hr/bs): "Odgovarajući dio biljke", "Izbjegavajte".
  const ije = lunarneStavke('Uvod jedan. Uvod dva.\n\n• Izbjegavajte presađivanje.\n• Zalijte vrt.\n\nOdgovarajući dio biljke: cvijet (kupus).');
  ok(!ije.stavke.some((x) => /dio biljke/i.test(x.tekst)), 'ijekavski red o dijelu biljke se preskace');
  ok(ije.izbegavaj.map((x) => x.tekst).join('|') === 'Izbjegavajte presađivanje.' && ije.uradi.map((x) => x.tekst).join('|') === 'Zalijte vrt.', '"Izbjegavajte" ide u Izbegavaj', ije.izbegavaj.length + '/' + ije.uradi.length);
  const duga = lunarneStavke('Uvod.\n\n• A.\n• B.\n• C.\n• D.');
  ok(duga.stavke.map((x) => x.tekst).join('') === 'A.B.C.' && duga.izUvoda === 0, 'lista od 4 -> prve tri, bez uvoda');

  const b = lunarneStavke('Ovo su nepovoljni dani za setvu. Ovo je los period za sve.\n\n• Nega rasada u leji.\n• Ne zalivati biljke.\n• Nepovoljan je period za orezivanje.\n• Kositi travnjak.');
  ok(b.izbegavaj.map((x) => x.tekst).join('|') === 'Ne zalivati biljke.|Nepovoljan je period za orezivanje.|Ovo su nepovoljni dani za setvu.', 'izbegavaj: "Ne ", "Nepovoljan", pa zabrana iz uvoda', b.izbegavaj.length + '');
  ok(b.uradi.map((x) => x.tekst).join('|') === 'Nega rasada u leji.|Kositi travnjak.', 'uradi: samo lista, bez uvoda (ni "los period")');
  ok(b.proveriti.length === 1 && b.proveriti[0].tekst === 'Nega rasada u leji.', '"Nega…" ostaje u uradi, ali ide na proveru');
}

console.log(fail ? `\n${fail} FAIL` : '\nsve OK');
process.exit(fail ? 1 : 0);
