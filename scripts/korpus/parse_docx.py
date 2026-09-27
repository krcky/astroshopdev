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
  - "natalni"/"natalna" ISPRED mete  (Mesec kvadrat natalni Mars – ...)
  - padezni oblik:
      "Sunce u konjunkciji sa natalnim Ascendentom - ..."
      "Sunce u sekstilu sa natalnim MC(om)- ..."
      "Merkur u kvadratu sa Neptunom natal - ..."
  - "tranzit" na kraju umesto "natal"; dvotacka ili kosa crta umesto crte
  - omaske u imenu: "Pluto" za Pluton, "Mecec" za Mesec
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

# Mete koje nisu planete — uglovi karte. Kljuc je isti kao u transits.ts.
UGLOVI = {'ascendent': 'ascendant', 'mc': 'midheaven'}

# Omaske koje ne pocinju kao pravo ime, pa ih koren ispod ne bi uhvatio.
OMASKE = {'mecec': 'mesec'}

# Ime planete se prepoznaje po KORENU (prva cetiri slova, razlicita za svih
# deset), jer astrolog pise i padez ("sa Neptunom", "sa Suncem") i omaske
# ("Pluto" za Pluton). Kljuc se trazi istim korenom u telo().
_KOREN = 4
_IME = '(?:' + '|'.join([k[:_KOREN] for k in PLANETE] + list(OMASKE)) + r')\w*'
_META = rf'{_IME}|ascendent\w*|mc(?:\(om\))?'
_ASPEKT = r'konjunkcij[ai]|sekstilu?|kvadratu?|trigonu?|opozicij[ai]'
NASLOV = re.compile(
    rf'^({_IME})\s+(?:u\s+)?({_ASPEKT})\s+'
    r'(?:sa\s+)?(?:natal\w*\s+)?'  # "sa natalnim", "natalni", "natalna" — ili nista
    rf'({_META})(?!\w)'           # ne \b: iza "MC(om)" nema granice reci
    r'(?:\s+(?:natal|tranzit))?'   # "natal" ume da fali, a ume i "tranzit"
    r'(?:\s*[:/–—-]\s*(.+))?$',    # podnaslov ume da fali; crta, dvotacka ili /
    re.I,
)


def telo(ime: str) -> str:
    ime = ime.lower()
    ime = OMASKE.get(ime, ime)
    return next(v for k, v in PLANETE.items() if ime[:_KOREN] == k[:_KOREN])


def meta(ime: str) -> str:
    ime = ime.lower()
    if ime.startswith('ascendent'):
        return UGLOVI['ascendent']
    if ime.startswith('mc'):
        return UGLOVI['mc']
    return telo(ime)


def aspekt(ime: str) -> str:
    """"kvadratu" -> square. Prva cetiri slova su razlicita za svih pet aspekata."""
    return next(v for k, v in ASPEKTI.items() if ime.lower()[:4] == k[:4])


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
        # <w:t(?:\s...)?> a NE <w:t[^>]*> — ovaj drugi hvata i <w:tab w:val="clear"/>,
        # <w:tabs>, <w:tblPr>... jer je 'ab' validan [^>]*. Kad pasus ima tabulator,
        # zahvat krene od <w:tab> i pokupi ceo <w:pPr> blok kao da je tekst, pa
        # sirovi XML zavrsi u bazi i na ekranu korisnika.
        #
        # <w:br/> je prelom reda UNUTAR pasusa (Shift+Enter) — astrolog tako slaze
        # stavke liste. Bez njega se spoje u "spoznaje.Osnazena zastita".
        t = ''.join('\n' if m.group(1) is None else m.group(1) for m in
                    re.finditer(r'<w:t(?:\s[^>]*)?>(.*?)</w:t>|<w:br\b[^>]*/>|<w:cr/>', p, re.S))
        t = (t.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
              .replace('&quot;', '"').replace('&apos;', "'"))
        t = '\n'.join(red.strip() for red in t.split('\n') if red.strip())
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
                'transiting': telo(m.group(1)),
                'aspect': aspekt(m.group(2)),
                'natal': meta(m.group(3)),
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


# Ciklus duzi od ljudskog veka — covek ih ne dozivi, tekst se ne uvozi.
# PROVERENO PRORACUNOM (27.9.2026), ne preuzeto od astrologa: astrolog je
# proglasio nemogucim i Pluton konjunkcija Neptun (a to rodjeni 1999-2011 imaju
# BAS SADA, 2026-2043) i Pluton opozicija Pluton (rodjeni od 1942, sa ~83 god.).
NEMOGUCE = {
    ('pluto', 'conjunction', 'pluto'),       # 248 godina
    ('neptune', 'conjunction', 'neptune'),   # 165 godina
    ('pluto', 'opposition', 'neptune'),      # tek posle 109. godine
}

# Mesta gde u dokumentu stoji NAPOMENA NAMA umesto tumacenja ("tekst slobodno
# izbrisite iz baze"). Uvezena, zavrsila bi na ekranu korisnika. Tranzit se
# desava, pa u bazi ostaje stari tekst dok astrolog ne vrati pravi. Kad stigne,
# kljuc se brise odavde.
NAPOMENE = {
    ('transit.pluto.conjunction.natal.neptune', 'long'),
    ('transit.pluto.opposition.natal.pluto', 'long'),
}


def za_uvoz(r: dict) -> bool:
    _, t, a, _, n = r['key'].split('.')
    return (t, a, n) not in NEMOGUCE and (r['key'], r['version']) not in NAPOMENE


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
    return [r for r in out if za_uvoz(r)]


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
                # "Saveti:" i "Saveti" — isti podnaslov; dvotacka je nedosledna.
                tekuca = {'heading': p['text'].rstrip(':').strip(), 'paragraphs': []}
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
    return [r for r in out if za_uvoz(r)]
