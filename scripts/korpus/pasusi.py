"""
Podela dugih pasusa korpusa na krace (Ivan, 29.9.2026: "da bude pitkije za citanje").

Astrologovi fajlovi se ne diraju, isto kao lektura (`ispravke.py`): mesta preloma
stoje u JSON-u pored izvora (NE u repo — isecci korpusa) i primenjuju se pri
svakom izvozu, POSLE lekture:

    {"natal.sun.sign.leo": ["Zato ste vi kralj Zodijaka", "Uvek ste okruženi ljudima"], ...}

Svaka stavka je POCETAK RECENICE koja otvara nov pasus. Prelom = razmak ispred
nje postaje prazan red. Nijedna rec se ne menja — `primeni` to i proverava:
tekst sa prelomima, sveden na jedan razmak, mora biti isti kao pre.

Pocetak mora da se nadje TACNO JEDNOM, odmah posle kraja recenice. Ako astrolog
posalje izmenjen tekst pa pocetka vise nema (ili ga ima dvaput), prelom se
preskace i prijavljuje — ne pada, kao ni lektura.
"""
import json
import re
from pathlib import Path

# Kraj recenice (i eventualni zatvoren navodnik/zagrada), pa JEDAN razmak: obican,
# neprelomivi (Word) ili prelom reda unutar pasusa — sva tri postaju prazan red.
_KRAJ = r'(?<=[.!?…"”»)])[ \u00a0\n]'


def _sa_prelomom(tekst: str, pocetak: str) -> tuple[str, str | None]:
    """Tekst sa prelomom ispred `pocetak`, ili (tekst, razlog) kad ne moze."""
    nadjeno = [m.start() for m in re.finditer(_KRAJ + re.escape(pocetak), tekst)]
    if len(nadjeno) != 1:
        vec = re.search(r'\n\n' + re.escape(pocetak), tekst)
        if vec and not nadjeno:
            return tekst, None  # prelom je vec tu (astrolog ga je sam napravio)
        return tekst, 'nije nadjen' if not nadjeno else f'nadjen {len(nadjeno)} puta'
    i = nadjeno[0]
    return tekst[:i] + '\n\n' + tekst[i + 1:], None


def _body(z: dict):
    yield (lambda: z['body']), (lambda v: z.__setitem__('body', v))


def primeni(zapisi: dict, putanja: Path, polja=_body) -> list[str]:
    """
    Ubacuje prelome u zapise, u mestu. `zapisi` je kljuc -> zapis; `polja(zapis)`
    daje (getter, setter) za svako polje u kom se trazi pocetak (podrazumevano
    samo `body`; duga verzija tranzita ima i odeljke). Pocetak mora biti
    jedinstven u CELOM zapisu. Vraca opis svakog preloma koji nije primenjen.
    """
    prelomi = json.loads(putanja.read_text(encoding='utf-8')) if putanja.exists() else {}
    problemi = []
    for kljuc, pocetci in prelomi.items():
        z = zapisi.get(kljuc)
        if z is None:
            problemi.append(f'{kljuc}: nema zapisa')
            continue
        for p in pocetci:
            pogodaka, razlozi = [], []
            for daj, postavi in polja(z):
                novi, razlog = _sa_prelomom(daj(), p)
                if razlog == 'nije nadjen':
                    continue
                (razlozi if razlog else pogodaka).append((daj, postavi, novi, razlog))
            if len(pogodaka) == 1 and not razlozi:
                daj, postavi, novi, _ = pogodaka[0]
                if ' '.join(novi.split()) != ' '.join(daj().split()):
                    raise AssertionError(f'{kljuc}: podela je promenila tekst')
                postavi(novi)
            else:
                razlog = razlozi[0][3] if razlozi else 'nije nadjen' if not pogodaka else 'nadjen u vise polja'
                problemi.append(f'{kljuc}: {razlog} — {p!r}')
    return problemi
