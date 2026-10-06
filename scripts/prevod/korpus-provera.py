#!/usr/bin/env python3
"""
Provera i sklapanje prevoda korpusa astrologa (hr, bs, en). Noc 2.10.2026.

Serije pravi `korpus-serije.py`. Prevodilac (agent) za svaki red serije pise jedan fajl
  ~/Desktop/Astroshop App/Prevod korpusa/rad/<jezik>/redovi/<izvor>-<red>.json
istog oblika kao red u rad/ulaz/<serija>.json, sa prevedenim vrednostima.

  python3 scripts/prevod/korpus-provera.py provera <jezik> [serija ...]   provera redova (izlaz 1 = ima gresaka)
  python3 scripts/prevod/korpus-provera.py sklopi <jezik>                 CSV-ovi + pojmovnik.json + IZVESTAJ.md
  python3 scripts/prevod/korpus-provera.py razdeli <jezik> <serija>       STEDLJIVO: cela serija iz rad/<jezik>/serije/<serija>.json
                                                                         (lista redova) -> fajl po redu, pa provera te serije
  python3 scripts/prevod/korpus-provera.py stanje                        koliko je gotovo, po jeziku i grupi
  python3 scripts/prevod/korpus-provera.py uporedi <jezik> <izvor>-<red> ...  srpski i prevod jedan ispod drugog (za pregled)

PROVERE (sta padne — prevodi se ponovo):
  - isti kljucevi i prepisana polja (key, version, kind, free, phase, sign, area);
  - polje puno u srpskom -> puno u prevodu, prazno -> prazno;
  - isti broj pasusa (prazan red = granica), isti broj redova "• ", isti broj stavki "• Naslov – tekst";
  - sections: lista istog broja odeljaka, poznati naslovi prevedeni TACNO po pojmovniku;
  - duzina 0,6—1,6 x srpska (en od 0,5); duzi tekst identican srpskom = nije preveden;
  - hr/bs: bez ceste ekavske reci (spisak iz scripts/check-prevod.ts + prosiren), granica reci = slovo;
  - hr: bez srpskih/bosanskih reci (sta, ko, hiljada, sedmica, opsti, tacka, Skorpija, Vodolija...);
  - bs: bez Skorpion, Vodenjak, tjedan, tocka, tko;
  - en: bez srpskih slova i cestih srpskih reci.

Korpus NE ide u repo (pravilo 7): ova skripta je u repou, tekstovi samo na Desktopu.
"""
import csv, json, os, re, sys, tempfile
from pathlib import Path

DESK = Path.home() / 'Desktop' / 'Astroshop App'
REPO = Path.home() / 'Developer' / 'astroshop'
KOREN = DESK / 'Prevod korpusa'
RAD = KOREN / 'rad'
ULAZ = RAD / 'ulaz'
IZVORI = {
    'transit': DESK / 'Tranziti AstroShop' / 'transit-texts.csv',
    'natal': REPO / 'files' / 'natal-texts.csv',
    'lunar': DESK / 'Lunarni kalendar' / 'lunar-texts.csv',
}
IZLAZ_IME = {'transit': 'transit-texts.csv', 'natal': 'natal-texts.csv', 'lunar': 'lunar-texts.csv'}
JEZICI = ('hr', 'bs', 'en')
PREVODI = {
    'transit': ['title', 'body', 'positive', 'challenge', 'advice', 'sections'],
    'natal': ['title', 'subtitle', 'body'],
    'lunar': ['body'],
}
PREPISUJE = ['key', 'version', 'kind', 'free', 'phase', 'sign', 'area']

L = r'[^\W\d_]'  # slovo (Pythonov re nema \p{L})


def rec(spisak):
    return re.compile(rf'(?<!{L})(?:{spisak})(?!{L})', re.I)


