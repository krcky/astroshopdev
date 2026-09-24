---
name: astro-tacnost
description: Tačnost astrološkog proračuna — ECT a ne J2000, ascendent i Placidus, pravi čvor i srednji Lilit, vreme rođenja u UTC, orbite tranzita, i provere `npm run check:*`. Učitaj PRE svake izmene u `src/lib/astro.ts`, `natal.ts`, `points.ts`, `transits.ts`, `timezone.ts`, `sky.ts`, `wheel.ts` i pre dodavanja novog tela ili tačke.
---

# Tačnost proračuna

Ovo je jedini deo aplikacije gde se **greška ne vidi**. Pogrešan ascendent
izgleda potpuno isto kao tačan — broj je i dalje broj, znak je i dalje znak.
Zato se ovde ništa ne menja "na oko" i ništa se ne tvrdi bez provere.

**Načelo iznad svih: radije priznati nego pogađati.** Ako se nešto ne zna
pouzdano, aplikacija to kaže. Pogrešna karta je gora od poruke da karta ne može
da se izračuna — to se već dvaput desilo i oba puta prošlo nezapaženo.

## 1. Koordinatni sistem — ECT, nikad J2000

Sve longitude su u **ECT: prava ekliptika datuma** (true equinox of date). To je
referentni okvir tropskog zodijaka, koji koristi zapadna astrologija.

```ts
const eqj = Astronomy.GeoVector(body, time, true);        // true = aberacija
const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), eqj);
```

**Nikad `Astronomy.Ecliptic()`** — vraća J2000, što danas odstupa ~0,36° zbog
precesije. To pomera *svaku* poziciju u aplikaciji. Isto važi za `points.ts`.

Provera: `npm run check:ephemeris` — Sunce mora biti na 0/90/180/270 na
ravnodnevicama i solsticijima, tolerancija 0,02°.

## 2. Vreme rođenja

Zemlja se okrene **15°/h**. Greška od sata pomeri ascendent za pola znaka;
greška od 4 minuta pomeri ga za 1°.

- Konverzija ide isključivo kroz `timezone.ts` → `localBirthToUtc()`.
  **Nikad `new Date(...)` sa lokalnim vremenom.**
- Letnje/zimsko računa se **za datum rođenja**, ne za danas.
- `hasFullIntl` ne proverava da li poziv prolazi nego da li daje **tačan**
  rezultat (Beograd jul = +120, januar = +60). Hermes na nekim Android
  uređajima prihvati opciju a vrati beskorisno — takav runtime mora da padne na
  eksplicitno pravilo, ne da tiho greši.
- Rezervno pravilo je **gruba aproksimacija, tačna samo za Srbiju/Jugoslaviju**:
  nema letnjeg vremena pre 1983, kraj u septembru do 1995, u oktobru od 1996.
  Za druge evropske zemlje istorija je drugačija.
- `isOffsetReliable()` kaže da li za dati trenutak i zonu uopšte znamo pomeraj.
  **Ako ne znamo — karta se NE prikazuje.**

Provera: `npm run check:timezone`.

## 3. Kuće i uglovi

- RAMC, MC i ascendent su u `natal.ts`, u istom ECT sistemu kao pozicije — inače
  se ne bi smeli porediti.
- **Placidus se raspada iznad ~66,5° geografske širine** (tačke nikad ne
  izlaze/zalaze). Tada se automatski pada na Whole Sign i to **mora biti
  označeno u rezultatu**, ne prećutano.
- **Bez tačnog vremena rođenja nema Placidusa.** `resolveProfile` prelazi na
  Whole Sign i postavlja `timeUnknown`. UI mora da prizna da ascendent nije
  pouzdan umesto da prikaže izmišljen broj.
- Placidus međukuspide (11, 12, 2, 3) nemaju zatvorenu formu — rešavaju se
  iterativno. Ne "pojednostavljivati" to u formulu.

Provera: `npm run check:natal` (Beograd, 15.6.1990. 14:30 CEST).

## 4. Izvedene tačke — konvencije su izabrane, ne pretpostavljene

U `points.ts`, **namerno odvojeno od `BODIES`**:

| Tačka | Konvencija | Zašto |
|---|---|---|
| Severni čvor | **PRAVI** (oskulirajući, iz vektora ugaonog momenta `H = r × v`) | srednji odstupa i do 1,8°; astro.com i astro-seek prikazuju pravi |
| Lilit | **SREDNJI** apogej | pravi skače i do 30° |
| Tačka sreće | dnevna/noćna formula | zavisi od ascendenta, menja se sa mestom posmatranja |

- Čvor se računa u EQJ pa se **tek `H` rotira** u ekliptiku datuma. Da se svaka
  pozicija posebno rotirala, u brzinu bi ušlo i okretanje koordinatnog sistema.
- Oznaka **"R" na čvoru se RAČUNA** — pravi čvor po nekoliko dana mesečno ide
  napred. Ne hardkodirati je.
- **Ne dodavati ih u `BODIES`** (pravilo 16). Ušle bi u natalnu kartu svakog
  korisnika, u `findAspects()` i u dnevne tranzite — a korpus za njihove aspekte
  nema nijedan tekst, pa bi `daily.tsx` dobio gomilu sažetih redova bez
  tumačenja. Za sada se samo **prikazuju**, na ekranu "Trenutno na nebu".
- **Kiron** nije ni telo iz `astronomy-engine` ni geometrijska tačka — treba mu
  zasebna efemerida. I font se mora presložiti, ⚷ u njemu ne postoji.

Provera: `npm run check:sky` — referenca su vrednosti sa astro-seek-a za
23.9.2026. nad Beogradom, zakovano na 22:00 UTC (sajt je ispisao 23:00 ali je
računao po zimskom vremenu; poklapa se tek na 22:00).

## 5. Tranziti

- Orbite su **uže nego kod natalnih aspekata**: 3° (sekstil 2°), naspram 6—8° za
  natalne. Natalni aspekt traje ceo život; tranzit opisuje **jedan dan** — preko
  ~3° prestaje da bude događaj i postaje pozadina. Ne širiti orbite da bi se
  dobilo više sadržaja.
- Težine (`TRANSIT_WEIGHT`, `NATAL_WEIGHT`) su izbor uređivanja, ne astronomija.
  Menjaju se svesno i menjaju redosled na ekranu.
- Pozicije tela su **geocentrične** i sa mestom posmatranja se **ne menjaju**.
  Menjaju se uglovi, kuće i dnevna/noćna formula za Tačku sreće.

## 6. Higijena koda

- **Čista matematika ide u `src/lib/`, nikad u komponentu** (pravilo 6). Čim
  fajl uveze `react-native`, ne može da se testira u Node-u. `wheel.ts` je zato
  izdvojen iz `natal-wheel.tsx`.
- **Svaki nov račun dobija proveru u `scripts/check-*.ts`.** Provera bez
  referentne vrednosti iz spoljnog izvora (astro-seek, `Astronomy.Seasons`)
  dokazuje samo da kod radi ono što kod radi.
- Mesec rođenja u `BirthData` je pravi mesec (1—12); `Date.UTC` traži 0—11.
  Ta greška je tiha i pomeri kartu za mesec dana.

## 7. Pre nego što kažeš da radi

```bash
npm run check
```

Pokreće typecheck + ephemeris + natal + timezone + sky + cities.

**U odgovoru navedi koja provera je prošla i sa kojim odstupanjem.** "Trebalo bi
da radi" nije prihvatljivo za ovaj deo koda. Ako provera pada, reci da pada i
prikaži izlaz — nemoj podešavati toleranciju da bi prošla.
