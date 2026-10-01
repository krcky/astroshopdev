/**
 * Izvoz recnika za proveru DRUGIM modelom (Ivan, 2.10.2026): svaka stavka srpskog recnika uz prevod
 * na hr, bs, sl, mk i en, sa kontekstom (komentar iz `src/i18n/sr/*.ts` — koji ekran, sta je).
 * Funkcije (recenice sa promenljivom) se ispisuju kao sablon: `${ime}` je mesto za vrednost.
 *
 *   npx tsx scripts/prevod/izvoz.ts > prevod.json      pa  python3 scripts/prevod/excel.py prevod.json Prevod.xlsx
 *
 * Povratak ispravki: `scripts/prevod/uvoz.py` (kolona "ispravka").
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';

import { sr } from '../../src/i18n/sr';
import { hr } from '../../src/i18n/hr';
import { bs } from '../../src/i18n/bs';
import { sl } from '../../src/i18n/sl';
import { mk } from '../../src/i18n/mk';
import { en } from '../../src/i18n/en';

const JEZICI = { hr, bs, sl, mk, en } as const;
const SR_DIR = path.join(__dirname, '..', '..', 'src', 'i18n', 'sr');

/** Komentari iz srpskih fajlova po putanji kljuca ("profil.premium.naslov" -> "PAYWALL …"). */
function komentari(): Map<string, string> {
  const out = new Map<string, string>();
  for (const f of fs.readdirSync(SR_DIR).filter((x) => x.endsWith('.ts') && x !== 'index.ts')) {
    const izvor = fs.readFileSync(path.join(SR_DIR, f), 'utf8');
    const sf = ts.createSourceFile(f, izvor, ts.ScriptTarget.Latest, true);
    const obidji = (n: ts.Node, put: string[]) => {
      if (ts.isPropertyAssignment(n) || ts.isShorthandPropertyAssignment(n)) {
        const ime = n.name.getText(sf).replace(/['"]/g, '');
        const novi = [...put, ime];
        const kom = ts.getLeadingCommentRanges(izvor, n.getFullStart()) ?? [];
        const tekst = kom.map((r) => izvor.slice(r.pos, r.end).replace(/^\/\*\*?|\*\/$|^\s*\*\s?|^\/\/\s?/gm, '').trim()).join(' ').replace(/\s+/g, ' ');
        if (tekst) out.set(novi.join('.'), tekst);
        if (ts.isPropertyAssignment(n)) ts.forEachChild(n.initializer, (c) => obidji(c, novi));
        return;
      }
      if (ts.isVariableDeclaration(n) && n.initializer) {
        const ime = n.name.getText(sf);
        ts.forEachChild(n.initializer, (c) => obidji(c, [ime]));
        return;
      }
      ts.forEachChild(n, (c) => obidji(c, put));
    };
    obidji(sf, []);
  }
  return out;
}

/** Vrednost za tabelu: tekst, niz (spojen sa " | ") ili sablon funkcije. */
function prikaz(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(prikaz).join(' | ');
  if (typeof v === 'function') {
    const src = v.toString();
    // sablon(i) iz tela funkcije; bez njih ceo izvor (retko — npr. grananje)
    const sabloni = src.match(/`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'/g)?.filter((s) => /[A-Za-zčćšžđА-я]{2}/.test(s));
    return sabloni?.length ? `ƒ ${sabloni.join('  …  ')}` : `ƒ ${src.replace(/\s+/g, ' ').slice(0, 400)}`;
  }
  return '';
}

/** "Vazno" = ono sto svaki korisnik vidi prvo ili sto ima posledice (pretplata, pristanak, greske). */
const VAZNO = [/^onboarding\./, /^profil\.premium\./, /^profil\.novaOsoba\.pristan/, /\.greske\./, /^pitaj\.uvod\./, /^opste\./, /^danas\.tabovi\./, /nemaVeze|mreza|greska/i];

type Red = { kljuc: string; kontekst: string; sr: string; vazno: boolean } & Record<keyof typeof JEZICI, string>;
const redovi: Red[] = [];
const kom = komentari();

function kontekstZa(kljuc: string): string {
  // komentar same stavke, pa najblizeg roditelja koji ga ima
  const delovi = kljuc.split('.');
  const nadjeni: string[] = [];
  for (let i = delovi.length; i >= 1; i--) {
    const k = kom.get(delovi.slice(0, i).join('.'));
    if (k && !nadjeni.includes(k)) nadjeni.push(k);
    if (nadjeni.length === 2) break;
  }
  return nadjeni.reverse().join('  ›  ');
}

function obidji(o: Record<string, unknown>, put: string[]) {
  for (const [k, v] of Object.entries(o)) {
    const novi = [...put, k];
    const kljuc = novi.join('.');
    if (v && typeof v === 'object' && !Array.isArray(v)) { obidji(v as Record<string, unknown>, novi); continue; }
    // gramatika/datum su kod, ne tekst za prevodioca
    if (/^gramatika|^datum\.oblik$|\.rod$/.test(kljuc)) continue;
    const vrednost = (rec: unknown) => prikaz(novi.reduce<unknown>((a, d) => (a as Record<string, unknown>)?.[d], rec));
    redovi.push({
      kljuc, kontekst: kontekstZa(kljuc), sr: prikaz(v), vazno: VAZNO.some((r) => r.test(kljuc)),
      hr: vrednost(hr), bs: vrednost(bs), sl: vrednost(sl), mk: vrednost(mk), en: vrednost(en),
    });
  }
}
obidji(sr as unknown as Record<string, unknown>, []);
process.stdout.write(JSON.stringify(redovi, null, 1));
