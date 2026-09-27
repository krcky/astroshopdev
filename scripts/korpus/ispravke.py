"""
Lektura korpusa — ispravke koje se primenjuju POSLE citanja .docx fajlova.

Astrologovi .docx fajlovi se ne diraju: ispravke stoje u `ispravke.json` pored
njih (NE u repo — to su isecci korpusa) i primenjuju se pri svakom izvozu. Kad
stigne nova posiljka, iste ispravke se primene ponovo; ako je astrolog nesto
vec sam ispravio, original se vise ne nadje i to se prijavi, ne pada.

Dve vrste:
  1. `ispravke.json` — tacno mesto: {kljuc, verzija, original, ispravka}.
     Original je doslovan isecak; menja se prvo pojavljivanje u tom zapisu.
  2. PRAVILA ispod — ono sto vazi za ceo korpus (Ivan, 27.9.2026).
"""
import json
import re
from pathlib import Path

# "vi" se pise malim slovom. Veliko ostaje na pocetku recenice i posle crte
# ("Pozitivan pristup – Vas optimizam"), gde astrolog pocinje novu recenicu.
_VI = re.compile(r'(?<=[a-zčćžšđ,] )(Vi|Vas|Vama|Vam|Vaš\w*)\b')

# "sa Izazovi:ma", "Saveti: koje primite" — ostatak zamene u Wordu: rec iz
# teksta je dobila oblik oznake polja. Samo kad joj prethodi rec, ne na
# pocetku reda gde je prava oznaka.
_OZNAKA = re.compile(r'(?<=[A-Za-zčćžšđČĆŽŠĐ,] )(Izazov\w*|Savet\w*):(\w*)')


def pravila(t: str) -> str:
    t = re.sub(r'(?<=\S) {2,}(?=\S)', ' ', t)   # dupli razmak usred reda
    t = _VI.sub(lambda m: m.group(1).lower(), t)
    return _OZNAKA.sub(lambda m: (m.group(1) + m.group(2)).lower(), t)


def _polja(r: dict):
    """(getter, setter) za svako tekstualno polje zapisa, kratkog ili dugog."""
    for k in ('title', 'subtitle', 'body', 'intro', 'positive', 'challenge', 'advice'):
        if r.get(k):
            yield (lambda k=k: r[k]), (lambda v, k=k: r.__setitem__(k, v))
    for s in r.get('sections', []):
        for k in ('heading', 'body'):
            yield (lambda s=s, k=k: s[k]), (lambda v, s=s, k=k: s.__setitem__(k, v))


def primeni(zapisi: dict, putanja: Path) -> list[dict]:
    """Menja zapise u mestu. Vraca ispravke ciji original nije nadjen."""
    nenadjene = []
    ispravke = json.loads(putanja.read_text(encoding='utf-8')) if putanja.exists() else []
    for x in ispravke:
        r = zapisi.get((x['kljuc'], x['verzija']))
        # Isecak mora da pocne i zavrsi na granici reci: "ozitivni efekti" ->
        # "Pozitivni efekti" bi inace pogodio ispravno "Pozitivni efekti" ranije
        # u tekstu i napravio "PPozitivni".
        obrazac = re.compile(r'(?<!\w)' + re.escape(x['original']) + r'(?!\w)')
        for daj, postavi in (_polja(r) if r else []):
            if obrazac.search(daj()):
                postavi(obrazac.sub(lambda _: x['ispravka'], daj(), count=1))
                break
        else:
            nenadjene.append(x)
    for r in zapisi.values():
        for daj, postavi in _polja(r):
            postavi(pravila(daj()))
    return nenadjene
