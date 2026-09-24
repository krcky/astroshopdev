---
name: qa-telefon
description: Provera aplikacije na pravom telefonu — koji tokovi se prolaze, koji rubni slučajevi se namerno izazivaju, i kako se izveštava šta je provereno a šta nije. Učitaj pre nego što kažeš da nešto "radi", posle izmene bilo kog ekrana, i pre svakog EAS build-a.
---

# Provera na telefonu

## Zašto ovaj skill postoji

**Xcode nije instaliran** na mašini (samo Command Line Tools, nema Homebrew ni
CocoaPods). iOS simulator ne radi, `expo run:ios` ne prolazi. Jedini pravi
uređaj za proveru je **Ivanov telefon**.

Posledica: **ja ne mogu sam da proverim UI.** Moj posao je da pripremim tačan,
kratak spisak koraka i da posle jasno razdvojim **šta je provereno** od **šta
nije**. Nikad ne pisati "radi" za nešto što nije viđeno na telefonu.

## Kako se pokreće

```bash
npm start
```

pa Expo Go na telefonu. `npm run web` je dobar **samo** za grubu proveru
rasporeda i logike — fontovi, bezbedna zona, gestovi i native moduli se na webu
ne ponašaju isto.

Posle izmene u `babel.config.js` ili `metro.config.js` keš se **mora** obrisati:
`npx expo start -c`.

## Tok koji se prolazi cele — kad se dira onboarding ili prijava

`welcome → date → time → place → reveal → account → code → name → push → tabovi`

1. **Prekid usred toka.** `store/draft.ts` je namerno bez `persist` — ubij
   aplikaciju na koraku `place` i vrati se. Mora da počne **ispočetka**, ne da
   nastavi. Ako nastavlja, neko je dodao persist.
2. **Kapija.** `app/index.tsx` je jedino mesto koje odlučuje gde korisnik ide:
   nema sesije → welcome; ima sesiju bez karte → unos; sve postoji → tabovi.
   Proveri sva tri ulaza, i to **posle restarta aplikacije**, ne samo navigacijom.
3. **Kod stiže i prolazi.** Šestocifren. Unesi pogrešan pa tačan.
4. **Zid je posle vrednosti.** Nalog se traži tek posle ekrana sa velikom
   trojkom (pravilo 14). Ako se traži ranije, greška je.
5. **Karta se upisuje na server odmah po potvrdi koda** — prekini na koraku
   `name` i vrati se; podaci o rođenju moraju biti tu.

## Rubni slučajevi koji se namerno izazivaju

Ovo je deo koji se najčešće preskoči, a upravo tu aplikacija ume da **slaže**:

- **Nepoznato vreme rođenja** (ostavi prazno) → Whole Sign, `timeUnknown`, i UI
  mora da **prizna** da ascendent nije pouzdan. Ne sme prikazati broj kao da je
  siguran.
- **Tranzit bez teksta u korpusu** → sažet red, **ne** prazna kartica. Danas
  fale svi tekstovi za Mesec i za ASC/MC, pa se ovo vidi svakog dana.
- **Prazna lista** (dan bez jakih tranzita).
- **Nema mreže** — uključi avionski režim i uđi u `daily`, `chart`, `sky`.
- **Najduži mogući tekst** — dugačko ime, dugačko ime grada, dugačko tumačenje.
  Srpske reči lome red tamo gde engleske ne bi.
- **Grad iz dijaspore** (koordinate i zona dolaze iz tabele `cities`) — karta mora
  da se izračuna i bez mreže, jer se čuvaju uz profil.
- **Izmena podataka o rođenju** kroz `/edit` — sve na jednom ekranu, i karta se
  mora promeniti posle snimanja.
- **Promena mesta posmatranja** u `/sky-place` — menjaju se uglovi i kuće, a
  pozicije planeta **ne** (geocentrične su). Ako se pozicije promene, to je kvar.
- **Pomeranje vremena** na ekranu "Trenutno na nebu" — čim se pomeri, minutno
  osvežavanje staje i naslov se menja u "Nebo u izabranom trenutku".
- **Prelazak preko ponoći** i **dan sa promenom letnjeg/zimskog vremena**.

## Vizuelno

- Mali telefon (SE) i veliki. Prelom teksta i bezbedna zona.
- **Astrološki simboli** — ako se vidi obojena kvadratica, znak ne ide kroz
  `<Glyph>` ili ga nema u `AstroGlyphs.ttf`.
- ASC i MC prolaze kroz `<Glyph>` kao obična slova, a font nema latinicu —
  proveri da li odudaraju (otvorena stavka u `CLAUDE.md`).
- Zlatna boja sme da se pojavi **samo** na plaćenom sadržaju.
- Tastatura ne sme da pokrije polje ni glavno dugme.
- Dva ekrana sa SVG gradijentima jedan za drugim — React Navigation drži
  prethodne montirane, pa se sudar `url(#id)` vidi kao element **bez ispune**
  (pravilo 13, `React.useId()`).

## Šta se ne može proveriti u Expo Go

Reci to otvoreno umesto da zvuči završeno:

- Apple i Google prijava — traže dev build
- Push notifikacije — plugin nije ni dodat u `app.json`
- RevenueCat / kupovine — nije integrisan
- Ponašanje u release bildu (dev prekidač `store/dev.ts` je tamo ugašen)

`react-native-webview` **radi** u Expo Go (pinovan na 13.16.1 za SDK 57), pa se
Turnstile može proveriti bez dev build-a.

## Kako se izveštava

Uvek u dva dela:

**Provereno:** korak po korak, na kom uređaju, sa ishodom.
**Nije provereno:** šta i zašto (nema dev build, nema naloga, traži pravu kupovinu).

Uz to, za svaku izmenu koja dira `src/lib/`: koja provera iz `npm run check` je
prošla i sa kojim odstupanjem.
