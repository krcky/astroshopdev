"""
Krug za UVOD pri pokretanju: assets/lottie/logo-krug-uvod.json.

Isti oblici i slojevi kao `logo-krug.json` (pokreni prvo build-krug.py) — menja
se SAMO okret sloja "Uvod". U logu je to jedan okret od 2 s koji se uspori i
stane; u uvodu krug mora da se vrti DOK SE CEKA (Ivan, 28.9.2026: "samo da se
vrti krug i kad se zavrsi loading da se zumira"), a posle kratkog brzog dela da
uspori (Ivan, 29.9.2026: "malo nek se vrti brzo pa nek uspori"):

    ubrzanje      0 -> BRZO za UBRZANJE kadrova (kvadratno, iz mirovanja kao splash)
    brzo          jedan krug na BRZO_S sekundi, do kadra BRZO_DO
    usporavanje   BRZO -> SPORO za USPORAVANJE kadrova (ravnomerno kocenje)
    sporo         jedan krug na SPORO_S sekundi, do kraja kompozicije (60 s)

Na svakom spoju brzina je ista (krive su kvadratne, nagibi se poklapaju), pa se
prelazi ne vide. Lice miruje, zraci i znakovi se okrecu — kao u logu. Kadar 0 je
isti kao u logu (ugao 0), pa sistemski splash (`build-splash.swift`, crta
logo-krug.json) i dalje odgovara prvom kadru uvoda. `check:uvod` sve to proverava,
prema `LOTTIE_VRTENJE` u `src/lib/uvod.ts` — brojevi ovde i tamo moraju biti isti.

Zasto ceo okret u JSON-u, a ne petlja iz JS-a: kad se uvod pokrene, JS je zauzet
crtanjem aplikacije; petlja koja ceka `onAnimationFinish` bi zastala bas tada.

Pokreni: python3 scripts/logo/build-krug-uvod.py
"""
import copy, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "..", "assets", "lottie", "logo-krug.json")
DST = os.path.join(HERE, "..", "..", "assets", "lottie", "logo-krug-uvod.json")

BRZO_S = 1.0        # sekundi po krugu, brzi deo
UBRZANJE = 12       # kadrova do pune brzine (0,48 s na 25 fps)
BRZO_DO = 30        # kadar kad pocinje usporavanje (1,2 s)
USPORAVANJE = 25    # kadrova usporavanja (1 s)
SPORO_S = 6.0       # sekundi po krugu, posle usporavanja

logo = json.load(open(SRC))
uvod = copy.deepcopy(logo)
fr, op = uvod["fr"], uvod["op"]
brzo = 360 / (BRZO_S * fr)       # stepeni po kadru
sporo = 360 / (SPORO_S * fr)

def kvadratna(v0, v1, trajanje):
    """
    Deo sa ravnomernom promenom brzine v0 -> v1 (stepeni/kadar) za `trajanje`
    kadrova: ugao koji predje i Lottie ručke kubne krive koja je tacno ta parabola.
    Normalizovano: y = a x + b x^2, a = v0*T/dA, nagib na kraju v1*T/dA.
    """
    dA = (v0 + v1) / 2 * trajanje
    a, s1 = v0 * trajanje / dA, v1 * trajanje / dA
    return dA, {"x": [1 / 3], "y": [a / 3]}, {"x": [2 / 3], "y": [1 - s1 / 3]}

LINIJA = ({"x": [0], "y": [0]}, {"x": [1], "y": [1]})
k = []
ugao = 0.0
dA, o, i = kvadratna(0, brzo, UBRZANJE)
k.append({"t": 0, "s": [0], "o": o, "i": i}); ugao += dA
k.append({"t": UBRZANJE, "s": [round(ugao, 4)], "o": LINIJA[0], "i": LINIJA[1]}); ugao += brzo * (BRZO_DO - UBRZANJE)
dA, o, i = kvadratna(brzo, sporo, USPORAVANJE)
k.append({"t": BRZO_DO, "s": [round(ugao, 4)], "o": o, "i": i}); ugao += dA
k.append({"t": BRZO_DO + USPORAVANJE, "s": [round(ugao, 4)], "o": LINIJA[0], "i": LINIJA[1]}); ugao += sporo * (op - BRZO_DO - USPORAVANJE)
k.append({"t": op, "s": [round(ugao, 4)]})

sloj = next(l for l in uvod["layers"] if l["nm"] == "Uvod")
sloj["ks"]["r"] = {"a": 1, "k": k}
uvod["nm"] = "astroshop-krug-uvod"
json.dump(uvod, open(DST, "w"), separators=(",", ":"))
print(f"logo-krug-uvod: brzo {brzo:.2f} st/kadar do {BRZO_DO}, sporo {sporo:.2f} od {BRZO_DO + USPORAVANJE}, {os.path.getsize(DST)} B")
