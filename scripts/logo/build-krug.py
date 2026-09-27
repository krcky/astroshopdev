"""
Sklapa VEKTORSKI Lottie kruga iz loga: assets/lottie/logo-krug.json.

Izvor je brend SVG `Astroshop App/logo/krug-vektor.svg` (80x80, 19 putanja, sve
ispuna #403F98): putanje 0 i 1 su kruznice prstena, 2 i 3 Sunce sa zracima i
licem, ostalih 15 su 12 znakova (Rak, Vaga i Vodolija imaju po dva dela).
Unutrasnji dupli krug (putanja 0) je u SVG-u isecen na lukove izmedju zraka;
ovde se crta kao dve pune kruznice, jer treba da bude spojen.

Zasto rucno a ne izvoz iz After Effectsa: originalni Lottie (`logo/astroshop-
mobile-logo-v2.json`) je RASTERSKI — slojevi su PNG slike crtane za logo sirok
1975 px — pa se na 36pt u traci linije raspadaju. Ovaj fajl crta oblike, pa je
ostar na svakoj velicini.

Animacija je prepisana iz originala: uvodni okret (0 -> 360 za 50 kadrova),
zatim spori okret (360 za 1500 kadrova = 60 s), 25 fps, u petlji. Znakovi su
deca sporog okreta i vrte se SUPROTNO (isto sto je u AE bio izraz), pa ostaju
uspravni dok kruze. Lice miruje, zraci se okrecu: Sunce je u dva sloja sa
kruznom maskom na ivici lica (r = 13,5 u SVG jedinicama, gde pocinju zraci),
obicnom na mirnom i obrnutom na pokretnom sloju — isti trik kao u originalu.

ZAMKA: obrnuta maska u plejerima nastaje kao pravougaonik + putanja sa nonzero
pravilom, pa kruznica maske MORA ici suprotno od kazaljke. Sa smerom kazaljke
rupa ne nastane i oba sloja se vide cela (provereno u lottie-web-u).

Pokreni: python3 scripts/logo/build-krug.py
"""
import re, json, math, os, copy
SVG = "/Users/ivankrstic/Desktop/Astroshop App/logo/krug-vektor.svg"  # brend fajl, van repoa
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "lottie", "logo-krug.json")
svg = open(SVG, encoding="utf-8").read()
paths = [re.search(r'd="([^"]*)"', p).group(1) for p in re.findall(r'<path([^>]*)/?>', svg)]
S = 5.0; SIZE = 80 * S; C = SIZE / 2
R_LICE = 13.5 * S   # ivica lica: tu pocinju zraci (sve baze zraka su na r = 13,5)
R = lambda v: round(v, 2)

