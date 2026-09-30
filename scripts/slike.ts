/**
 * Slike u aplikaciji BEZ gubitka kvaliteta (Ivan, 30.9.2026; pravilo 24 u CLAUDE.md).
 *
 *   npm run slike              optimizuje svaku PNG u assets/ koja je nova ili izmenjena
 *   npm run slike -- --sve     sve ispocetka
 *
 * oxipng (WASM, `@jsquash/oxipng`, nivo 4) prepakuje PNG bez gubitka: isti pikseli, manji fajl
 * (30.9.2026: 94 slike, 7,1 MB -> 5,4 MB). Posle SVAKE slike pikseli se porede sa originalom; ako
 * se ijedan razlikuje, fajl ostaje kakav je bio i skripta javlja gresku. Otisak optimizovane slike
 * ide u `scripts/slike-optimizovane.json`, pa `check:slike` odmah vidi sliku koja je usla bez ovoga
 * (novi izvoz iz Figme, `mesec-faze.ts`, `build-splash.swift`...).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import optimise, { init } from '@jsquash/oxipng/optimise.js';
// @ts-ignore -- pngjs je tranzitivna zavisnost (Expo) i nema tipove
import { PNG } from 'pngjs';
import { citajSpisak, kb, kljuc, mere, NAJVECA_SIRINA, otisak, svePng, upisiSpisak } from './slike-spisak';

const NIVO = 4;

/** Isti pikseli: svaki kanal svakog piksela, posle svodjenja oba fajla na RGBA 8 bita. */
function istiPikseli(a: Buffer, b: Buffer): boolean {
  const x = PNG.sync.read(a), y = PNG.sync.read(b);
  return x.width === y.width && x.height === y.height && Buffer.compare(x.data, y.data) === 0;
}

async function main() {
  await init(fs.readFileSync(path.join('node_modules/@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm')));
  const sve = process.argv.includes('--sve');
  const spisak = citajSpisak();
  const slike = svePng();
  let pre = 0, posle = 0, obradjeno = 0, greske = 0;

  for (const p of slike) {
    const k = kljuc(p);
    const buf = fs.readFileSync(p);
    if (!sve && spisak[k] === otisak(buf)) continue;
    const novo = Buffer.from(await optimise(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length) as ArrayBuffer, { level: NIVO, interlace: false, optimiseAlpha: false }));
    if (!istiPikseli(buf, novo)) {
      console.error(`GRESKA ${k}: posle optimizacije pikseli nisu isti — fajl nije diran.`);
      greske++;
      continue;
    }
    const bolji = novo.length < buf.length ? novo : buf;
    if (bolji === novo) fs.writeFileSync(p, novo);
    spisak[k] = otisak(bolji);
    pre += buf.length; posle += bolji.length; obradjeno++;
    const { w } = mere(bolji);
    console.log(`${k.padEnd(46)} ${kb(buf.length).padStart(7)} -> ${kb(bolji.length).padStart(7)}${w > NAJVECA_SIRINA ? `   PREŠIROKA (${w} px, najviše ${NAJVECA_SIRINA})` : ''}`);
  }
  // Obrisane slike izlaze iz spiska.
  const postoje = new Set(slike.map(kljuc));
  for (const k of Object.keys(spisak)) if (!postoje.has(k)) delete spisak[k];
  upisiSpisak(spisak);

  if (obradjeno === 0) console.log('Sve slike su već optimizovane.');
  else console.log(`\n${obradjeno} slika: ${kb(pre)} -> ${kb(posle)} (${Math.round((1 - posle / pre) * 100)}% manje), pikseli isti.`);
  if (greske) process.exit(1);
}

main();
