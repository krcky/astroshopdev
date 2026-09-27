---
name: korpus
description: Rad sa korpusom tumacenja astrologa — parsiranje .docx pošiljki, kanonski `contentKey`, izveštaj šta fali, uvoz u `transit_texts`, provera pokrivenosti. Učitaj kad stigne nova pošiljka od astrologa, kad se menja `parse_docx.py` ili `izvestaj.py`, kad se dodaje novo telo ili aspekt, i kad treba odgovoriti koliko je korpusa popunjeno.
---

# Korpus tumacenja

Korpus je **jedina stvar koju konkurencija ne može da kopira**. Sve ostalo u
projektu se da napisati ponovo; 600+ ručno pisanih tumačenja ne.

## Gde šta stoji

| Šta | Gde |
|---|---|
| Izvorni `.docx` od astrologa | `~/Desktop/Astroshop App/Tranziti AstroShop/` — `Kraci tranziti/` i `Duzi trazniti/` (ime foldera je stvarno tako napisano) |
| Parser | `scripts/korpus/parse_docx.py` |
| Izveštaj šta fali | `scripts/korpus/izvestaj.py` → `python3 scripts/korpus/izvestaj.py` |
| Šema tabele + RLS | `supabase/transit-texts.sql` |
| Čitanje iz aplikacije | `src/lib/transit-texts.ts` |
| Ko generiše ključeve | `src/lib/transits.ts` → `findAspects()` |

## Kanonski ključ — ne dira se

```
transit.<telo>.<aspekt>.natal.<meta>      npr. transit.jupiter.square.natal.venus
```

Primarni ključ je `(key, version)`, `version ∈ {short, long}`.

**Format se ne menja posle prvog uvoza.** Ključ je primarni ključ u bazi; svaka
izmena oblika raskida vezu između proračuna i teksta, i to tiho — aplikacija ne
padne, samo prestane da nalazi tumačenja.

Redosled tela u ključu prati niz `BODIES` u `astro.ts` da bi ključ bio
determinističan. Ako se `BODIES` prerasporedi, deo ključeva se preokrene i
prestane da se poklapa sa bazom. **Redosled u `BODIES` je deo ugovora sa
korpusom, ne stilsko pitanje.**

Engleska imena u ključu (`sun`, `moon`, …, `pluto`, plus `ascendant` i
`midheaven`) su ista u `parse_docx.py` (rečnici `PLANETE`, `ASPEKTI`) i u
`astro.ts`. Ako dodaješ telo, dodaje se na oba mesta ili ništa ne radi.

## Stanje (27.9.2026)

- Duge verzije: nova pošiljka 27.9.2026, 12 fajlova sa prefiksom broja
  (`01. Sunce…`, `11. Planete tranziti Ascendent`, `12. … MC`). Stara pošiljka
  je u `Duzi trazniti - stara verzija 2025/` — parser je ne čita.
- **Mesec:** duga 50/50, **kratka 0/50**. Mesec jedini menja ton *svakog dana*.
- **Ascendent i MC kao meta:** duga 99/100, **kratka 0/100**. Ključ je
  `…natal.ascendant` / `…natal.midheaven`. Ako kratke ne stignu — izbaciti ih
  iz `transits.ts`, ne ostavljati ih da vise.
- `NEMOGUCE` (u `parse_docx.py`, `izvestaj.py` ga uvozi) — parser ih i ne vraća.
  **Proverava se proračunom, ne preuzima od astrologa:** astrolog je 27.9.
  proglasio nemogućim i Pluton konjunkcija Neptun (rođeni 1999–2011 ga imaju
  SADA) i Pluton opozicija Pluton (rođeni od 1942, sa ~83 godine).
- `NAPOMENE` (u `parse_docx.py`) — mesta gde u `.docx` stoji poruka nama umesto
  tumačenja. Parser ih preskače da poruka ne završi na ekranu korisnika.

Kad ti treba tačan broj — **pokreni `izvestaj.py`, ne prepisuj ove brojeve.**
Izveštaj se računa iz samih `.docx` fajlova, pa je uvek tačan.

## Lektura — `ispravke.json`, ne izmena `.docx`

Astrologovi `.docx` fajlovi se NE menjaju. Ispravke stoje u
`~/Desktop/Astroshop App/Tranziti AstroShop/ispravke.json` (isečci korpusa —
zato NE u repou) i primenjuje ih `izvoz_csv.py` preko `scripts/korpus/ispravke.py`:

