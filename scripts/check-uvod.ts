/**
 * Provere uvodne animacije (`lib/uvod.ts`). Pokreni: npm run check:uvod
 *
 * Dve stvari koje su spregnute sa fajlovima VAN koda i razilaze se tiho:
 *   1. splash u `app.json` — velicina i boja moraju biti iste kao prvi kadar
 *      uvoda, inace krug skoci kad se splash skloni;
 *   2. `logo-krug-uvod.json` — isti krug kao u logu (i kao na splash-u), sa
 *      vrtenjem koje ne staje (`scripts/logo/build-krug-uvod.py`).
 * I prozor koji se otvara.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  krajRupe, KRUG_NESTAJE, LOTTIE_VRTENJE, PRELIV_GASENJE, rupaPoluprecnik, UVOD_KRUG, UVOD_MS, ZALET,
} from '../src/lib/uvod';
import { neutral } from '../src/theme/tokens';

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(62)} ${detail}`);
};
const blizu = (a: number, b: number, eps = 1e-3) => Math.abs(a - b) <= eps;
const root = join(__dirname, '..');

// --- 1. splash u app.json ------------------------------------------------------
console.log('\n1. Sistemski splash = prvi kadar uvoda');
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
const splash = (app.expo.plugins as unknown[]).find((p) => Array.isArray(p) && p[0] === 'expo-splash-screen') as
  [string, { backgroundColor: string; image: string; imageWidth: number }] | undefined;
ok(!!splash, 'expo-splash-screen je u app.json');
if (splash) {
  const c = splash[1];
  ok(c.imageWidth === UVOD_KRUG, 'imageWidth = UVOD_KRUG', `${c.imageWidth} / ${UVOD_KRUG}`);
  ok(c.backgroundColor.toUpperCase() === neutral.grouped.toUpperCase(), 'pozadina splash-a = neutral.grouped', `${c.backgroundColor} / ${neutral.grouped}`);
  ok(c.image === './assets/images/splash-krug.png', 'slika je splash-krug.png (build-splash.swift)', c.image);
  ok(existsSync(join(root, c.image)), 'slika postoji');
}

// --- 2. prozor ------------------------------------------------------------------
console.log('\n2. Prozor ka aplikaciji (bez oboda)');
const r0 = UVOD_KRUG / 2;
for (const [w, h] of [[393, 852], [440, 956], [360, 800], [1024, 1366]]) {
  const kraj = krajRupe(w, h);
  ok(rupaPoluprecnik(1, r0, kraj) >= Math.hypot(w / 2, h / 2), `na kraju pokriva uglove ${w}x${h}`, `${rupaPoluprecnik(1, r0, kraj).toFixed(0)} >= ${Math.hypot(w / 2, h / 2).toFixed(0)}`);
}
const kraj = krajRupe(393, 852);
ok(rupaPoluprecnik(0, r0, kraj) === 0, 'pre otvaranja nema rupe');
let raste = true;
for (let o = 0; o < 1; o += 0.01) if (rupaPoluprecnik(o + 0.01, r0, kraj) < rupaPoluprecnik(o, r0, kraj)) raste = false;
ok(raste, 'rupa samo raste');
// Dok krug loga jos nije nestao, rupa ne sme da izadje iz njega — inace bi se videla ivica rupe pored kruga.
const krugNaKraju = r0 * KRUG_NESTAJE.rast;
const rupaDokKrugBledi = rupaPoluprecnik(KRUG_NESTAJE.udeo * 0.6, r0, kraj);
ok(rupaDokKrugBledi < krugNaKraju, 'dok je krug jos vidljiv, rupa je unutar njega', `${rupaDokKrugBledi.toFixed(0)} < ${krugNaKraju.toFixed(0)}`);
ok(ZALET < 1 && KRUG_NESTAJE.rast > 1 && KRUG_NESTAJE.udeo > 0 && KRUG_NESTAJE.udeo < 1, 'krug se skupi u zaletu, pa malo naraste dok nestaje');
// Preliv uvoda bledi tek kad prozor stigne blizu vrha (sredina ekrana -> 230 pt od vrha).
const doPreliva = 852 / 2 - 230;
ok(rupaPoluprecnik(PRELIV_GASENJE, r0, kraj) <= doPreliva + 40, 'preliv uvoda ne bledi dok je prozor daleko od vrha', `${rupaPoluprecnik(PRELIV_GASENJE, r0, kraj).toFixed(0)} ~ ${doPreliva}`);

// --- 3. vrtenje iz logo-krug-uvod.json ------------------------------------------
console.log('\n3. Krug uvoda: isti kao u logu, vrti se brzo pa uspori');
type Sloj = { nm: string; ks: Record<string, unknown> & { r: { a: number; k: { t: number; s?: number[]; o?: { x: number[]; y: number[] }; i?: { x: number[]; y: number[] } }[] } } };
const logo = JSON.parse(readFileSync(join(root, 'assets/lottie/logo-krug.json'), 'utf8'));
const krug = JSON.parse(readFileSync(join(root, 'assets/lottie/logo-krug-uvod.json'), 'utf8'));
// Sve osim okreta sloja "Uvod" mora biti isto kao u logu — splash se crta iz loga.
const bezOkreta = (d: { layers: Sloj[] }) => JSON.stringify(d.layers.map((l) => (l.nm === 'Uvod' ? { ...l, ks: { ...l.ks, r: null } } : l)));
ok(bezOkreta(krug) === bezOkreta(logo), 'oblici i slojevi isti kao logo-krug.json (samo okret drugaciji)');
ok(krug.w === logo.w && krug.fr === LOTTIE_VRTENJE.fps, 'kompozicija i fps', `${krug.w} ${krug.fr}`);
const kf = (krug.layers as Sloj[]).find((l) => l.nm === 'Uvod')!.ks.r.k;
ok(kf[0].t === 0 && kf[0].s![0] === 0, 'kadar 0 bez okreta (= sistemski splash)');
// Brzina (stepeni/kadar) na pocetku i kraju svakog dela, iz rucki kubne krive.
// Kad je rucka u samoj krajnjoj tacki (prava linija: (0,0) i (1,1)), smer daje
// druga rucka — tako se racuna i izvod kubne krive.
const delovi = kf.slice(0, -1).map((k, j) => {
  const n = kf[j + 1];
  const nagib = (n.s![0] - k.s![0]) / (n.t - k.t);
  const [ox, oy, ix, iy] = [k.o!.x[0], k.o!.y[0], k.i!.x[0], k.i!.y[0]];
  const pocetak = ox !== 0 || oy !== 0 ? oy / ox : iy / ix;
  const kraj = ix !== 1 || iy !== 1 ? (1 - iy) / (1 - ix) : (1 - oy) / (1 - ox);
  return { od: k.t, do: n.t, v0: nagib * pocetak, v1: nagib * kraj };
});
const V = LOTTIE_VRTENJE;
const brzo = 360 / (V.brzoS * V.fps), sporo = 360 / (V.sporoS * V.fps);
const naKadru = (t: number) => delovi.find((d) => d.od <= t && t < d.do)!;
ok(delovi[0].v0 === 0, 'krece iz mirovanja (kao splash)');
ok(delovi.slice(1).every((d, j) => blizu(d.v0, delovi[j].v1, 1e-3)), 'na svakom spoju ista brzina — bez trzaja', delovi.map((d) => `${d.v0.toFixed(1)}->${d.v1.toFixed(1)}`).join(' '));
ok(blizu(naKadru(V.ubrzanje).v0, brzo, 1e-3) && naKadru(V.ubrzanje).do === V.brzoDo, 'brzo: jedan krug na brzoS s, do kadra brzoDo', `${brzo.toFixed(2)} st/kadar`);
ok(blizu(naKadru(V.brzoDo).v1, sporo, 1e-3) && naKadru(V.brzoDo).do === V.brzoDo + V.usporavanje, 'uspori za usporavanje kadrova na jedan krug u sporoS s', `${sporo.toFixed(2)} st/kadar`);
ok(sporo > 0 && sporo < brzo / 3, 'posle usporavanja se i dalje vrti, ali vidno sporije');
ok(blizu(delovi[delovi.length - 1].v0, sporo, 1e-3) && blizu(delovi[delovi.length - 1].v1, sporo, 1e-3), 'do kraja sporo i ravnomerno');
ok(kf[kf.length - 1].t / krug.fr >= 30, 'vrti se dovoljno dugo i kad se dugo ceka', `${(kf[kf.length - 1].t / krug.fr).toFixed(0)} s`);
ok(UVOD_MS.vrtenje >= (V.ubrzanje / V.fps) * 1000 && UVOD_MS.vrtenje <= (V.brzoDo / V.fps) * 1000, 'kad je aplikacija spremna odmah, otvara se dok se krug jos vrti brzo', `${UVOD_MS.vrtenje} ms`);

console.log(fail ? `\n${fail} FAIL` : '\nSve provere prosle.');
process.exit(fail ? 1 : 0);