# Iz scripts/check-prevod.ts (EKAVICA), prosireno recima koje su ceste u korpusu.
# Namerno IZOSTAVLJENO jer postoji i u ijekavici: vremena/vremenom (kratki jat), video, vecer, lekcija,
# lepeza/lepršav, osveta, sledi; za hr i "ukus" (estetski smisao je ispravan hrvatski).
EKAVICA = rec(
    r'vreme|mesto|mesta|mestu|mesec|meseca|mesecu|meseci|dete|deca|deteta|reč|reči|lepo|lepa|svet|sveta|uvek|gde|'
    r'posle|primer|cena|cenu|deo|delu|delova|menja|menjaš|promeni|promena|promene|videti|ceo|cela|celu|celi|celog|'
    r'nedelja|nedelju|sneg|verovatno|beleška|razumeš|'
    # prosirenje (2.10.2026)
    r'mest[ao]m|mesečn\w*|mesecom|mesece|mesecima|dec[eiu]|detinj\w*|'
    r'rečima|lep[eiu]|lepim|lepih|lepš\w*|lepot\w*|svetu|svetom|svetl\w*|svetsk\w*|osvetl\w*|primer[aeiu]|primeri\w*|'
    r'cen[eio]|cenom|cenit\w*|ceni|cenj\w*|menjaju|menjat\w*|menjanj\w*|promen\w*|izmen\w*|zamen\w*|videl\w*|'
    r'celin\w*|celokup\w*|celoj|celom|celim|cele|nedelj\w*|verova\w*|veru|vere|vera|vernost\w*|vern[aiou]\w*|'
    r'uveren\w*|razume[mšo]\w*|razumevanj\w*|oseć\w*|sećanj\w*|seća\w*|telo|tela|telu|telom|telesn\w*|leč\w*|'
    r'lek|leka|lekov\w*|lekar\w*|isceljenj\w*|pre|napred|unapred|smer\w*|mer[aeiu]|umeren\w*|merom|merenj\w*|'
    r'sme|smete|smem|smeš|čovek\w*|devojk\w*|deluj\w*|delovanj\w*|delotvor\w*|dejstv\w*|delatn\w*|uspe[hš]\w*|'
    r'večn\w*|večit\w*|sveže|svež\w*|pesm\w*|bel[aeiou]|belin\w*|reš[ei]\w*|rešenj\w*|želeti|želeo|želela|'
    r'hteo|htela|pobed\w*|negde|nigde|svugde|ovde|onde|odavde|sledeć\w*|posled\w*|nasled\w*|osmeh\w*|smeh\w*|'
    r'vetar|vetr\w*|strelac|strelc\w*|devic\w*|sever\w*|mlek\w*|cvet\w*|procvet\w*|semen\w*|seme|sejanj\w*|sejat\w*'
)

# Srpske reci koje hrvatski nema (ili ima drukcije): tko/sto, tisuca, tjedan, opci, tocka, utjecaj, obitelj...
HR_NIJE = rec(
    r'šta|ko|niko|hiljad\w*|sedmic\w*|opšt\w*|uopšte|tačk\w*|tačn\w*|netačn\w*|škorpij\w*|vodolij\w*|'
    r'da\s+li|vaspitanj\w*|vazduh\w*|hleb\w*|porodic\w*|bašt\w*|kafa|kafu|kafe|voz|istorij\w*|hemij\w*|'
    r'uticaj\w*|utica\w*|saradnj\w*|sarađ\w*|organizov\w*|realizov\w*|kontrolis\w*|definis\w*|obezbe\w*|'
    r'sopstven\w*|kancelarij\w*|spoljn\w*|spolja|bezbed\w*|srećn\w*|srećan|tokom|veoma|takođe|desi|desiti|'
    r'desilo|desila|desio|dešava\w*|izvini\w*|jedanput'
)
BS_NIJE = rec(r'škorpion\w*|vodenjak\w*|tjedn\w*|tjedan|točk\w*|točn\w*|tko|nitko|netko|tisuć\w*|glazb\w*|kolovoz|rujan')
EN_SRPSKO = re.compile(r'[čćšžđČĆŠŽĐ]')
EN_RECI = rec(r'je|se|da|ili|koji|koja|kada|kao|vam|vas|vaš\w*|ste|biti|što|šta|sunce|mesec|mjesec|venera|merkur')
EN_NAZIVI = rec(r'ascendent|Neptun|Pluton|Uran|Merkur|Venera|Jarac|Vodolija|Strelac|Škorpija|Djevica|Devica|Ovan|'
                r'Bik|Rak|Lav|Vaga|Ribe|Blizanci|kvadrat|trigon|sekstil|opozicija|konjunkcija|Lilit')

