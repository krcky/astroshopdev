/**
 * Zajednicko za `slike.ts` (optimizuje) i `check-slike.ts` (proverava): koje slike aplikacija ima,
 * otisak svake i spisak optimizovanih. Pravilo 24 u CLAUDE.md.
 */
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const KOREN = 'assets';
/** Otisak svake slike koja je prosla `npm run slike`, putanja je relativna na `assets/`. */
export const SPISAK = 'scripts/slike-optimizovane.json';
/**
 * Najsira slika koja ima smisla: 440 pt (najsiri iPhone) x 3. Sira se na telefonu nikad ne vidi
 * u punoj velicini. Izvor u punoj velicini ostaje u `files/`. Samo upozorenje, ne greska (check-slike.ts).
 */
export const NAJVECA_SIRINA = 1320;

export function svePng(): string[] {
  const out: string[] = [];
  (function hodaj(d: string) {
    for (const f of fs.readdirSync(d).sort()) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) hodaj(p);
      else if (/\.png$/i.test(f)) out.push(p);
    }
  })(KOREN);
  return out;
}

export const kljuc = (p: string) => path.relative(KOREN, p).split(path.sep).join('/');

export const otisak = (buf: Buffer) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);

export function citajSpisak(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(SPISAK, 'utf8'));
  } catch {
    return {};
  }
}

export function upisiSpisak(s: Record<string, string>) {
  const sortiran = Object.fromEntries(Object.keys(s).sort().map((k) => [k, s[k]]));
  fs.writeFileSync(SPISAK, JSON.stringify(sortiran, null, 1) + '\n');
}

/** Sirina i visina iz IHDR zaglavlja, bez dekodiranja slike. */
export function mere(buf: Buffer): { w: number; h: number } {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

export const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
