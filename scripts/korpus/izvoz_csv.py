"""
CSV za uvoz u `transit_texts` (supabase/transit-texts.sql).

    python3 scripts/korpus/izvoz_csv.py

CSV je CEO korpus, ne dopuna: uvozi se u praznu tabelu (truncate pa import).
Tako iz baze nestanu i tekstovi koje vise ne treba cuvati (NEMOGUCE), i
zapisi koje je stari parser slepio sa sledecim tranzitom.

Fajl ide pored .docx fajlova, NE u repo — korpus je jedina stvar koju
konkurencija ne moze da kopira.
"""
import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parse_docx import docx_fajlovi, parsiraj_kratku, parsiraj_dugu, NAPOMENE
from ispravke import primeni
import liste

IZVOR = Path('/Users/ivankrstic/Desktop/Astroshop App/Tranziti AstroShop')
# Za NAPOMENE (u novom .docx stoji poruka nama umesto teksta) vazi stari tekst.
STARA_DUGA = IZVOR / 'Duzi trazniti - stara verzija 2025'
CILJ = IZVOR / 'transit-texts.csv'
# Lektura — isecci korpusa, pa stoje pored .docx fajlova, ne u repou.
ISPRAVKE = IZVOR / 'ispravke.json'
# Kratke verzije koje fale, sazete iz astrologovih dugih (27.9.2026). Ivan je
# odlucio da idu u bazu pre astrologove potvrde. Astrologov tekst UVEK ima
# prednost: nacrt ulazi samo za kljuc za koji kratka verzija ne postoji, pa
# kad astrolog vrati ispravljen dokument u `Kraci tranziti/`, nacrt sam otpada.
NACRTI = IZVOR / 'nacrti-kratkih.json'
KOLONE = ['key', 'version', 'title', 'body', 'positive', 'challenge', 'advice', 'sections']


def red(r: dict) -> dict:
    if r['version'] == 'short':
        return {k: r.get(k, '') for k in KOLONE[:-1]} | {'sections': ''}
    return {
        'key': r['key'], 'version': 'long', 'title': r['title'],
        # Duga verzija: uvod ide u `body`, isto polje koje transit.tsx prikazuje.
        'body': r['intro'], 'positive': '', 'challenge': '', 'advice': '',
        'sections': json.dumps(r['sections'], ensure_ascii=False),
    }


def main():
    zapisi = {}
    for folder, fn in (('Kraci tranziti', parsiraj_kratku), ('Duzi trazniti', parsiraj_dugu)):
        for f in docx_fajlovi(IZVOR / folder):
            for r in fn(f):
                # Prvi upis pobedjuje — isto pravilo kao u izvestaj.py.
                zapisi.setdefault((r['key'], r['version']), r)

    # parsiraj_dugu preskace NAPOMENE, pa ih ovde citamo mimo nje.
    import parse_docx
    sacuvane = parse_docx.NAPOMENE
    parse_docx.NAPOMENE = set()
    try:
        for f in docx_fajlovi(STARA_DUGA):
            for r in parsiraj_dugu(f):
                k = (r['key'], r['version'])
                if k in sacuvane and k not in zapisi:
                    zapisi[k] = r
    finally:
        parse_docx.NAPOMENE = sacuvane
    fale = sacuvane - set(zapisi)
    if fale:
        sys.exit(f'Nema starog teksta za: {sorted(fale)}')

    nacrta = 0
    if NACRTI.exists():
        for x in json.loads(NACRTI.read_text(encoding='utf-8')):
            if (x['key'], 'short') not in zapisi:
                zapisi[(x['key'], 'short')] = {**x, 'version': 'short'}
                nacrta += 1

    nenadjene = primeni(zapisi, ISPRAVKE)
    # Posle lekture: ispravke gadjaju isecke u obliku u kom ih je astrolog napisao.
    liste.primeni(zapisi)
    for x in nenadjene:
        print(f"  ispravka nije primenjena (nema originala — mozda vec ispravljeno): "
              f"{x['kljuc']} | {x['verzija']} | {x['original']!r}")

    with open(CILJ, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=KOLONE, quoting=csv.QUOTE_ALL)
        w.writeheader()
        for k in sorted(zapisi):
            w.writerow(red(zapisi[k]))

    kratkih = sum(1 for _, v in zapisi if v == 'short')
    print(f'{CILJ}\n{len(zapisi)} redova: {kratkih} kratkih (od toga {nacrta} nacrta), {len(zapisi) - kratkih} dugih')


if __name__ == '__main__':
    main()