# Naslovi odeljaka duge verzije: aplikacija ih prepoznaje po korenu (lib/tumacenje.ts vrstaSekcije),
# zato MORAJU biti uvek isti. Iz pojmovnika (rad/pojmovnik-osnova.json, "naslovi").


def ucitaj_osnovu():
    p = RAD / 'pojmovnik-osnova.json'
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}


def pasusi(s):
    s = (s or '').strip()
    return [p for p in re.split(r'\n\s*\n', s) if p.strip()] if s else []


def bulleti(s):
    redovi = [r.strip() for r in (s or '').split('\n')]
    b = [r for r in redovi if r.startswith('•')]
    return len(b), sum(1 for r in b if ' – ' in r)


def tekst_polja(o, k):
    if k == 'sections':
        return '\n\n'.join(h['heading'] + '\n' + h['body'] for h in o.get(k) or [])
    return o.get(k) or ''


def proveri_tekst(jezik, polje, s, t):
    g = []
    if not t.strip():
        return [f'{polje}: prazno']
    np_, nt = len(pasusi(s)), len(pasusi(t))
    if np_ != nt:
        g.append(f'{polje}: pasusa {nt}, u srpskom {np_}')
    bs_, bt = bulleti(s), bulleti(t)
    if bs_[0] != bt[0]:
        g.append(f'{polje}: redova "•" {bt[0]}, u srpskom {bs_[0]}')
    elif bs_[1] != bt[1]:
        g.append(f'{polje}: stavki "• Naslov – tekst" {bt[1]}, u srpskom {bs_[1]} (razdvajac je " – ", crta sa razmacima)')
    if len(s) >= 60:
        k = len(t) / len(s)
        donja = 0.5 if jezik == 'en' else 0.6
        if not (donja <= k <= 1.6):
            g.append(f'{polje}: duzina {k:.2f} x srpska (dozvoljeno {donja}—1,6)')
        # Bosanski je blizak srpskom: kratak odeljak bez jata ume da bude ISPRAVNO isti (3.10.2026).
        if t.strip() == s.strip() and (jezik != 'bs' or len(s) >= 300):
            g.append(f'{polje}: identicno srpskom — nije prevedeno')
    if jezik in ('hr', 'bs'):
        for m in EKAVICA.finditer(t):
            g.append(f'{polje}: ekavica "{m.group(0)}"')
            break
        rx = HR_NIJE if jezik == 'hr' else BS_NIJE
        for m in rx.finditer(t):
            g.append(f'{polje}: nije {jezik} "{m.group(0)}"')
            break
    if jezik == 'en':
        m = EN_SRPSKO.search(t)
        if m:
            g.append(f'{polje}: srpsko slovo "{t[max(0, m.start() - 15):m.end() + 15]}"')
        m = EN_RECI.search(t) or EN_NAZIVI.search(t)
        if m:
            g.append(f'{polje}: srpska rec/naziv "{m.group(0)}"')
    return g