- tačna mesta `{kljuc, verzija, original, ispravka}` — isečak mora da se
  poklopi kao cela reč, inače "ozitivni efekti" pogodi ispravno "Pozitivni";
- pravila za ceo korpus (Ivan, 27.9.2026): "vi" malim slovom usred rečenice
  (posle crte ostaje veliko), "sa Izazovi:ma" → "sa izazovima", dupli razmak;
- u parseru: podnaslov "Saveti (Završna reč / Zlatna pravila)" → "Saveti",
  Unicode NFC.

Kad stigne nova pošiljka, izvoz ispiše ispravke čiji original više ne
postoji — obično znači da je astrolog to već sam ispravio. Ne brisati ih
naslepo: pogledati da li je tekst ispravljen ili samo drugačije napisan.
Lektura 27.9.2026: 775 ispravki, izveštaj `Lektura tumacenja 27.9.2026.docx`.

## Nacrti kratkih verzija (27.9.2026) — NISU u bazi

Ivan je tražio da se napišu kratke verzije koje fale. Napisane su kao SAŽETAK
astrologove duge verzije istog tranzita (njegove reči, naslov doslovno iz duge),
ne kao nov tekst: `nacrti-kratkih.json` (160) i
`NACRT kratke verzije - Mesec, ASC, MC.docx` pored `.docx` fajlova.
Dokument je u obliku astrologovih kratkih fajlova — kad ga pregleda i vrati,
ide u `Kraci tranziti/` i `parsiraj_kratku` ga čita (provereno: 160/160, polja
ista). Ivan je odlučio (27.9.2026) da nacrti idu u bazu pre potvrde:
`izvoz_csv.py` ih dodaje SAMO za ključ bez astrologove kratke verzije, pa
njegov tekst uvek ima prednost i nacrt sam otpada kad on vrati dokument.
`pregled.py` ih označava kao NACRT dok su isti kao nacrt. `izvestaj.py` ih
namerno NE broji — pokazuje šta astrolog još duguje.
Pluton kvadrat Ascendent nema ni dugu verziju, pa ni nacrt.

## Lunarni kalendar (28.9.2026)

Drugi korpus, isti put: `scripts/korpus/lunarni.py` čita
`~/Desktop/Astroshop App/Lunarni kalendar/*.docx` (jedan fajl po fazi, faza se
određuje po BROJU fajla — dva opadajuća imaju skoro isti naslov), primenjuje
`ispravke.json` iz tog foldera (899) + `ispravke.pravila`, a liste ujednačava
SAMO u redovima sa bulletom (uvod je pasus). Izlaz `lunar-texts.csv` → tabela
`lunar_texts` (besplatno za prijavljene). Astrolog piše "u Škorpionu" i ume
"Kuće" umesto "Kuća" — parser oba prihvata. Pregled ih prikazuje u fascikli ☾.

## Kad stigne nova pošiljka

1. Fajlove u odgovarajući folder, **ne menjaj imena** — `izvestaj.py` ih traži
   preko `glob('*.docx')`.
2. `python3 scripts/korpus/izvestaj.py` — vidi koliko se rupa zatvorilo.
3. Proveri da broj parsiranih zapisa odgovara broju naslova u dokumentu. Ako je
   parsirano manje, parser tiho gubi zapise (videti niže).
4. Pogledaj uzorak parsiranog teksta pre uvoza — sirovi XML, odsečene rečenice,
   prazna polja.
5. Uvoz u `transit_texts` ide kao CSV, kroz Supabase. **Nema RLS politike za
   upis** — uvoz radi vlasnik, ne aplikacija.

## Parser — šta je već lomilo i ne sme ponovo

`parse_docx.py` čita XML direktno iz `.docx` zipa. Tri greške su se već desile i
sve tri su **tihe** — parser prođe, vrati manje, niko ne primeti:

1. **Preuzak regex za oznake polja.** Astrolog nije dosledan: "Pozitivan efekat",
   "Pozitivni efekat", omaške ("Pozitnan", "Pozitatan"), razdvajač je nekad
   dvotačka nekad crtica. Prvi pokušaj sa tačnim oblikom izgubio je 260 "Saveta".
   Obrasci su NAMERNO labavi (`Pozit\w*\s+(?:efek\w*|potencijal\w*)`) — ne
   sužavati ih.
