"""
Ujednacavanje lista u dugim verzijama (Ivan, 27.9.2026).

Astrolog pise stavke na sedam nacina: "Naslov: tekst", "Naslov – tekst",
"Naslov - tekst", "• Naslov: tekst", "1. Naslov", "• Naslov" pa objasnjenje u
sledecem redu... Sve se svodi na JEDAN oblik, svaka stavka u svom redu:

    • Naslov – tekst          (stavka sa naslovom)
    • Tekst stavke            (stavka bez naslova)

"• " je u samom tekstu: po njemu aplikacija i pregled znaju da je red stavka, a
ne pasus. Podebljanje od bulleta do prve " – " crta aplikacija (transit.tsx) —
u bazi nema oznaka za bold.

Dira SAMO odeljke koji su liste. U uvodu, Sustini i Dugorocnim efektima
astrolog pise pasuse, i tamo "Osluskujte intuiciju – ali ne bezite" nije
naslov stavke nego recenica.
"""
import re

LISTA = re.compile(
    r'^\s*(?:Specifi[cč]n\w*\s+(?:sfer|oblast)\w*|Op[sš]t\w*\s+preporuk\w*'
    r'|Pozitiv\w*\s+(?:efekt\w*|dejstv\w*|aspekt\w*)|Izazov\w*|Savet\w*)', re.I)

_OZNAKA = re.compile(r'^(?:[•·▪◦●*\-–—]|\d+[.)])\s*')
# Naslov stavke: kratak, bez znaka kraja recenice. Posle dvotacke je naslov
# skoro uvek naslov (do 9 reci); posle crte je strozije (do 6), jer crta ume da
# stoji i usred obicne recenice.
_SA_DVOTACKOM = re.compile(r'^([^.!?:]{2,70}?)\s*:\s+(\S.*)$')
_SA_CRTOM = re.compile(r'^([^.!?:–—]{2,60}?)\s+[–—-]\s+(\S.*)$')
_KRAJ = re.compile(r'[.!?:;…]$')

# Dugacak red bez naslova je pasus, ne stavka.
PASUS = 260


def _naslov(red: str):
    """(naslov, tekst) ili (None, red)."""
    m = _SA_DVOTACKOM.match(red)
    if m and len(m.group(1).split()) <= 9:
        return m.group(1).strip(), m.group(2).strip()
    m = _SA_CRTOM.match(red)
    if m:
        naslov, tekst = m.group(1).strip(), m.group(2).strip()
        n = len(naslov.split())
        # Crta usred recenice: "Osluskujte gde vas vodi intuicija – ali ne
        # bezite", "…nisu kazna – to su orijentiri". Pravi naslov je kratak ili
        # ga prati veliko slovo ("Ne brzajte sa odlukama – Ako niste sigurni").
        if ',' not in naslov and n <= 6 and (tekst[0].isupper() or tekst[0] in '„"' or n <= 3):
            return naslov, tekst
    return None, red


def ujednaci(telo: str) -> str:
    redovi = [r.strip() for r in telo.split('\n') if r.strip()]
    blokovi = []            # ('stavka', tekst) | ('pasus', tekst)
    i = 0
    while i < len(redovi):
        red = redovi[i]
        imao_oznaku = bool(_OZNAKA.match(red))
        red = _OZNAKA.sub('', red)
        naslov, tekst = _naslov(red)
        # "• Naslov" bez interpunkcije, a objasnjenje u SLEDECEM redu.
        if (naslov is None and i + 1 < len(redovi) and len(red) <= 70 and not _KRAJ.search(red)
                and not _OZNAKA.match(redovi[i + 1]) and _naslov(redovi[i + 1])[0] is None
                # objasnjenje je duze i zavrsava se kao recenica — inace su to dve
                # kratke stavke bez interpunkcije ("Povecana privlacnost" / "Jacanje veza")
                and len(redovi[i + 1]) > len(red) and _KRAJ.search(redovi[i + 1])):
            naslov, tekst = red.rstrip(' :–—-'), redovi[i + 1]
            i += 1
        if naslov:
            blokovi.append(('stavka', f'• {naslov} – {tekst}'))
        elif imao_oznaku or len(red) < PASUS:
            blokovi.append(('stavka', f'• {red}'))
        else:
            blokovi.append(('pasus', red))
        i += 1
    # Uzastopne stavke u jednom bloku (jedan red svaka), pasusi odvojeni praznim redom.
    out = []
    for vrsta, t in blokovi:
        if vrsta == 'stavka' and out and out[-1][0] == 'stavka':
            out[-1] = ('stavka', out[-1][1] + '\n' + t)
        else:
            out.append((vrsta, t))
    return '\n\n'.join(t for _, t in out)


def primeni(zapisi: dict):
    for r in zapisi.values():
        for s in r.get('sections', []):
            if LISTA.match(s['heading']):
                s['body'] = ujednaci(s['body'])