def proveri_red(jezik, src, dst, osnova):
    g = []
    izvor = src['izvor']
    for k in PREPISUJE:
        if k in src and dst.get(k) != src[k]:
            g.append(f'{k}: "{dst.get(k)}" umesto "{src[k]}"')
    naslovi = osnova.get('naslovi', {})
    for k in PREVODI[izvor]:
        if k == 'sections':
            ss, ts = src.get(k) or [], dst.get(k)
            if not isinstance(ts, list) or len(ts) != len(ss):
                g.append(f'sections: {len(ts) if isinstance(ts, list) else "nije lista"} odeljaka, u srpskom {len(ss)}')
                continue
            for i, (a, b) in enumerate(zip(ss, ts)):
                if not isinstance(b, dict) or set(b) != {'heading', 'body'}:
                    g.append(f'sections[{i}]: kljucevi moraju biti tacno heading i body')
                    continue
                ocek = naslovi.get(a['heading'], {}).get(jezik)
                if ocek and b['heading'] != ocek:
                    g.append(f'sections[{i}].heading: "{b["heading"]}", po pojmovniku "{ocek}"')
                if not b['heading'].strip():
                    g.append(f'sections[{i}].heading: prazno')
                g += proveri_tekst(jezik, f'sections[{i}].body', a['body'], b['body'])
                if jezik in ('hr', 'bs'):
                    m = EKAVICA.search(b['heading']) or (HR_NIJE if jezik == 'hr' else BS_NIJE).search(b['heading'])
                    if m:
                        g.append(f'sections[{i}].heading: "{m.group(0)}"')
            continue
        s, t = src.get(k) or '', dst.get(k)
        if not isinstance(t, str):
            g.append(f'{k}: fali')
            continue
        if not s.strip():
            if t.strip():
                g.append(f'{k}: u srpskom prazno, u prevodu nije')
            continue
        g += proveri_tekst(jezik, k, s, t)
    # Lunarni: red "Odgovarajuci deo biljke:" uvek istim recima (aplikacija ga preskace po pocetku).
    if izvor == 'lunar':
        pre = osnova.get('lunar_deo_biljke', {}).get(jezik)
        ima = 'Odgovarajući deo biljke:' in src['body']
        if pre and ima and pre not in dst.get('body', ''):
            g.append(f'body: nema reda "{pre}"')
    return g


def ulaz_serije(serija):
    return json.loads((ULAZ / f'{serija}.json').read_text(encoding='utf-8'))


def put_reda(jezik, izvor, red):
    return RAD / jezik / 'redovi' / f'{izvor}-{red:04d}.json'


def citaj_red(jezik, izvor, red):
    p = put_reda(jezik, izvor, red)
    if not p.exists():
        return None, 'nema fajla'
    try:
        return json.loads(p.read_text(encoding='utf-8')), None
    except Exception as e:  # noqa
        return None, f'nije validan JSON: {e}'


def sve_serije():
    return json.loads((RAD / 'serije.json').read_text(encoding='utf-8'))


def provera(jezik, serije):
    osnova = ucitaj_osnovu()
    serije = serije or [s['serija'] for s in sve_serije()]
    ukupno = losih = nema = 0
    for s in serije:
        for src in ulaz_serije(s):
            dst, err = citaj_red(jezik, src['izvor'], src['red'])
            ukupno += 1
            if dst is None:
                nema += 1
                if len(serije) <= 3:
                    print(f'✗ {s} {src["key"]} {src.get("version", "")}: {err}')
                continue
            g = proveri_red(jezik, src, dst, osnova)
            if g:
                losih += 1
                print(f'✗ {s} {src["izvor"]}-{src["red"]:04d} {src["key"]} {src.get("version", "")}')
                for x in g:
                    print(f'    {x}')
    print(f'{jezik}: {ukupno} redova, {ukupno - nema - losih} prolazi, {losih} pada, {nema} nema')
    return 1 if (losih or nema) else 0


def atomski(p: Path, sadrzaj: str):
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=p.parent, prefix='.tmp-')
    with os.fdopen(fd, 'w', encoding='utf-8', newline='') as f:
        f.write(sadrzaj)
    os.replace(tmp, p)


def pojmovnik(jezik):
    osnova = ucitaj_osnovu()
    out, sukobi = {}, []
    for deo, v in osnova.items():
        if isinstance(v, dict):
            for sr, prevodi in v.items():
                if isinstance(prevodi, dict) and jezik in prevodi:
                    out[sr] = prevodi[jezik]
    d = RAD / jezik / 'pojmovnik-dopune'
    for f in sorted(d.glob('*.json')) if d.exists() else []:
        try:
            dop = json.loads(f.read_text(encoding='utf-8'))
        except Exception:  # noqa
            sukobi.append(f'{f.name}: nije validan JSON')
            continue
        for sr, pr in dop.items():
            if not isinstance(pr, str):
                continue
            if sr in out and out[sr] != pr:
                sukobi.append(f'"{sr}": "{out[sr]}" / "{pr}" ({f.stem})')
            else:
                out.setdefault(sr, pr)
    return out, sukobi


