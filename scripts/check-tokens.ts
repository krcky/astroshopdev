/**
 * Provera da se `global.css` nije razisao sa `theme/tokens.ts`.
 * Pokreni: npx tsx scripts/check-tokens.ts
 *
 * Tokeni su hex, a NativeWind trazi HSL trojke — svaka boja tako postoji na
 * DVA mesta i prepisuje se rukom. Zaokruzivanje je tu podmuklo: `0 0% 8%` daje
 * #141414, ne #151515, sto je jedan nivo promasaja koji se okom ne vidi ali
 * cini da "izmereno" vise nije izmereno. Tako je i otkriveno — citanjem
 * `backgroundColor` sa iscrtanog dugmeta, ne gledanjem.
 *
 * Provera ide u OBA smera: svaka boja iz tokena mora imati varijablu i svaka
 * varijabla mora da se vrati na tacno taj hex.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { neutral, accent } from '../src/theme/tokens';

const css = readFileSync(join(__dirname, '../src/global.css'), 'utf8');
/** Samo svetla tema — `.dark:root` je nasa, nije izmerena. */
const svetla = css.slice(css.indexOf(':root {'), css.indexOf('.dark:root'));

let fail = 0;
const ok = (c: boolean, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(30)} ${detail}`);
};

/** `210 12% 97%` -> `#F6F7F8`. Ista formula koju koristi i browser. */
function hslToHex(spec: string): string | null {
  const m = spec.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return null;
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const kanal = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const rgb = s === 0 ? [l, l, l] : [kanal(h + 1 / 3), kanal(h), kanal(h - 1 / 3)];
  return '#' + rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, '0').toUpperCase()).join('');
}

/** Token -> varijabla. Jedan token sme da hrani vise varijabli. */
const MAPA: Record<string, string[]> = {
  [neutral.white]: ['--background', '--card', '--popover', '--primary-foreground', '--destructive-foreground'],
  [neutral.ink]: ['--foreground', '--card-foreground', '--popover-foreground', '--primary',
                  '--secondary-foreground', '--accent-foreground', '--ring'],
  [neutral.grouped]: ['--grouped'],
  [neutral.fill]: ['--fill', '--secondary', '--muted', '--input'],
  [neutral.fillStrong]: ['--fill-strong', '--accent'],
  [neutral.separator]: ['--border'],
  [neutral.inkMuted]: ['--muted-foreground'],
  [neutral.inkSubtle]: ['--subtle'],
  [accent.blue]: ['--tint-blue'],
  [accent.blueIcon]: ['--tint-blue-icon'],
  [accent.purple]: ['--tint-purple'],
  [accent.red]: ['--tint-red', '--destructive'],
  [accent.green]: ['--tint-green'],
  [accent.pink]: ['--tint-pink'],
  [accent.yellow]: ['--tint-yellow'],
  [accent.gray]: ['--tint-gray'],
  [accent.black]: ['--tint-black'],
};

console.log('\n=== global.css prema tokens.ts ===');
const provereno = new Set<string>();
for (const [hex, imena] of Object.entries(MAPA)) {
  for (const ime of imena) {
    provereno.add(ime);
    const m = svetla.match(new RegExp(`${ime}:\\s*([^;]+);`));
    if (!m) { ok(false, ime, 'nema je u global.css'); continue; }
    const dobijeno = hslToHex(m[1]);
    ok(dobijeno === hex, ime, `${m[1].trim()} -> ${dobijeno ?? '?'}   ocekivano ${hex}`);
  }
}

console.log('\n=== Nijedna varijabla nije ostala nepokrivena ===');
const sve = [...svetla.matchAll(/(--[a-z-]+):\s*([\d.]+\s+[\d.]+%\s+[\d.]+%)\s*;/g)].map((m) => m[1]);
// `--gold` je namerno izvan sistema (pravilo 2) — nema ga na snimcima.
const visak = sve.filter((v) => !provereno.has(v) && v !== '--gold');
ok(visak.length === 0, 'svaka HSL varijabla ima token', visak.join(', ') || `${sve.length} varijabli`);

console.log(fail ? `\n${fail} PROVERA PALO\n` : '\nSve provere prosle.\n');
process.exit(fail ? 1 : 0);