def parse(d):
    toks = re.findall(r'[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?', d); subs = []; cur = None; i = 0; x = y = 0.0
    def add(nx, ny, it=(0,0)): cur["v"].append([nx, ny]); cur["i"].append(list(it)); cur["o"].append([0, 0])
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
def scaled(sub): return {"i": [[R(a*S), R(b*S)] for a, b in sub["i"]], "o": [[R(a*S), R(b*S)] for a, b in sub["o"]], "v": [[R(a*S), R(b*S)] for a, b in sub["v"]], "c": True}
def st(k): return {"a": 0, "k": k}
FILL = [64/255, 63/255, 152/255, 1]
def group(nm, subs):
    return {"ty": "gr", "nm": nm, "it": [*[{"ty": "sh", "nm": f"p{j}", "ks": st(scaled(s))} for j, s in enumerate(subs)],
            {"ty": "fl", "nm": "ispuna", "c": st(FILL), "o": st(100), "r": 2},
            {"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]), "r": st(0), "o": st(100), "sk": st(0), "sa": st(0)}]}
def ring(nm, r, w):
    """Puna kruznica kao linija — za unutrasnji dupli krug, koji je u SVG-u isecen na lukove."""
    return {"ty": "gr", "nm": nm, "it": [
        {"ty": "el", "nm": "krug", "p": st([C, C]), "s": st([R(2*r), R(2*r)]), "d": 1},
        {"ty": "st", "nm": "linija", "c": st(FILL), "o": st(100), "w": st(R(w)), "lc": 1, "lj": 1},
        {"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]), "r": st(0), "o": st(100), "sk": st(0), "sa": st(0)}]}
def center(subs):
    xs = [x for s in subs for x, _ in s["v"]]; ys = [y for s in subs for _, y in s["v"]]
    return (R((min(xs)+max(xs))/2*S), R((min(ys)+max(ys))/2*S))
K = 0.5522847498
def circle_mask(r, inv):
    # SUPROTNO od kazaljke (na ekranu): desno -> gore -> levo -> dole. Obrnuta maska se u
    # plejerima crta kao pravougaonik + ova putanja sa nonzero pravilom, pa rupa nastaje
    # samo ako je smer suprotan pravougaoniku. Sa smerom kazaljke maska ne radi.
    k = K * r
    v = [[C + r, C], [C, C - r], [C - r, C], [C, C + r]]
    o = [[0, -k], [-k, 0], [0, k], [k, 0]]
    i = [[0, k], [k, 0], [0, -k], [-k, 0]]
    return [{"inv": inv, "mode": "a", "pt": st({"i": i, "o": o, "v": v, "c": True}), "o": st(100), "x": st(0), "nm": "lice"}]
P = [parse(d) for d in paths]
sunce = P[2] + P[3]
SIGNS = {"aries": [4], "taurus": [5], "gemini": [6], "cancer": [7, 8], "leo": [9], "virgo": [10], "libra": [11, 12],
         "scorpio": [18], "sagittarius": [13], "capricorn": [15], "aquarius": [16, 17], "pisces": [14]}
INTRO = {"a": 1, "k": [{"i": {"x": [0.2], "y": [1]}, "o": {"x": [0.57], "y": [0]}, "t": 0, "s": [0]}, {"t": 50, "s": [360]}]}
SLOW = {"a": 1, "k": [{"i": {"x": [0.833], "y": [0.833]}, "o": {"x": [0.167], "y": [0.167]}, "t": 0, "s": [0]}, {"t": 1500, "s": [360]}]}
COUNTER = copy.deepcopy(SLOW)
for kf in COUNTER["k"]: kf["s"] = [-v for v in kf["s"]]
def ks(a, p, r=0): return {"o": st(100), "r": r if isinstance(r, dict) else st(r), "p": st([p[0], p[1], 0]), "a": st([a[0], a[1], 0]), "s": st([100, 100, 100])}
def layer(ind, nm, shapes=None, parent=None, ty=4, masks=None, **k):
    l = {"ddd": 0, "ind": ind, "ty": ty, "nm": nm, "sr": 1, "ao": 0, "ip": 0, "op": 1500, "st": 0, "bm": 0, **k}
    if parent is not None: l["parent"] = parent
    if ty == 4: l["shapes"] = shapes
    if masks: l["hasMask"] = True; l["masksProperties"] = masks
    return l
layers = [layer(1, "Uvod", ty=3, ks=ks((C, C), (C, C), INTRO)), layer(2, "Okret", ty=3, parent=1, ks=ks((C, C), (C, C), SLOW))]
ind = 3
for name, idx in SIGNS.items():
    subs = [s for i in idx for s in P[i]]; c = center(subs)
    layers.append(layer(ind, f"znak {name}", [group(name, subs)], parent=2, ks=ks(c, c, COUNTER))); ind += 1
layers.append(layer(ind, "Zraci", [group("sunce", sunce)], parent=2, ks=ks((C, C), (C, C)), masks=circle_mask(R_LICE, True))); ind += 1
layers.append(layer(ind, "Lice", [group("sunce", sunce)], ks=ks((C, C), (C, C)), masks=circle_mask(R_LICE, False))); ind += 1
# Spoljni dupli krug (putanja 1) je ceo. Unutrasnji (putanja 0) je u SVG-u ISPREKIDAN —
# 24 luka izmedju zraka — a Ivan hoce spojen dupli krug (26.9.2026). Zato se crta iznova
# kao dve pune kruznice na izmerenim poluprecnicima: 24,35-24,76 i 25,56-25,97.
unutrasnji = [ring("unutrasnji 1", 24.555 * S, 0.41 * S), ring("unutrasnji 2", 25.765 * S, 0.41 * S)]
layers.append(layer(ind, "Prsten", [group("spoljni", P[1]), *unutrasnji], ks=ks((C, C), (C, C)))); ind += 1
lottie = {"v": "5.7.4", "fr": 25, "ip": 0, "op": 1500, "w": int(SIZE), "h": int(SIZE), "nm": "astroshop-krug", "ddd": 0, "assets": [], "layers": layers}
json.dump(lottie, open(DST, "w"), separators=(",", ":"))
print("slojeva", len(layers), "velicina", os.path.getsize(DST), "B")
