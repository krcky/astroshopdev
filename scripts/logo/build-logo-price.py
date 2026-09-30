"""
Oblici loga "ASTRO ◎ SHOP" za sliku i video price: src/lib/logo-price-oblici.ts.

Izvor: files/logo-story-positive.svg (355 x 95, Ivan 30.9.2026). U VIDEU se krug vrti
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
SRC = os.path.join(HERE, "..", "..", "files", "logo-story-positive.svg")
DST = os.path.join(HERE, "..", "..", "src", "lib", "logo-price-oblici.ts")

svg = open(SRC, encoding="utf-8").read()
w, h = [float(x) for x in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg).groups()]
putanje = []
for a in re.findall(r"<path([^>]*)/?>", svg):
    putanje.append({
        "d": re.search(r' d="([^"]+)"', a).group(1),
        "evenodd": 'fill-rule="evenodd"' in a,
    })
assert len(putanje) == 21, len(putanje)

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

# Sredina i poluprecnik kruga: spoljni prsten (putanja 1).
x0, y0, x1, y1 = okvir([putanje[1]["d"]])
C = ((x0 + x1) / 2, (y0 + y1) / 2)
R = (x1 - x0) / 2
R_LICE = 13.5 / 40 * R  # u krug-vektor.svg: 13,5 od poluprecnika 40

# Znakovi: delovi u istom uglu (do 10°) su jedan znak.
znakovi = []
for k in range(4, 19):
    bx = okvir([putanje[k]["d"]])
    ugao = math.degrees(math.atan2((bx[1] + bx[3]) / 2 - C[1], (bx[0] + bx[2]) / 2 - C[0])) % 360
    for z in znakovi:
        if abs((z["ugao"] - ugao + 180) % 360 - 180) < 10:
            z["delovi"].append(k); break
    else:
        znakovi.append({"ugao": ugao, "delovi": [k]})
assert len(znakovi) == 12, len(znakovi)

def ts_putanja(k):
    p = putanje[k]
    return "{ d: '%s'%s }" % (p["d"], ", evenodd: true" if p["evenodd"] else "")

r = lambda v: round(v, 3)
L = [
    "/**",
    " * GENERISANO — ne menjati rucno: `python3 scripts/logo/build-logo-price.py`",
    " * (iz files/logo-story-positive.svg). Slojevi i zasto: komentar u skripti.",
    " */",
    "export type Putanja = { d: string; evenodd?: boolean };",
    "export type ZnakLoga = { delovi: Putanja[]; x0: number; y0: number; w: number; h: number; cx: number; cy: number };",
    "",
    f"export const LOGO_MREZA = {{ w: {r(w)}, h: {r(h)} }} as const;",
    f"/** Sredina i poluprecnik kruga (spoljni prsten), i ivica lica (tu pocinju zraci). */",
    f"export const LOGO_KRUG = {{ cx: {r(C[0])}, cy: {r(C[1])}, r: {r(R)}, rLice: {r(R_LICE)} }} as const;",
    "",
    f"export const LOGO_SLOVA: Putanja[] = [{ts_putanja(19)}, {ts_putanja(20)}];",
    f"export const LOGO_PRSTEN: Putanja = {ts_putanja(1)};",
    f"export const LOGO_LUKOVI: Putanja = {ts_putanja(0)};",
    f"export const LOGO_SUNCE: Putanja[] = [{ts_putanja(2)}, {ts_putanja(3)}];",
    "export const LOGO_ZNAKOVI: ZnakLoga[] = [",
]
for z in znakovi:
    bx = okvir([putanje[k]["d"] for k in z["delovi"]])
    delovi = ", ".join(ts_putanja(k) for k in z["delovi"])
    L.append(f"  {{ delovi: [{delovi}], x0: {r(bx[0])}, y0: {r(bx[1])}, w: {r(bx[2] - bx[0])}, h: {r(bx[3] - bx[1])}, cx: {r((bx[0] + bx[2]) / 2)}, cy: {r((bx[1] + bx[3]) / 2)} }},")
L.append("];")
open(DST, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("krug", r(C[0]), r(C[1]), "r", r(R), "lice", r(R_LICE), "znakova", len(znakovi), [len(z["delovi"]) for z in znakovi])
