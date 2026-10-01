"""
Manrope za makedonski (cirilica) — pet statickih rezova iz varijabilnog fonta.

Google Fonts daje Manrope samo kao varijabilni `Manrope[wght].ttf` (200—800). React Native
ucitava staticke rezove, pa se instanciraju debljine 400, 500, 600, 700, 800 — iste kao
Plus Jakarta Sans (`src/theme/font.ts`). Oblici se ne menjaju; menjaju se samo imena
(PostScript `Manrope-<Rez>`, po njima ih trazi `FONT_MANROPE`).

    python3 -m venv .venv && .venv/bin/pip install fonttools
    curl -L -o /tmp/Manrope-VF.ttf "https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf"
    .venv/bin/python scripts/font/build-manrope.py /tmp/Manrope-VF.ttf

Rezultat ide u `assets/fonts/manrope/` (uz `OFL.txt` iz istog foldera na GitHub-u).
"""
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

IZVOR = Path(sys.argv[1])
CILJ = Path(__file__).resolve().parents[2] / "assets" / "fonts" / "manrope"
REZOVI = [("Regular", 400), ("Medium", 500), ("SemiBold", 600), ("Bold", 700), ("ExtraBold", 800)]
MAKEDONSKA = "ЃЌЅЈЉЊЏѓќѕјљњџ"

cmap = TTFont(IZVOR).getBestCmap()
fali = [c for c in MAKEDONSKA if ord(c) not in cmap]
assert not fali, f"izvor nema makedonska slova: {fali}"

CILJ.mkdir(parents=True, exist_ok=True)
for ime, tezina in REZOVI:
    f = instantiateVariableFont(TTFont(IZVOR), {"wght": tezina}, updateFontNames=False)
    n = f["name"]
    for id_ in (1, 2, 3, 4, 6, 16, 17, 25):
        n.removeNames(nameID=id_)
    osnovni = ime in ("Regular", "Bold")
    n.setName("Manrope" if osnovni else f"Manrope {ime}", 1, 3, 1, 0x409)
    n.setName(ime if osnovni else "Regular", 2, 3, 1, 0x409)
    n.setName(f"Manrope-{ime};instanca iz Manrope[wght]", 3, 3, 1, 0x409)
    n.setName(f"Manrope {ime}", 4, 3, 1, 0x409)
    n.setName(f"Manrope-{ime}", 6, 3, 1, 0x409)
    n.setName("Manrope", 16, 3, 1, 0x409)
    n.setName(ime, 17, 3, 1, 0x409)
    f["OS/2"].usWeightClass = tezina
    f.save(CILJ / f"Manrope-{ime}.ttf")
    print(f"Manrope-{ime}.ttf  ({tezina})")