2. **Polja razbijena u više pasusa.** Kod Jupitera i Marsa su spojena u jedan
   pasus, kod Saturna u tri odvojena. Zato se gleda ceo blok, ne poslednji pasus.
   Suprotno je izgubilo 50 zapisa.
3. **`<w:t[^>]*>` hvata i `<w:tab>`, `<w:tabs>`, `<w:tblPr>`** — jer je `ab`
   validan `[^>]*`. Kad pasus ima tabulator, zahvat pokupi ceo `<w:pPr>` blok i
   **sirovi XML završi u bazi i na ekranu korisnika.** Mora
   `<w:t(?:\s[^>]*)?>`.

Dodatno, naslov ume da bude nepravilan: reč "natal" ponekad fali, podnaslov
posle crtice ponekad fali. `NASLOV` regex oboje dopušta — ostaviti tako.

4. **Naslov koji regex ne prepozna ne nestaje — zalepi se na PRETHODNI tekst.**
   "Mesec kvadrat natalni Mars", "Merkur u kvadratu sa Neptunom", "MC(om)-",
   "Mecec", "/ podnaslov" — svaki je tiho produžio tekst ispred sebe (Mesec
   opozicija Sunce je progutao ostalih 45 Mesečevih, 131 hiljadu znakova). Zato
   se ime planete prepoznaje po korenu od 4 slova. Provera: broj pasusa koji
   liče na naslov (`planeta + aspekt` na početku, kratki) = broj zapisa.

**Pravilo: svaka izmena parsera prati brojanje pre i posle.** Ako broj zapisa
padne, izmena je pogrešna, ma koliko čistije izgledala.

## Paywall je u bazi, ne u aplikaciji

RLS u `transit-texts.sql`:

- `short` → svaki **prijavljen** korisnik. Neprijavljen ne dobija ništa.
- `long` → samo aktivan red u `entitlements`.

Aplikacija ovo ne može da zaobiđe izmenom koda — server prosto ne pošalje.
Zato se **nikad ne sme dodati politika za upis**, i nikad se ne sme slati pun
tekst pa kriti u UI-ju (pravilo 8 u `CLAUDE.md`).

## Kad tumačenja nema

Tranzit bez teksta **nije kvar**. `daily.tsx` ga prikazuje kao sažet red, ne kao
praznu karticu. Ne dodavati generisan ili popunjavajući tekst — glas u
aplikaciji je astrologov i ničiji drugi.

## Natalna karta (posiljka 27.9.2026)

`files/` u repou (van gita): `Planete u znakovima natal files`, `Planete u
kucama natal files`, `Aspekti planeta`. Jedan pasus po tumacenju, bez kratke
verzije. Sve radi `python3 scripts/korpus/natal.py` — izvestaj, pa
`files/natal-texts.csv` za tabelu `natal_texts` (`supabase/natal-texts.sql`).

- Kljucevi (Ivan, 28.9.2026): `natal.sun.sign.aries`, `natal.sun.house.1`,
  `natal.moon.square.sun` (= `'natal.' + contentKey`, Mesec PRE Sunca kao u
  `BODIES`; Ascendent poslednji). Ne menjati posle uvoza.
- Besplatno: Sunce, Mesec i podznak U ZNAKU (`free = true`), ostalo placeno.
- 19 fajlova je stari `.doc` — cita se preko macOS `textutil`, ne zipfile.
- Svaki kratak red mora biti naslov, ostatak spiska ("Sunce" sam u redu) ili
  "ne postoji" napomena; inace CSV se NE pravi. Putokazi ("pogledati kod
  Sunca", "ako treba kopirati") se preskacu i ne smeju imati tekst.
- Lektura: `files/natal-ispravke.json` (872, 28.9.2026), isti oblik kao
  `ispravke.json`, `verzija: "natal"`; gadja i `subtitle`. Objasnjenje ispod
  napomene "…ne postoje" se odbacuje (bilo je zalepljeno na Mesec kvadrat Sunce).
- Stanje 28.9.2026: znakovi 116/116, kuce 120/120, aspekti 260/260.
  **Podznak u znaku 0/12** — besplatan je, a nema ga. Nema ni aspekata na MC.

## Otvoreno

Tri ključa su u `Sunce tranziti kratki.docx` upisana dvaput (Sunce opozicija
Uran, Sunce opozicija Venera, Sunce sekstil Jupiter). Zadržana je prva verzija.
Vredi proveriti sa astrologom da li su to dva različita teksta.
