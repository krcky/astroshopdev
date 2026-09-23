#!/usr/bin/env python3
"""
Sklapa `assets/fonts/AstroGlyphs.ttf` iz Noto izvora.

Zasto skripta a ne gotov font: nijedan slobodan font ne pokriva sve znakove
koje aplikacija crta, pa se font sklapa iz tri izvora. Dok ovo nije bilo
zapisano, svako dodavanje novog tela znacilo je rucno ponavljanje postupka
po secanju — a znak koji nedostaje se ne vidi kao greska nego kao prazan
pravougaonik na telefonu.

Spisak znakova se NE kuca rucno — cita se iz koda (`glyph: '...'`), da font i
aplikacija ne mogu da se raziđu.

Podrazumevano se postojeci font DOPUNJUJE: dodaju se samo znakovi kojih u njemu
nema, a vec postojeci se ne diraju. To nije lenjost nego nuzda — prvobitni font
je sklopljen iz VARIJABILNOG Noto Sans Symbols-a instanciranog na wght=400, a
danas se sa Noto servera skida staticki Regular, cije se krive razlikuju i do
0,3 em (♋ ima cak i drugaciji broj poteza). Sklapanje iznova bi zato tiho
promenilo izgled 16 vec postojecih simbola u celoj aplikaciji.

`--iznova` sklapa font od nule. Koristiti samo ako se svesno menja izgled svih
simbola — i tada pogledati rezultat, ne samo izlaz skripte.

Pokretanje:
    python3 -m venv .venv && .venv/bin/pip install fonttools brotli
    .venv/bin/python scripts/font/build-astroglyphs.py

Izvori se preuzimaju jednom i kesiraju u `scripts/font/.izvori/`.
"""
import re
import sys
import urllib.request
from pathlib import Path

try:
    from fontTools.merge import Merger
    from fontTools.subset import Subsetter, Options
    from fontTools.pens.recordingPen import RecordingPen
    from fontTools.ttLib import TTFont
except ImportError:
    sys.exit("fontTools nije instaliran. Vidi uputstvo na vrhu fajla.")

KOREN = Path(__file__).resolve().parents[2]
KES = Path(__file__).resolve().parent / ".izvori"
IZLAZ = KOREN / "assets" / "fonts" / "AstroGlyphs.ttf"

# Fajlovi iz kojih se cita spisak znakova.
KOD = ["src/lib/astro.ts", "src/lib/zodiac.ts", "src/lib/points.ts"]

# Izvori po prioritetu — prvi koji ima znak daje ga. Noto Sans Symbols je prvi
# jer nosi vecinu i jer su mu planetarni simboli ujednaceni po debljini.
IZVORI = [
    ("NotoSansSymbols-Regular.ttf",
     "https://github.com/notofonts/notofonts.github.io/raw/main/fonts/NotoSansSymbols/hinted/ttf/NotoSansSymbols-Regular.ttf"),
    ("NotoSansSymbols2-Regular.ttf",
     "https://github.com/notofonts/notofonts.github.io/raw/main/fonts/NotoSansSymbols2/hinted/ttf/NotoSansSymbols2-Regular.ttf"),
    ("NotoSansMath-Regular.ttf",
     "https://github.com/notofonts/notofonts.github.io/raw/main/fonts/NotoSansMath/hinted/ttf/NotoSansMath-Regular.ttf"),
]

# Tabele koje spajanje ne podnosi ili nam ne trebaju. MATH i vertikalne metrike
# postoje samo u nekim izvorima, pa `fonttools merge` pukne na njima; rasporedne
# tabele (GSUB/GPOS) nemaju sta da rade u fontu od 30 samostalnih simbola.
SUVISNO = ["MATH", "vhea", "vmtx", "VORG", "GDEF", "GSUB", "GPOS", "gasp",
           "cvt ", "fpgm", "prep"]


def znakovi_iz_koda() -> set[int]:
    """Kodne tacke svih `glyph: '...'` vrednosti u kodu, bez ASCII oznaka."""
    cps: set[int] = set()
    for rel in KOD:
        put = KOREN / rel
        if not put.exists():
            continue
        for vrednost in re.findall(r"glyph:\s*'([^']+)'", put.read_text(encoding="utf-8")):
            for ch in vrednost:
                # U+FE0E je selektor tekstualne prezentacije, nije znak.
                # ASC i MC su slova — crtaju se sistemskim fontom.
                if ord(ch) > 0x2000 and ord(ch) != 0xFE0E:
                    cps.add(ord(ch))
    return cps


def preuzmi(ime: str, url: str) -> Path:
    KES.mkdir(exist_ok=True)
    put = KES / ime
    if not put.exists():
        print(f"  preuzimam {ime} …")
        urllib.request.urlretrieve(url, put)
    return put


