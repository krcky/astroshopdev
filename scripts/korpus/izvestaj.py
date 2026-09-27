"""Spisak tekstova koji fale — za astrologa. Svaki broj se racuna iz .docx fajlova."""
import collections
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parse_docx import docx_fajlovi, parsiraj_kratku, parsiraj_dugu, PLANETE, ASPEKTI, NEMOGUCE, NAPOMENE, UGLOVI

IZVOR = Path('/Users/ivankrstic/Desktop/Astroshop App/Tranziti AstroShop')
SR_P = {v: k.capitalize() for k, v in PLANETE.items()}
SR_P['ascendant'] = 'Ascendent'
SR_P['midheaven'] = 'MC'
SR_A = {v: k for k, v in ASPEKTI.items()}
PL = list(PLANETE.values())
UG = list(UGLOVI.values())
ASP = ['conjunction', 'sextile', 'square', 'trine', 'opposition']
VERZIJE = [('short', 'kratka'), ('long', 'duga')]


def ucitaj():
    """Vraca (skup (kljuc, verzija), spisak dupliranih [(fajl, kljuc)])."""
    imamo, dupli = set(), []
    for folder, fn in (('Kraci tranziti', parsiraj_kratku), ('Duzi trazniti', parsiraj_dugu)):
        for f in docx_fajlovi(IZVOR / folder):
            for r in fn(f):
                k = (r['key'], r['version'])
                if k in imamo:
                    dupli.append((f.name, r['key']))
                imamo.add(k)
    return imamo, dupli


def moguci(mete):
    return [(t, a, n) for t in PL for a in ASP for n in mete if (t, a, n) not in NEMOGUCE]


def fale(imamo, verzija, mete):
    return [x for x in moguci(mete) if (f'transit.{x[0]}.{x[1]}.natal.{x[2]}', verzija) not in imamo]


def ime(t, a, n):
    return f'{SR_P[t]} {SR_A[a]} {SR_P[n]}'


def main():
    imamo, dupli = ucitaj()
    L = []
    add = L.append

    grupe = [
        ('Mesec kao tranzitna planeta', lambda x: x[0] == 'moon' and x[2] in PL, PL),
        ('Ostale planete', lambda x: x[0] != 'moon' and x[2] in PL, PL),
        ('Ascendent i MC kao meta', lambda x: True, UG),
    ]

    add('# Sta fali u korpusu tranzita\n')
    add('Astroshop. Spisak je izracunat iz samih .docx fajlova.\n')
    add('## Sazetak — popunjeno / moguce\n')
    add('| | kratka | duga |')
    add('|---|---:|---:|')
    uk = {v: [0, 0] for v, _ in VERZIJE}
    for naziv, uslov, mete in grupe:
        celije = []
        for v, _ in VERZIJE:
            sve = [x for x in moguci(mete) if uslov(x)]
            rupa = [x for x in fale(imamo, v, mete) if uslov(x)]
            uk[v][0] += len(sve) - len(rupa)
            uk[v][1] += len(sve)
            celije.append(f'{len(sve) - len(rupa)} / {len(sve)}')
        add(f'| {naziv} | ' + ' | '.join(celije) + ' |')
    add('| **UKUPNO** | ' + ' | '.join(f'**{uk[v][0]} / {uk[v][1]}**' for v, _ in VERZIJE) + ' |')

    add('\n---\n')
    add('## Sta fali\n')
    for naziv, uslov, mete in grupe:
        for v, vn in VERZIJE:
            rupe = [x for x in fale(imamo, v, mete) if uslov(x)]
            if not rupe:
                continue
            add(f'\n### {naziv}, {vn} verzija — {len(rupe)}\n')
            po_planeti = collections.defaultdict(list)
            for x in rupe:
                po_planeti[x[0]].append(ime(*x))
            for t in PL:
                if po_planeti[t]:
                    add('- ' + ', '.join(po_planeti[t]))

    if NAPOMENE:
        add('\n## U dokumentu stoji napomena umesto teksta\n')
        add('Ovi tranziti SE DESAVAJU (provereno proracunom), pa im treba tekst:\n')
        for k, v in sorted(NAPOMENE):
            _, t, a, _, n = k.split('.')
            add(f'- {ime(t, a, n)} ({dict(VERZIJE)[v]})')

    if dupli:
        add('\n## Upisano dvaput — zadrzana je prva verzija\n')
        for f, k in dupli:
            _, t, a, _, n = k.split('.')
            add(f'- {ime(t, a, n)} — *{f}*')
        add('\nDupli naslov cesto znaci da je na tom mestu trebalo da stoji DRUGI tranzit.\n')

    add('\n## Ne treba pisati\n')
    add('Ciklus duzi od ljudskog veka:\n')
    for t, a, n in sorted(NEMOGUCE):
        add(f'- {ime(t, a, n)}')

    return '\n'.join(L)


if __name__ == '__main__':
    print(main())
