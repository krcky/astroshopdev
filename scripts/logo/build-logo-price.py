"""
Oblici loga "ASTRO ◎ SHOP" (pozitiv i negativ) za sliku i video price: src/lib/logo-price-oblici.ts.

Izvori: files/logo-story-positive.svg i files/logo-story-negative.svg (Ivan, 30.9.2026) — SVAKI
svoj crtez: negativ NIJE prebojen pozitiv (lice je belo, oci i usta u boji pozadine; neki znakovi
imaju tanak obris). Do 30.9.2026 negativ je bio prebojen pozitiv i lice je ispalo naopako. U VIDEU se krug vrti
kao u logu i uvodu (`build-krug.py`): LICE miruje, ZRACI i unutrasnji lukovi se okrecu,
a ZNAKOVI kruze ali ostaju USPRAVNI. Zato se putanje razvrstavaju po slojevima:
    slova      19, 20  (siva #424242; u negativu bela)
    prsten     1       spoljni krug, pun — okret ga ne menja, crta se miran
    lukovi     0       unutrasnji krug isecen izmedju zraka — okrece se SA zracima
    sunce      2, 3    zraci + lice; maska na r = 13,5 / 80 precnika (kao u build-krug.py)
    znakovi    4-18    15 putanja -> 12 znakova (delovi istog znaka su u istom uglu)
Negativ (files/logo-story-negative.svg) je isti crtez u beloj, pa se koriste ovi oblici.

Pokreni: python3 scripts/logo/build-logo-price.py
"""
import math, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = os.path.join(HERE, "..", "..", "files")
DST = os.path.join(HERE, "..", "..", "src", "lib", "logo-price-oblici.ts")

def tacke(d):
    """Tacke putanje (i kontrolne) — za okvir; samo apsolutne i relativne M L H V C S Z."""
    t = re.findall(r"[MmLlHhVvCcSsZz]|-?\d*\.?\d+(?:e-?\d+)?", d)
    i = 0; x = y = sx = sy = 0.0; out = []; cmd = None
    def n():
        nonlocal i
        v = float(t[i]); i += 1; return v
    while i < len(t):
        if re.match(r"[A-Za-z]", t[i]): cmd = t[i]; i += 1
        if cmd in "Zz": x, y = sx, sy; continue
        if cmd == "M": x, y = n(), n(); sx, sy = x, y; out.append((x, y)); cmd = "L"
        elif cmd == "m": x += n(); y += n(); sx, sy = x, y; out.append((x, y)); cmd = "l"
        elif cmd == "L": x, y = n(), n(); out.append((x, y))
        elif cmd == "l": x += n(); y += n(); out.append((x, y))
        elif cmd == "H": x = n(); out.append((x, y))
        elif cmd == "h": x += n(); out.append((x, y))
        elif cmd == "V": y = n(); out.append((x, y))
        elif cmd == "v": y += n(); out.append((x, y))
        elif cmd == "C":
            a = [n() for _ in range(6)]; out += [(a[0], a[1]), (a[2], a[3])]; x, y = a[4], a[5]; out.append((x, y))
        elif cmd == "c":
            a = [n() for _ in range(6)]; out += [(x + a[0], y + a[1]), (x + a[2], y + a[3])]; x += a[4]; y += a[5]; out.append((x, y))
        elif cmd in "Ss":
            a = [n() for _ in range(4)]
            if cmd == "S": x, y = a[2], a[3]
            else: x += a[2]; y += a[3]
            out.append((x, y))
        else: raise ValueError(cmd)
    return out

def okvir(ds):
    p = [q for d in ds for q in tacke(d)]
    xs = [a for a, _ in p]; ys = [b for _, b in p]
    return min(xs), min(ys), max(xs), max(ys)