def izdvoj(izvor: Path, cps: set[int], gde: Path) -> None:
    """Svede izvorni font na zadate znakove i skine tabele koje smetaju spajanju."""
    opt = Options()
    opt.layout_features = []
    opt.hinting = False
    opt.notdef_outline = True
    opt.drop_tables += SUVISNO

    font = TTFont(izvor)
    sub = Subsetter(options=opt)
    sub.populate(unicodes=cps)
    sub.subset(font)

    # `drop_tables` ne hvata sve u svim verzijama fontTools-a, pa brisemo i rucno:
    # dovoljna je jedna zaostala MATH tabela da `Merger` pukne.
    for tag in SUVISNO:
        if tag in font:
            del font[tag]
    font.save(gde)


def obris(font: TTFont, ime: str):
    """Zabelezeni potezi jednog znaka — poredjenje pre i posle izmene."""
    pen = RecordingPen()
    font.getGlyphSet()[ime].draw(pen)
    return pen.value


def main() -> int:
    iznova = "--iznova" in sys.argv
    treba = znakovi_iz_koda()
    if not treba:
        print("Nijedan znak nije nadjen u kodu — proveri KOD spisak.")
        return 1

    osnova = None
    if IZLAZ.exists() and not iznova:
        postojeci = TTFont(IZLAZ)
        imamo = {c for c in postojeci.getBestCmap() if c > 0x20}
        nedostaje = treba - imamo
        if not nedostaje:
            print(f"Font vec ima svih {len(treba)} znakova iz koda. Nema posla.")
            return 0
        print(f"Iz koda: {len(treba)} znakova, u fontu {len(imamo)}.")
        print("Dodajem: " + " ".join(f"{chr(c)} (U+{c:04X})" for c in sorted(nedostaje)) + "\n")
        # I osnova mora kroz `izdvoj`: zaostala GSUB/vmtx tabela obara spajanje.
        # Obrisi krivih ovo ne dira — menja se samo sta font nosi uz njih.
        osnova = KES / "deo-osnova.ttf"
        KES.mkdir(exist_ok=True)
        izdvoj(IZLAZ, imamo, osnova)
        trazi = nedostaje
    else:
        print(f"Sklapam iznova, {len(treba)} znakova iz koda.\n")
        trazi = treba

    delovi = [osnova] if osnova else []
    preostalo = set(trazi)
    for ime, url in IZVORI:
        if not preostalo:
            break
        izvor = preuzmi(ime, url)
        ima = preostalo & set(TTFont(izvor).getBestCmap())
        if not ima:
            continue
        deo = KES / f"deo-{ime}"
        izdvoj(izvor, ima, deo)
        delovi.append(deo)
        preostalo -= ima
        print(f"  {ime}: {len(ima)} — " + " ".join(chr(c) for c in sorted(ima)))

    if preostalo:
        print("\nNEMA IZVORA za: " + " ".join(f"U+{c:04X} {chr(c)}" for c in sorted(preostalo)))
        print("Font se NE upisuje — znak koji nedostaje bi se na telefonu video kao ▯.")
        return 1

    staro_stanje = {}
    if IZLAZ.exists():
        f = TTFont(IZLAZ)
        cm = f.getBestCmap()
        staro_stanje = {c: obris(f, cm[c]) for c in cm if c > 0x20}

    spojen = Merger().merge([str(d) for d in delovi]) if len(delovi) > 1 else TTFont(delovi[0])
    # Ime porodice mora biti "AstroGlyphs" — tako ga trazi `components/ui/glyph.tsx`.
    # Posle spajanja u tabeli imena zaostanu zapisi izvornih Noto fontova.
    ime_t = spojen["name"]
    for nid, vrednost in (
        (1, "AstroGlyphs"), (4, "AstroGlyphs"), (6, "AstroGlyphs"),
        (13, "SIL Open Font License 1.1 — vidi assets/fonts/OFL.txt"),
        (14, "https://openfontlicense.org"),
    ):
        ime_t.setName(vrednost, nid, 3, 1, 0x409)
        ime_t.setName(vrednost, nid, 1, 0, 0)
    spojen.save(IZLAZ)

    novo_f = TTFont(IZLAZ)
    ncm = novo_f.getBestCmap()
    print(f"\n{IZLAZ.relative_to(KOREN)}  {IZLAZ.stat().st_size / 1024:.1f} KB, "
          f"{len([c for c in ncm if c > 0x20])} znakova")

    promene = [c for c, o in staro_stanje.items()
               if c in ncm and obris(novo_f, ncm[c]) != o]
    if promene:
        print("PAZNJA — promenjen izgled postojecih znakova: "
              + " ".join(chr(c) for c in sorted(promene)))
        return 0 if iznova else 1
    if staro_stanje:
        print("Postojeci znakovi su nepromenjeni.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
