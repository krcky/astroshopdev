"""Spisak tekstova koji fale — za astrologa."""
import collections
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parse_docx import parsiraj_kratku, parsiraj_dugu, PLANETE, ASPEKTI

IZVOR = Path('/Users/ivankrstic/Desktop/Astroshop App/Tranziti AstroShop')
SR_P = {v: k.capitalize() for k, v in PLANETE.items()}
SR_P['ascendant'] = 'Ascendent'
SR_P['midheaven'] = 'MC'
SR_A = {v: k for k, v in ASPEKTI.items()}
PL = list(PLANETE.values())
ASP = ['conjunction', 'sextile', 'square', 'trine', 'opposition']
# Ciklus duzi od ljudskog veka — covek ih ne dozivi.
NEMOGUCE = {('pluto', 'conjunction', 'pluto'), ('neptune', 'conjunction', 'neptune')}


def ucitaj():
    svi = []
    for f in sorted((IZVOR / 'Kraci tranziti').glob('*.docx')):
        svi += parsiraj_kratku(f)
    for f in sorted((IZVOR / 'Duzi trazniti').glob('*.docx')):
        svi += parsiraj_dugu(f)
    return {(r['key'], r['version']) for r in svi}


def fale(imamo, verzija, mete):
    out = []
    for t in PL:
        for a in ASP:
            for n in mete:
                if (t, a, n) in NEMOGUCE:
                    continue
                if (f'transit.{t}.{a}.natal.{n}', verzija) not in imamo:
                    out.append((t, a, n))
    return out


def main():
    imamo = ucitaj()
    L = []
    add = L.append

    k_mesec = len([x for x in fale(imamo, 'short', PL) if x[0] == 'moon'])
    d_mesec = len([x for x in fale(imamo, 'long', PL) if x[0] == 'moon'])
    k_ost = len([x for x in fale(imamo, 'short', PL) if x[0] != 'moon'])
    d_ost = len([x for x in fale(imamo, 'long', PL) if x[0] != 'moon'])

    add('# Sta fali u korpusu tranzita\n')
    add('Astroshop. Spisak je izracunat iz samih .docx fajlova.\n')
    add('## Sazetak\n')
    add('| | kratka | duga |')
    add('|---|---:|---:|')
    add(f'| Mesec (cela planeta) | {k_mesec} | {d_mesec} |')
    add(f'| Pojedinacne rupe | {k_ost} | {d_ost} |')
    add('| Ascendent i MC kao meta | 100 | 100 |')
    add(f'| **UKUPNO** | **{k_mesec + k_ost + 100}** | **{d_mesec + d_ost + 100}** |')
    add('\nOd 600 mogucih po verziji, popunjeno je 433 kratkih i 443 duga.\n')

    add('\n---\n')
    add('## 1. MESEC — najvaznije\n')
    add('Nema nijednog teksta za Mesec kao planetu koja tranzitira.\n')
    add('Mesec obidje zodijak za 28 dana i **jedini menja ton svakog dana**. '
        'Ostale planete daju temu meseca ili godine. Bez Meseca dnevni horoskop '
        'nema ono sto ga cini dnevnim.\n')
    add('Treba **50 tekstova po verziji** — 5 aspekata x 10 natalnih planeta:\n')
    for a in ASP:
        add(f'- **Mesec {SR_A[a]}**: ' + ', '.join(SR_P[n] for n in PL))

    add('\n## 2. Pojedinacne rupe\n')
    for verzija, naziv in [('short', 'Kratka verzija'), ('long', 'Duga verzija')]:
        rupe = [x for x in fale(imamo, verzija, PL) if x[0] != 'moon']
        add(f'\n### {naziv} — {len(rupe)} tekstova\n')
        po_planeti = collections.defaultdict(list)
        for t, a, n in rupe:
            po_planeti[t].append(f'{SR_A[a]} {SR_P[n]}')
        for t in PL:
            if po_planeti[t]:
                add(f'**{SR_P[t]}**')
                for x in po_planeti[t]:
                    add(f'- {SR_P[t]} {x}')
                add('')

    add('\n## 3. Ascendent i MC kao meta\n')
    add('Aplikacija racuna i tranzite na ascendent i MC. To su najlicnije tacke '
        'u karti — zavise od tacnog minuta i mesta rodjenja, pa su za korisnika '
        'najupecatljivije.\n')
    add('Treba **10 tekstova po planeti** (5 aspekata x 2 tacke) = **100 po verziji**:\n')
    for a in ASP:
        add(f'- **{SR_A[a]}** Ascendent i MC — za svih 10 planeta')
    add('\nAko se ovo nece pisati, javi — mogu da iskljucim ASC i MC iz proracuna '
        'da aplikacija ne trazi tekst koji ne postoji.\n')

    add('\n## 4. Ne treba pisati\n')
    add('Ciklus duzi od ljudskog veka:\n')
    add('- Pluton konjunkcija Pluton (248 godina)')
    add('- Neptun konjunkcija Neptun (165 godina) — *u dokumentu vec stoji napomena*\n')

    add('\n## 5. Za proveru\n')
    add('Tri kljuca su u fajlu **Sunce tranziti kratki.docx** upisana dvaput. '
        'Zadrzana je prva verzija:\n')
    add('- Sunce opozicija Uran')
    add('- Sunce opozicija Venera')
    add('- Sunce sekstil Jupiter\n')
    add('Vredi pogledati da li su tekstovi isti ili su se dve razlicite verzije '
        'nasle u istom fajlu.\n')

    return '\n'.join(L)


if __name__ == '__main__':
    print(main())