def razvrstaj(ime):
    svg = open(os.path.join(FILES, ime), encoding="utf-8").read()
    w, h = [float(x) for x in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg).groups()]
    putanje = []
    for a in re.findall(r"<path([^>]*)/?>", svg):
        pot = re.search(r'stroke-width="([\d.]+)"', a)
        fill = re.search(r' fill="([^"]+)"', a)
        putanje.append({
            "d": re.search(r' d="([^"]+)"', a).group(1),
            "evenodd": 'fill-rule="evenodd"' in a,
            # Samo obris (bez ispune): tanak potez oko znaka u negativu.
            "potez": float(pot.group(1)) if pot and not fill else None,
        })
        putanje[-1]["okvir"] = okvir([putanje[-1]["d"]])
    # Spoljni prsten: najsira OKRUGLA putanja (sirina ~ visina) — slova su sira, ali niska.
    okrugle = [p for p in putanje if abs((p["okvir"][2] - p["okvir"][0]) - (p["okvir"][3] - p["okvir"][1])) < 0.05 * (p["okvir"][2] - p["okvir"][0])]
    prsten = max(okrugle, key=lambda p: p["okvir"][2] - p["okvir"][0])
    x0, y0, x1, y1 = prsten["okvir"]
    C = ((x0 + x1) / 2, (y0 + y1) / 2); R = (x1 - x0) / 2; D = 2 * R
    sloj = {"slova": [], "prsten": [], "sunce": [], "lukovi": [], "znakovi": []}
    for p in putanje:
        bx = p["okvir"]; sir = bx[2] - bx[0]
        if bx[2] < C[0] - R or bx[0] > C[0] + R: sloj["slova"].append(p)
        elif sir >= 0.98 * D: sloj["prsten"].append(p)
        elif sir >= 0.9 * D: sloj["sunce"].append(p)
        elif sir >= 0.5 * D: sloj["lukovi"].append(p)
        elif sir < 0.25 * D: sloj["znakovi"].append(p)
        else: raise ValueError(f"{ime}: putanja nije razvrstana, sirina {sir:.1f}")
    znakovi = []
    for p in sloj["znakovi"]:
        bx = p["okvir"]
        ugao = math.degrees(math.atan2((bx[1] + bx[3]) / 2 - C[1], (bx[0] + bx[2]) / 2 - C[0])) % 360
        for z in znakovi:
            if abs((z["ugao"] - ugao + 180) % 360 - 180) < 10:
                z["delovi"].append(p); break
        else:
            znakovi.append({"ugao": ugao, "delovi": [p]})
    assert len(sloj["slova"]) == 2 and len(sloj["prsten"]) == 1 and sloj["sunce"] and sloj["lukovi"], (ime, {k: len(v) for k, v in sloj.items()})
    assert len(znakovi) == 12, (ime, len(znakovi))
    return {"w": w, "h": h, "C": C, "R": R, "sloj": sloj, "znakovi": znakovi}

r = lambda v: round(v, 3)
def ts_putanja(p):
    x = "{ d: '%s'" % p["d"]
    if p["evenodd"]: x += ", evenodd: true"
    if p["potez"]: x += ", potez: %s" % r(p["potez"])
    return x + " }"
def ts_niz(ps): return "[" + ", ".join(ts_putanja(p) for p in ps) + "]"

def ts_oblik(o):
    L = [
        "  {",
        f"    mreza: {{ w: {r(o['w'])}, h: {r(o['h'])} }},",
        f"    krug: {{ cx: {r(o['C'][0])}, cy: {r(o['C'][1])}, r: {r(o['R'])}, rLice: {r(13.5 / 40 * o['R'])} }},",
        f"    slova: {ts_niz(o['sloj']['slova'])},",
        f"    prsten: {ts_niz(o['sloj']['prsten'])},",
        f"    lukovi: {ts_niz(o['sloj']['lukovi'])},",
        f"    sunce: {ts_niz(o['sloj']['sunce'])},",
        "    znakovi: [",
    ]
    for z in o["znakovi"]:
        bx = okvir([p["d"] for p in z["delovi"]])
        L.append(f"      {{ delovi: {ts_niz(z['delovi'])}, x0: {r(bx[0])}, y0: {r(bx[1])}, w: {r(bx[2] - bx[0])}, h: {r(bx[3] - bx[1])}, cx: {r((bx[0] + bx[2]) / 2)}, cy: {r((bx[1] + bx[3]) / 2)} }},")
    L += ["    ],", "  }"]
    return "\n".join(L)

poz = razvrstaj("logo-story-positive.svg")
neg = razvrstaj("logo-story-negative.svg")
out = [
    "/**",
    " * GENERISANO — ne menjati rucno: `python3 scripts/logo/build-logo-price.py`",
    " * (iz files/logo-story-positive.svg i files/logo-story-negative.svg). Slojevi i zasto: komentar u skripti.",
    " */",
    "export type Putanja = { d: string; evenodd?: boolean; potez?: number };",
    "export type ZnakLoga = { delovi: Putanja[]; x0: number; y0: number; w: number; h: number; cx: number; cy: number };",
    "export type OblikLoga = {",
    "  mreza: { w: number; h: number };",
    "  /** Sredina i poluprecnik kruga (spoljni prsten), i ivica lica (tu pocinju zraci). */",
    "  krug: { cx: number; cy: number; r: number; rLice: number };",
    "  slova: Putanja[]; prsten: Putanja[]; lukovi: Putanja[]; sunce: Putanja[]; znakovi: ZnakLoga[];",
    "};",
    "",
    "export const LOGO_OBLIK: { pozitiv: OblikLoga; negativ: OblikLoga } = {",
    "  pozitiv:",
    ts_oblik(poz) + ",",
    "  negativ:",
    ts_oblik(neg) + ",",
    "};",
]
open(DST, "w", encoding="utf-8").write("\n".join(out) + "\n")
for ime, o in (("pozitiv", poz), ("negativ", neg)):
    print(ime, "krug", r(o["C"][0]), r(o["C"][1]), "r", r(o["R"]), {k: len(v) for k, v in o["sloj"].items()}, "znakova", len(o["znakovi"]))
