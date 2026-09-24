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

## Stanje (24.9.2026)

- 433/600 kratkih, 443/600 dugih.
- **Mesec: nula tekstova.** Najveća rupa. Mesec obiđe zodijak za 28 dana i
  jedini menja ton *svakog dana* — bez njega dnevni horoskop nema ono što ga
  čini dnevnim. Treba 50 po verziji (5 aspekata × 10 natalnih planeta).
- **Ascendent i MC kao meta: 100 po verziji.** Odlučeno 23.9.2026. da ostaju u
  proračunu i da se tekstovi očekuju. Ako ne stignu — izbaciti ih iz
  `transits.ts`, ne ostavljati ih da vise.
- Ne piše se: `pluto.conjunction.pluto` (248 godina) i
  `neptune.conjunction.neptune` (165 godina). Stoje u `NEMOGUCE` u `izvestaj.py`.

Kad ti treba tačan broj — **pokreni `izvestaj.py`, ne prepisuj ove brojeve.**
Izveštaj se računa iz samih `.docx` fajlova, pa je uvek tačan.

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

## Otvoreno

Tri ključa su u `Sunce tranziti kratki.docx` upisana dvaput (Sunce opozicija
Uran, Sunce opozicija Venera, Sunce sekstil Jupiter). Zadržana je prva verzija.
Vredi proveriti sa astrologom da li su to dva različita teksta.
