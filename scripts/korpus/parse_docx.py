"""
Citanje korpusa tranzita iz .docx fajlova astrologa.

Struktura koju dokumenti imaju:

  KRATKA verzija — tacno 3 pasusa po tranzitu:
    1. naslov:  "Jupiter konjunkcija Mars natal – Energija za pobedu"
    2. telo:    opis
    3. saveti:  "Pozitivan efekat: ... Izazov: ... Savet: ..."  (spojeno)

  DUGA verzija — naslov pa promenljiv broj pasusa, sa podnaslovima
  ("Dugorocni efekti", "Specificne sfere zivota", "Opste preporuke"...).

Nepravilnosti koje su vec vidjene i koje parser mora da podnese:
  - podnaslov posle crtice je ponekad izostavljen
  - rec "natal" ponekad fali  (Jupiter kvadrat Uran – Napetost...)
  - Word ume da razbije jednu recenicu na vise <w:t> elemenata
"""
import re
import zipfile
from pathlib import Path

ASPEKTI = {
    'konjunkcija': 'conjunction',
    'sekstil': 'sextile',
    'kvadrat': 'square',
    'trigon': 'trine',
    'opozicija': 'opposition',
}
PLANETE = {
    'sunce': 'sun', 'mesec': 'moon', 'merkur': 'mercury', 'venera': 'venus',
    'mars': 'mars', 'jupiter': 'jupiter', 'saturn': 'saturn',
    'uran': 'uranus', 'neptun': 'neptune', 'pluton': 'pluto',
}

_IME = '|'.join(PLANETE)
NASLOV = re.compile(
    rf'^({_IME})\s+({"|".join(ASPEKTI)})\s+({_IME})'
    r'(?:\s+natal)?'              # "natal" ume da fali
    r'(?:\s*[–—-]\s*(.+))?$',     # podnaslov ume da fali
    re.I,
)

# Oznake polja u kratkoj verziji.
#
# NAMERNO SU LABAVE. Astrolog nije dosledan, i to je normalno za rucno pisan
# tekst: "Pozitivan efekat", "Pozitivni efekat", pa i omaske ("Pozitnan",
# "Pozitatan", "Pozitivn"). Razdvajac je negde dvotacka, negde crtica.
# Parser koji trazi tacan oblik tiho gubi stotine zapisa — prvi pokusaj je
# upravo tako izgubio 260 "Saveta" koji su sve vreme bili tu.
RAZDVOJNIK = r'\s*[:–—-]\s*'
POZITIVNO = re.compile(r'Pozit\w*\s+(?:efek\w*|potencijal\w*)' + RAZDVOJNIK, re.I)
IZAZOV = re.compile(r'Izazov\w*' + RAZDVOJNIK, re.I)
SAVET = re.compile(r'Savet\w*' + RAZDVOJNIK, re.I)


def pasusi(putanja: Path) -> list[dict]:
    """Vraca [{text, bold}] — Word cepa recenice na vise <w:t>, pa se spajaju."""
    with zipfile.ZipFile(putanja) as z:
        xml = z.read('word/document.xml').decode('utf-8')
    out = []
    for p in re.findall(r'<w:p[ >].*?</w:p>|<w:p/>', xml, re.S):
        t = ''.join(re.findall(r'<w:t[^>]*>(.*?)</w:t>', p, re.S))
        t = (t.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
              .replace('&quot;', '"').replace('&apos;', "'")).strip()
        if t:
            out.append({'text': t, 'bold': '<w:b/>' in p or '<w:b ' in p})
    return out


def podeli_na_tranzite(ps: list[dict]) -> list[dict]:
    """Deli listu pasusa na blokove, po jedan za svaki naslov tranzita."""
    blokovi, tekuci = [], None
    for p in ps:
        m = NASLOV.match(p['text'])
        if m:
            if tekuci:
                blokovi.append(tekuci)
            tekuci = {
                'transiting': PLANETE[m.group(1).lower()],
                'aspect': ASPEKTI[m.group(2).lower()],
                'natal': PLANETE[m.group(3).lower()],
                'title': (m.group(4) or '').strip(),
                'paragraphs': [],
            }
        elif tekuci:
            tekuci['paragraphs'].append(p)
    if tekuci:
        blokovi.append(tekuci)
    return blokovi


def kljuc(b: dict) -> str:
    """Isti oblik koji generise transits.ts."""
    return f"transit.{b['transiting']}.{b['aspect']}.natal.{b['natal']}"


def izvuci_polja(tekst: str) -> dict:
    """
    Iz "Pozitivan efekat: ... Izazov: ... Savet: ..." vadi tri polja.

    Trazi POLOZAJE oznaka pa isece izmedju njih, umesto da pokusava da pogodi
    ceo oblik jednim izrazom. Tako redosled i eventualno odsustvo nekog polja
    ne obore citanje ostalih.
    """
    granice = []
    for ime, obrazac in (('positive', POZITIVNO), ('challenge', IZAZOV), ('advice', SAVET)):
        m = obrazac.search(tekst)
        if m:
            granice.append((m.start(), m.end(), ime))
    if not granice:
        return {}

    granice.sort()
    out = {}
    for i, (_, kraj, ime) in enumerate(granice):
        sledeci = granice[i + 1][0] if i + 1 < len(granice) else len(tekst)
        out[ime] = tekst[kraj:sledeci].strip()
    return out


def odseci_polja(tekst: str) -> str:
    """Vraca deo teksta PRE prve oznake polja — to je opis tranzita."""
    pocetci = [m.start() for obrazac in (POZITIVNO, IZAZOV, SAVET)
               for m in [obrazac.search(tekst)] if m]
    return tekst[:min(pocetci)] if pocetci else tekst


def parsiraj_kratku(putanja: Path) -> list[dict]:
    out = []
    for b in podeli_na_tranzite(pasusi(putanja)):
        # Polja su negde spojena u JEDAN pasus (Jupiter, Mars...), a negde
        # razbijena u TRI ODVOJENA (Saturn). Zato se gleda ceo blok odjednom,
        # a ne samo poslednji pasus — prvi pokusaj je tako izgubio 50 zapisa.
        ceo = '\n\n'.join(p['text'] for p in b['paragraphs'])
        polja = izvuci_polja(ceo)
        telo = [odseci_polja(ceo).strip()] if polja else [ceo]
        out.append({
            'key': kljuc(b), 'version': 'short', 'title': b['title'],
            'body': '\n\n'.join(telo), **polja,
        })
    return out


def parsiraj_dugu(putanja: Path) -> list[dict]:
    out = []
    for b in podeli_na_tranzite(pasusi(putanja)):
        sekcije, tekuca, uvod = [], None, []
        for p in b['paragraphs']:
            # Kratak podebljan pasus bez tacke na kraju = podnaslov sekcije.
            je_podnaslov = p['bold'] and len(p['text']) < 60 and not p['text'].rstrip().endswith('.')
            if je_podnaslov:
                if tekuca:
                    sekcije.append(tekuca)
                tekuca = {'heading': p['text'], 'paragraphs': []}
            elif tekuca:
                tekuca['paragraphs'].append(p['text'])
            else:
                uvod.append(p['text'])
        if tekuca:
            sekcije.append(tekuca)
        out.append({
            'key': kljuc(b), 'version': 'long', 'title': b['title'],
            'intro': '\n\n'.join(uvod),
            'sections': [{'heading': s['heading'], 'body': '\n\n'.join(s['paragraphs'])}
                         for s in sekcije],
        })
    return out
