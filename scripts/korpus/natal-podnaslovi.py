#!/usr/bin/env python3
"""
Podnaslovi astrologa za BESPLATNA natalna tumacenja (Sunce, Mesec, Ascendent u znaku) — 36 kratkih
fraza po jeziku ("Kralj Zodijaka", "Brzina kao vrlina"). Ide na ekran sa velikom trojkom (`reveal.tsx`),
JOS PRE naloga, pa moraju u aplikaciju: samo fraza, nikad telo teksta (pravilo 7).

Izvor: srpski `files/natal-texts.csv`; hr, bs i en iz prevoda korpusa na Desktopu
(`~/Desktop/Astroshop App/Prevod korpusa/<jezik>/natal-texts.csv`). Slovenacki i makedonski jos
nisu uvezeni — tamo se prikazuje srpski (isto pravilo kao tekstovi, `lib/jezik-korpusa.ts`).

  python3 scripts/korpus/natal-podnaslovi.py
"""
import csv
import json
import sys
from pathlib import Path

csv.field_size_limit(10**9)
ROOT = Path(__file__).resolve().parents[2]
PREVOD = Path.home() / 'Desktop' / 'Astroshop App' / 'Prevod korpusa'
IZVORI = {
    'sr': ROOT / 'files' / 'natal-texts.csv',
    'hr': PREVOD / 'hr' / 'natal-texts.csv',
    'bs': PREVOD / 'bs' / 'natal-texts.csv',
    'en': PREVOD / 'en' / 'natal-texts.csv',
}
TACKE = ['sun', 'moon', 'ascendant']
ZNACI = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']

# Jedina fraza u korpusu sa "Vi" ("Sa vama nikada nije dosadno") — UI je na "ti" (copywriter-sr), pa se
# ova jedna prilagodjava. Ostalo se ne dira: pitanje glasa korpusa (Vi ili ti) je odluka astrologa i vlasnika.
PRILAGODJENO = {
    ('sr', 'ascendant', 'sagittarius'): 'Sa tobom nikada nije dosadno',
    ('hr', 'ascendant', 'sagittarius'): 'S tobom nikada nije dosadno',
    ('bs', 'ascendant', 'sagittarius'): 'S tobom nikada nije dosadno',
}

out = {}
for jez, put in IZVORI.items():
    if not put.exists():
        sys.exit(f'GRESKA: nema {put}')
    redovi = {r['key']: r for r in csv.DictReader(open(put, encoding='utf-8'))}
    out[jez] = {}
    for t in TACKE:
        out[jez][t] = {}
        for z in ZNACI:
            r = redovi.get(f'natal.{t}.sign.{z}')
            fraza = (r or {}).get('subtitle', '').strip()
            if not fraza:
                sys.exit(f'GRESKA: {jez}: nema podnaslova za natal.{t}.sign.{z}')
            out[jez][t][z] = PRILAGODJENO.get((jez, t, z), fraza)

ts = [
    '/**',
    ' * Podnaslovi astrologa za besplatna natalna tumacenja (Sunce, Mesec, Ascendent u znaku) — GENERISANO,',
    ' * ne menjati rucno: `python3 scripts/korpus/natal-podnaslovi.py`. Samo fraze, bez tela teksta (pravilo 7).',
    ' */',
    "export type TackaPodnaslova = 'sun' | 'moon' | 'ascendant';",
    '',
    'export const NATAL_PODNASLOVI: Record<string, Record<TackaPodnaslova, Record<string, string>>> = ' + json.dumps(out, ensure_ascii=False, indent=2) + ';',
    '',
]
cilj = ROOT / 'src' / 'lib' / 'natal-podnaslovi-podaci.ts'
cilj.write_text('\n'.join(ts), encoding='utf-8')
print(f'OK: {cilj.relative_to(ROOT)} — {sum(len(v) for j in out.values() for v in j.values())} fraza u {len(out)} jezika')
