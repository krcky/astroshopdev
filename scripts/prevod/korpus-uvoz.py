#!/usr/bin/env python3
"""
Uvoz prevoda korpusa u Supabase (6.10.2026) — NOVI redovi sa kolonom `jezik`, srpski se ne dira.

Preduslov: `supabase/prevod-jezik.sql` je pokrenut (kolona `jezik`, kljuc sa jezikom) i
`korpus-provera.py provera <jezik>` prolazi za sve redove. Pise se preko Supabase CLI-ja
(Management API, token u keychainu) — u aplikaciji nema kljuca koji sme da pise (pravilo 9).

  python3 scripts/prevod/korpus-uvoz.py hr          sklopi SQL i posalje ga u delovima
  python3 scripts/prevod/korpus-uvoz.py hr --suvo   samo sklopi SQL, nista ne salje

Upis je `insert … on conflict do update` SAMO za red tog jezika, pa je ponavljanje bezbedno.
`tone` se ne upisuje: ton je osobina tranzita i stoji na srpskom redu.
"""
import csv, json, re, subprocess, sys, tempfile
from pathlib import Path

DESK = Path.home() / 'Desktop' / 'Astroshop App' / 'Prevod korpusa'
REPO = Path.home() / 'Developer' / 'astroshop'
SB = Path.home() / '.npm/_npx/aa8e5c70f9d8d161/node_modules/.bin/supabase'
TABELE = {
    'transit_texts': ('transit-texts.csv', ['key', 'version', 'title', 'body', 'positive', 'challenge', 'advice', 'sections', 'jezik'], '(key, version, jezik)'),
    'natal_texts': ('natal-texts.csv', ['key', 'kind', 'title', 'subtitle', 'body', 'free', 'jezik'], '(key, jezik)'),
    'lunar_texts': ('lunar-texts.csv', ['key', 'phase', 'sign', 'area', 'body', 'jezik'], '(key, jezik)'),
}
OCEKIVANO = {'transit_texts': 1191, 'natal_texts': 508, 'lunar_texts': 420}
DEO = 150  # redova po upitu


def lit(v, kol):
    """SQL literal; prazno polje koje je u srpskom redu NULL ostaje NULL."""
    if kol == 'free':
        return 'true' if v == 'true' else 'false'
    if v == '' and kol in ('positive', 'challenge', 'advice', 'sections', 'subtitle'):
        return 'null'
    return "'" + v.replace("'", "''") + "'"


def upit(sql):
    # `--output-format json`: u terminalu CLI inace crta tabelu, koju ovde ne umemo da procitamo.
    with tempfile.NamedTemporaryFile('w', suffix='.sql', delete=False, encoding='utf-8') as f:
        f.write(sql)
    ref = json.loads((REPO / 'supabase/.temp/linked-project.json').read_text())['ref']
    # stdin zatvoren: CLI se tada ponasa isto u terminalu i van njega (bez tabele i upita korisniku).
    r = subprocess.run([str(SB), 'db', 'query', '--linked', '--project-ref', ref, '--output-format', 'json', '-f', f.name],
                       capture_output=True, text=True, stdin=subprocess.DEVNULL)
    t = r.stdout
    # Dva oblika odgovora: obican niz redova (terminal) ili objekat {"boundary", "rows"} (kad CLI pokrece agent).
    m = re.search(r'[\[{]', t)
    if r.returncode != 0 or not m:
        raise SystemExit(f'upit nije uspeo (izlaz {r.returncode}).\nSTDERR: {r.stderr[-600:]}\nSTDOUT: {t[:600]}')
    try:
        d = json.JSONDecoder().raw_decode(t[m.start():])[0]
        return d['rows'] if isinstance(d, dict) else d
    except Exception as e:  # noqa
        raise SystemExit(f'odgovor nije citljiv ({e}).\nSTDOUT: {t[:800]}')


def main(argv):
    if len(argv) < 2 or argv[1] not in ('hr', 'bs', 'en', 'sl', 'mk'):
        print(__doc__)
        return 2
    j = argv[1]
    suvo = '--suvo' in argv
    for tabela, (fajl, kolone, kljuc) in TABELE.items():
        with open(DESK / j / fajl, encoding='utf-8', newline='') as f:
            redovi = list(csv.DictReader(f))
        if len(redovi) != OCEKIVANO[tabela]:
            raise SystemExit(f'{tabela}: u CSV-u {len(redovi)} redova, ocekivano {OCEKIVANO[tabela]} — prevod nije ceo')
        if any(r['jezik'] != j for r in redovi):
            raise SystemExit(f'{tabela}: red sa drugim jezikom u CSV-u')
        menja = [k for k in kolone if k not in ('key', 'version', 'jezik')]
        upisano = 0
        for s in range(0, len(redovi), DEO):
            vred = ',\n'.join('(' + ', '.join(lit(r[k], k) for k in kolone) + ')' for r in redovi[s:s + DEO])
            sql = (f"insert into public.{tabela} ({', '.join(kolone)}) values\n{vred}\n"
                   f"on conflict {kljuc} do update set " + ', '.join(f'{k} = excluded.{k}' for k in menja) +
                   f"\nwhere public.{tabela}.jezik = '{j}'\nreturning key;")
            if not suvo:
                upisano += len(upit(sql))
        if suvo:
            print(f'{tabela} {j}: {len(redovi)} redova spremno (suvo, nista nije poslato)')
            continue
        n = upit(f"select count(*) n from public.{tabela} where jezik = '{j}';")[0]['n']
        print(f'{tabela} {j}: upisano {upisano}, u bazi {n} / {len(redovi)}')
        if n != len(redovi):
            raise SystemExit('broj se ne slaze')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
