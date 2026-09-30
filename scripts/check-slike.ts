/**
 * Provera slika (pravilo 24): svaka PNG u assets/ je prosla `npm run slike` (otisak u spisku).
 * Slika sira od 1320 px je samo UPOZORENJE: smanjivanje ne pomaze uvek — slika sa 256 boja
 * (natalna-karta-objasnjenje) posle smanjivanja dobije prelazne boje i fajl poraste. Brza je:
 * ne dekodira slike, samo cita fajl i zaglavlje.
 */
import * as fs from 'node:fs';
import { citajSpisak, kb, kljuc, mere, NAJVECA_SIRINA, otisak, SPISAK, svePng } from './slike-spisak';

const spisak = citajSpisak();
const slike = svePng();
const neoptimizovane: string[] = [];
const siroke: string[] = [];
let ukupno = 0;

for (const p of slike) {
  const buf = fs.readFileSync(p);
  ukupno += buf.length;
  if (spisak[kljuc(p)] !== otisak(buf)) neoptimizovane.push(kljuc(p));
  const { w } = mere(buf);
  if (w > NAJVECA_SIRINA) siroke.push(`${kljuc(p)} (${w} px)`);
}

console.log(`Slike u aplikaciji: ${slike.length} PNG, ukupno ${kb(ukupno)}.`);
let ok = true;
if (neoptimizovane.length) {
  ok = false;
  console.error(`\n✗ ${neoptimizovane.length} slika nije prošlo \`npm run slike\` (nema ih u ${SPISAK} ili su izmenjene):`);
  for (const k of neoptimizovane) console.error(`  ${k}`);
  console.error('  Pokreni `npm run slike` — smanji ih bez gubitka i upiše u spisak.');
}
if (!ok) process.exit(1);
console.log('✓ Sve slike su optimizovane (bez gubitka).');
if (siroke.length) {
  console.log(`\n! Šire od ${NAJVECA_SIRINA} px (440 pt × 3, najširi iPhone) — nova slika se izvozi @3x najveće širine prikaza:`);
  for (const s of siroke) console.log(`  ${s}`);
}
