/**
 * Kljucevi natalnih tumacenja. Pokreni: npm run check:natal-tekst
 *
 * Najvaznija provera: SVAKI kljuc koji aplikacija trazi za stvarne karte mora
 * da postoji u korpusu (`files/natal-texts.csv`, van repoa). Ako se oblik
 * kljuca u `natal-keys.ts` i u `scripts/korpus/natal.py` razidje, aplikacija
 * ne padne — samo tiho prestane da nalazi tekstove. Bez CSV-a se ovaj deo
 * preskace (fajl nije u repou), ostale provere rade.
 */
import * as fs from 'fs';
import * as path from 'path';

import { buildNatalChart } from '../src/lib/natal';
import {
  allNatalKeys, isFreeNatalKey, moonSignForUnknownTime, natalAspects, natalTopic, tacnostAspekta, udeoUZnaku,
} from '../src/lib/natal-keys';
import { BEOGRAD, kartaSaAscendentom } from '../src/lib/test-karta';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(62)} ${detail}`);
};

console.log('\n=== Besplatno ===');
ok(isFreeNatalKey('natal.sun.sign.aries') && isFreeNatalKey('natal.moon.sign.pisces') && isFreeNatalKey('natal.ascendant.sign.leo'), 'Sunce, Mesec i podznak u znaku');
ok(!isFreeNatalKey('natal.sun.house.1') && !isFreeNatalKey('natal.venus.sign.aries') && !isFreeNatalKey('natal.moon.square.sun'), 'kuce, ostale planete i aspekti su placeni');

console.log('\n=== Karta sa vremenom (ASC u Ribama) ===');
const ribe = kartaSaAscendentom('pisces');
{
  const k = allNatalKeys(ribe, false, ribe.birth.date);
  ok(k.filter((x) => /\.sign\./.test(x)).length === 11, '10 planeta + podznak u znaku', String(k.filter((x) => /\.sign\./.test(x)).length));
  ok(k.filter((x) => /\.house\./.test(x)).length === 10, '10 planeta u kuci');
  ok(k.includes('natal.ascendant.sign.pisces'), 'podznak = Ribe');
  ok(!k.some((x) => x.includes('midheaven')), 'nijedan kljuc na MC');
  const asc = natalAspects(ribe, false).filter((a) => a.b.key === 'ascendant');
  ok(asc.every((a) => /^natal\.\w+\.\w+\.ascendant$/.test(a.key)), 'aspekt na ASC: Ascendent je drugi', `${asc.length} aspekata`);
  ok(natalTopic(ribe, false, ribe.birth.date, 'natal.x.nepostoji.y') === null, 'tema koje nema u karti -> null');
}

console.log('\n=== Bez vremena rodjenja ===');
{
  const k = allNatalKeys(ribe, true, ribe.birth.date);
  ok(!k.some((x) => x.includes('.house.') || x.includes('ascendant')), 'nema kuca, podznaka ni aspekata na ASC');
  ok(!k.some((x) => /^natal\.moon\.(?!sign)/.test(x) || /\.moon$/.test(x)), 'Mesecevi aspekti se ne tumace');
  ok(natalTopic(ribe, true, ribe.birth.date, 'ascendant') === null, 'tema "ascendant" -> null');
  // Dan kad Mesec menja znak: trazi se, ne upisuje.
  let nadjen = false;
  for (let d = 0; d < 5 && !nadjen; d++) {
    const podne = new Date(Date.UTC(1990, 6, 10 + d, 10));
    const m = moonSignForUnknownTime(podne);
    if (!m.certain) {
      nadjen = true;
      const t = natalTopic(buildNatalChart({ date: podne, ...BEOGRAD }), true, podne, 'moon');
      ok(t?.kind === 'planet' && t.signKey === null, `${podne.toISOString().slice(0, 10)}: Mesec menja znak -> bez teksta znaka`, m.certain ? '' : `${m.from.name} -> ${m.to.name}`);
    }
  }
  ok(nadjen, 'nadjen dan kad Mesec menja znak');
}

console.log('\n=== Trake u zaglavlju tumacenja ===');
ok(udeoUZnaku(0) === 0 && udeoUZnaku(15) === 0.5 && udeoUZnaku(29.99) < 1, 'polozaj u znaku: 0 / 15 / 29,99 stepeni');
ok(udeoUZnaku(-1) === 0 && udeoUZnaku(31) === 1, 'polozaj u znaku ostaje u 0—1');
{
  const t = tacnostAspekta('square', 1.5);
  ok(!!t && t.max === 6 && Math.abs(t.udeo - 0.75) < 1e-9, 'kvadrat, orbis 1,5 od 6 -> 0,75', JSON.stringify(t));
  ok(tacnostAspekta('conjunction', 0)?.udeo === 1, 'egzaktan aspekt -> 1');
  ok(tacnostAspekta('nepostoji', 1) === null, 'nepoznat aspekt -> null');
  const svi = natalAspects(ribe, false).map((a) => tacnostAspekta(a.aspect.key, a.orb));
  ok(svi.every((t) => !!t && t.udeo >= 0 && t.udeo <= 1), 'svaki aspekt test karte ima tacnost u 0—1', `${svi.length} aspekata`);
}

console.log('\n=== Kljucevi prema korpusu (files/natal-texts.csv) ===');
const csv = path.join(__dirname, '..', 'files', 'natal-texts.csv');
if (!fs.existsSync(csv)) {
  console.log('      preskoceno: nema files/natal-texts.csv');
} else {
  const korpus = new Set((fs.readFileSync(csv, 'utf8').match(/^"natal\.[^"]+"/gm) ?? []).map((k) => k.slice(1, -1)));
  const fali = new Map<string, number>();
  let karata = 0;
  // 400 rodjenja 1935—2014, razna doba dana: sva tela, aspekti i kuce koje se stvarno javljaju.
  for (let i = 0; i < 400; i++) {
    const t = Date.UTC(1935, 0, 1) + i * 72.3 * 86_400_000 + (i % 24) * 3_600_000 + (i % 7) * 517_000;
    const chart = buildNatalChart({ date: new Date(t), ...BEOGRAD });
    for (const bez of [false, true]) {
      for (const k of allNatalKeys(chart, bez, new Date(t))) if (!korpus.has(k)) fali.set(k, (fali.get(k) ?? 0) + 1);
    }
    karata++;
  }
  ok(korpus.size >= 500, 'korpus ucitan', `${korpus.size} kljuceva`);
  ok(fali.size === 0, `${karata} karata: svaki kljuc postoji u korpusu`, fali.size ? [...fali.keys()].slice(0, 8).join(', ') : '');
}

console.log(fail ? `\n${fail} FAIL` : '\nsve OK');
process.exit(fail ? 1 : 0);