def sklopi(jezik):
    osnova = ucitaj_osnovu()
    stat = {}
    for izvor, put in IZVORI.items():
        with open(put, encoding='utf-8', newline='') as f:
            rd = csv.DictReader(f)
            kolone = rd.fieldnames + ['jezik']
            redovi = list(rd)
        out = []
        dobrih = losih = 0
        for i, r in enumerate(redovi):
            dst, _ = citaj_red(jezik, izvor, i)
            if dst is None:
                continue
            src = {'izvor': izvor, 'red': i, **{k: (json.loads(v) if v else []) if k == 'sections' else v for k, v in r.items()}}
            if proveri_red(jezik, src, dst, osnova):
                losih += 1
                continue
            dobrih += 1
            o = dict(r)
            for k in PREVODI[izvor]:
                if k == 'sections':
                    o[k] = json.dumps(dst[k], ensure_ascii=False) if dst[k] else ''
                else:
                    o[k] = dst[k]
            o['jezik'] = jezik
            out.append(o)
        if out:
            import io
            buf = io.StringIO()
            w = csv.DictWriter(buf, fieldnames=kolone)
            w.writeheader()
            w.writerows(out)
            atomski(KOREN / jezik / IZLAZ_IME[izvor], buf.getvalue())
        stat[izvor] = (dobrih, losih, len(redovi))
    p, sukobi = pojmovnik(jezik)
    atomski(KOREN / jezik / 'pojmovnik.json', json.dumps(p, ensure_ascii=False, indent=1, sort_keys=True))
    izvestaj()
    for k, (d, l, n) in stat.items():
        print(f'{jezik} {k}: {d}/{n} u CSV-u, {l} pada provere')
    if sukobi:
        print(f'pojmovnik {jezik}: {len(sukobi)} razlicitih prevoda iste fraze (u IZVESTAJ.md)')


def stanje_tabela():
    serije = sve_serije()
    osnova = ucitaj_osnovu()
    grupe = []
    for s in serije:
        if s['grupa'] not in grupe:
            grupe.append(s['grupa'])
    red = ['| Grupa | ' + ' | '.join(JEZICI) + ' |', '|---|' + '---|' * len(JEZICI)]
    zbir = {j: [0, 0, 0] for j in JEZICI}
    for g in grupe:
        cel = []
        for j in JEZICI:
            ok = los = n = 0
            for s in [x for x in serije if x['grupa'] == g]:
                for src in ulaz_serije(s['serija']):
                    n += 1
                    dst, _ = citaj_red(j, src['izvor'], src['red'])
                    if dst is None:
                        continue
                    if proveri_red(j, src, dst, osnova):
                        los += 1
                    else:
                        ok += 1
            zbir[j][0] += ok; zbir[j][1] += los; zbir[j][2] += n
            pregled = sorted((RAD / j / 'pregled').glob(f'{g}-*.md')) if (RAD / j / 'pregled').exists() else []
            cel.append(f'{ok}/{n}' + (f' ({los} pada)' if los else '') + (' ✔ pregled' if pregled else ''))
        red.append(f'| {g} | ' + ' | '.join(cel) + ' |')
    red.append('| **ukupno** | ' + ' | '.join(f'**{a}/{c}**' + (f' ({b} pada)' if b else '') for a, b, c in zbir.values()) + ' |')
    return '\n'.join(red)


