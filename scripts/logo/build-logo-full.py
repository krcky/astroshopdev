"""
Sklapa PUN logo kao vektorski Lottie: assets/lottie/logo-full.json.

Raspored kao u brend fajlu `logo/astroshop-mobile-logo-v2.json` i PNG-u
`graphics/astro-shop-mobile-logo@3x.png`: ASTRO levo, animirani krug u sredini,
SHOP desno. Odnosi izmereni sa PNG-a (prema precniku kruga): visina slova 0,216,
razmak do kruga ~0,20, tekst vertikalno na centru kruga.

Krug je PRECOMP iz `logo-krug.json` (pokreni prvo build-krug.py), slova su
putanje iz `logo/woodmark.svg` (138x12, "ASTROSHOP"), podeljene po x na dve
reci. Boja slova #424242 kao u brend fajlu.

Pokreni: python3 scripts/logo/build-logo-full.py
"""
import re, json, math, os
HERE = os.path.dirname(os.path.abspath(__file__))
KRUG = os.path.join(HERE, "..", "..", "assets", "lottie", "logo-krug.json")
DST = os.path.join(HERE, "..", "..", "assets", "lottie", "logo-full.json")
SVG = "/Users/ivankrstic/Desktop/Astroshop App/logo/woodmark.svg"  # brend fajl, van repoa

krug = json.load(open(KRUG))
D = krug["w"]                       # precnik kruga = cela kompozicija kruga (400)
CAP = 0.216 * D                     # visina slova
GAP = 0.20 * D                      # razmak slova do kruga
SC = CAP / 12                       # woodmark viewBox je visok 12
R = lambda v: round(v, 2)

svg = open(SVG, encoding="utf-8").read()
def parse(d):
    toks = re.findall(r'[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?', d); subs = []; cur = None; i = 0; x = y = 0.0
    def add(nx, ny, it=(0, 0)): cur["v"].append([nx, ny]); cur["i"].append(list(it)); cur["o"].append([0, 0])
    while i < len(toks):
        t = toks[i]; i += 1
        if t == "M": x, y = float(toks[i]), float(toks[i+1]); i += 2; cur = {"v": [[x, y]], "i": [[0, 0]], "o": [[0, 0]]}; subs.append(cur)
        elif t == "L": x, y = float(toks[i]), float(toks[i+1]); i += 2; add(x, y)
        elif t == "H": x = float(toks[i]); i += 1; add(x, y)
        elif t == "V": y = float(toks[i]); i += 1; add(x, y)
        elif t == "C":
            x1, y1, x2, y2, x3, y3 = map(float, toks[i:i+6]); i += 6
            cur["o"][-1] = [x1 - x, y1 - y]; add(x3, y3, (x2 - x3, y2 - y3)); x, y = x3, y3
        elif t == "Z":
            if len(cur["v"]) > 1 and math.hypot(cur["v"][-1][0]-cur["v"][0][0], cur["v"][-1][1]-cur["v"][0][1]) < 1e-3:
                cur["i"][0] = cur["i"][-1]; cur["v"].pop(); cur["i"].pop(); cur["o"].pop()
    return subs
subs = [s for d in re.findall(r' d="([^"]*)"', svg) for s in parse(d)]
cx = lambda s: sum(x for x, _ in s["v"]) / len(s["v"])
astro = [s for s in subs if cx(s) < 76]          # ASTRO zauzima x 0-73,4; SHOP pocinje oko 80
shop = [s for s in subs if cx(s) >= 76]
minx = lambda ss: min(x for s in ss for x, _ in s["v"]); maxx = lambda ss: max(x for s in ss for x, _ in s["v"])
w_astro = (maxx(astro) - minx(astro)) * SC; w_shop = (maxx(shop) - minx(shop)) * SC
W = w_astro + GAP + D + GAP + w_shop; H = D; CY = D / 2
x_astro = -minx(astro) * SC
x_krug = w_astro + GAP
x_shop = x_krug + D + GAP - minx(shop) * SC
y_text = CY - CAP / 2

def st(k): return {"a": 0, "k": k}
GREY = [0x42/255, 0x42/255, 0x42/255, 1]
def shape(sub, dx, dy):
    tr = lambda pts: [[R(a*SC + dx), R(b*SC + dy)] for a, b in pts]
    return {"ty": "sh", "ks": st({"i": [[R(a*SC), R(b*SC)] for a, b in sub["i"]], "o": [[R(a*SC), R(b*SC)] for a, b in sub["o"]], "v": tr(sub["v"]), "c": True})}
def text_layer(ind, nm, ss, dx):
    return {"ddd": 0, "ind": ind, "ty": 4, "nm": nm, "sr": 1, "ao": 0, "ip": 0, "op": krug["op"], "st": 0, "bm": 0,
            "ks": {"o": st(100), "r": st(0), "p": st([0, 0, 0]), "a": st([0, 0, 0]), "s": st([100, 100, 100])},
            "shapes": [{"ty": "gr", "nm": nm, "it": [*[shape(s, dx, y_text) for s in ss],
                        {"ty": "fl", "nm": "ispuna", "c": st(GREY), "o": st(100), "r": 2},
                        {"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]), "r": st(0), "o": st(100), "sk": st(0), "sa": st(0)}]}]}
precomp = {"ddd": 0, "ind": 2, "ty": 0, "nm": "krug", "refId": "krug", "sr": 1, "ao": 0, "ip": 0, "op": krug["op"], "st": 0, "bm": 0,
           "w": krug["w"], "h": krug["h"],
           "ks": {"o": st(100), "r": st(0), "p": st([R(x_krug + D/2), R(CY), 0]), "a": st([D/2, D/2, 0]), "s": st([100, 100, 100])}}
full = {"v": "5.7.4", "fr": krug["fr"], "ip": 0, "op": krug["op"], "w": int(round(W)), "h": int(H), "nm": "astroshop-logo", "ddd": 0,
        "assets": [{"id": "krug", "layers": krug["layers"]}],
        "layers": [text_layer(1, "ASTRO", astro, x_astro), precomp, text_layer(3, "SHOP", shop, x_shop)]}
json.dump(full, open(DST, "w"), separators=(",", ":"))
print(f"logo-full: {full['w']}x{full['h']} (odnos {full['w']/full['h']:.3f}), ASTRO {w_astro:.0f}, SHOP {w_shop:.0f}, {os.path.getsize(DST)} B")