def izvestaj():
    delovi = []
    uvod = RAD / 'izvestaj-uvod.md'
    delovi.append(uvod.read_text(encoding='utf-8') if uvod.exists() else '# Prevod korpusa — izvestaj\n')
    delovi.append('## Stanje (racuna `korpus-provera.py`, posle svake serije)\n\n'
                  'Broj = redova koji su PROSLI automatske provere i usli u CSV / ukupno redova u grupi. '
                  '"✔ pregled" = nezavisan recenzent je prosao uzorak te grupe.\n\n' + stanje_tabela() + '\n')
    for j in JEZICI:
        _, sukobi = pojmovnik(j)
        if sukobi:
            delovi.append(f'### Pojmovnik {j}: ista fraza, razliciti prevodi ({len(sukobi)})\n\n' +
                          '\n'.join(f'- {s}' for s in sukobi[:60]) + ('\n- …' if len(sukobi) > 60 else '') + '\n')
    for j in JEZICI:
        d = RAD / j / 'pregled'
        fajlovi = sorted(d.glob('*.md')) if d.exists() else []
        if fajlovi:
            delovi.append(f'## Nezavisan pregled — {j}\n\n' + '\n\n'.join(f.read_text(encoding='utf-8').strip() for f in fajlovi) + '\n')
    nap = []
    for j in JEZICI:
        d = RAD / j / 'napomene'
        for f in sorted(d.glob('*.md')) if d.exists() else []:
            t = f.read_text(encoding='utf-8').strip()
            if t:
                nap.append(f'**{j} / {f.stem}**\n\n{t}')
    if nap:
        delovi.append('## Napomene prevodilaca (sumnjiva mesta u srpskom originalu, izbori)\n\n' + '\n\n'.join(nap) + '\n')
    atomski(KOREN / 'IZVESTAJ.md', '\n'.join(delovi))


def uporedi(jezik, oznake):
    sve = {}
    for s in sve_serije():
        for src in ulaz_serije(s['serija']):
            sve[f"{src['izvor']}-{src['red']:04d}"] = src
    for o in oznake:
        izv, red = o.rsplit('-', 1)
        o = f'{izv}-{int(red):04d}'
        src = sve.get(o)
        if not src:
            print(f'=== {o}: nema u ulazu')
            continue
        dst, err = citaj_red(jezik, src['izvor'], src['red'])
        print(f"\n=== {o}  {src['key']} {src.get('version', '')}  ({put_reda(jezik, src['izvor'], src['red'])})")
        if dst is None:
            print(f'    PREVODA NEMA: {err}')
            continue
        for k in PREVODI[src['izvor']]:
            if k == 'sections':
                for i, (a, b) in enumerate(zip(src[k], dst.get(k) or [])):
                    print(f'--- sections[{i}].heading\nSR: {a["heading"]}\n{jezik.upper()}: {b.get("heading")}')
                    print(f'--- sections[{i}].body\nSR: {a["body"]}\n{jezik.upper()}: {b.get("body")}')
            elif src.get(k):
                print(f'--- {k}\nSR: {src[k]}\n{jezik.upper()}: {dst.get(k)}')


def razdeli(jezik, serija):
    """Prevodilac pise JEDAN fajl za celu seriju (manje koraka = manje potrosnje); ovde se deli na redove."""
    p = RAD / jezik / 'serije' / f'{serija}.json'
    try:
        redovi = json.loads(p.read_text(encoding='utf-8'))
    except Exception as e:  # noqa
        print(f'✗ {p}: nije validan JSON: {e}')
        return 1
    if not isinstance(redovi, list):
        print('✗ fajl serije mora biti LISTA redova')
        return 1
    ocekivano = {(r['izvor'], r['red']) for r in ulaz_serije(serija)}
    for r in redovi:
        if (r.get('izvor'), r.get('red')) not in ocekivano:
            print(f"✗ red koji nije u seriji: {r.get('izvor')}-{r.get('red')}")
            return 1
        atomski(put_reda(jezik, r['izvor'], r['red']), json.dumps(r, ensure_ascii=False, indent=1))
    return provera(jezik, [serija])


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 2
    cmd = argv[1]
    if cmd == 'provera':
        return provera(argv[2], argv[3:])
    if cmd == 'razdeli':
        return razdeli(argv[2], argv[3])
    if cmd == 'sklopi':
        sklopi(argv[2])
        return 0
    if cmd == 'uporedi':
        uporedi(argv[2], argv[3:])
        return 0
    if cmd == 'stanje':
        print(stanje_tabela())
        return 0
    print(__doc__)
    return 2


if __name__ == '__main__':
    sys.exit(main(sys.argv))
