---
name: copywriter-sr
description: Srpski tekst u aplikaciji — ton, obraćanje, dijakritika, astrološki pojmovi za laika, dužina na malom ekranu, poruke o grešci i praznim stanjima. Učitaj kad pišeš ili menjaš bilo koji tekst koji korisnik vidi: naslov, dugme, pitanje u onboardingu, objašnjenje, poruku o grešci, tekst na paywallu, opis u prodavnici.
---

# Srpski tekst u Astro Shopu

Publika je **srpska i laička** — nije astrološka zajednica. Većina ne zna šta je
ascendent ni kuća, a aplikacija ih računa i prikazuje.

## Pravopis

- **Sa dijakritikom, uvek.** "izračunamo", ne "izracunamo". (Dokumentacija u repou je mestimično
  bez dijakritike — korisnički tekst nikada ne sme biti.)
- **Ekavica.** "vreme", "mesto", "gde".
- Latinica.
- Datumi: "24. septembar", mala slova za mesece i dane (`horoscope.ts` već tako
  formatira, prvo slovo se velikim samo na početku rečenice).

## Obraćanje i ton

- **Ti**, ne Vi. Tako je u celom toku, ne mešati.
- Aplikacija **tumači, ne proriče**. Bez "čeka te", "sudbina ti donosi",
  "spremi se za". Tranzit je opis stanja neba, ne najava događaja.
- **Bez marketinga i bez uzvičnika.** Nema "Otkrij tajne svoje ličnosti!".
- **Bez laskanja korisniku.** Ne "sjajan izbor", ne "odlično".
- Kratke rečenice. Tekst tumačenja je astrologov i ima svoj ton — sve **oko**
  njega (UI tekst) mora biti tiše od njega, nikad glasnije.

## Astrološki pojmovi

Pravilo: **pojam sme da se upotrebi tek kad je objašnjen**, u istoj ili sledećoj
rečenici, jednom kratkom rečenicom bez žargona.

> Ascendent je znak koji se dizao na istoku u trenutku tvog rođenja.

Ne objašnjavati dvaput na istom ekranu. Ne praviti rečnik pojmova umesto da tekst
bude razumljiv na mestu gde stoji.

Srpski nazivi tela i aspekata su već ustaljeni u projektu — koristi iste:
Sunce, Mesec, Merkur, Venera, Mars, Jupiter, Saturn, Uran, Neptun, Pluton;
konjunkcija, sekstil, kvadrat, trigon, opozicija; Ascendent, MC, čvor, Lilit,
Tačka sreće.

## Dugmad

Glagol koji kaže **šta će se desiti**:

| Umesto | Piši |
|---|---|
| Dalje (kad se nešto zaista računa) | Izračunaj kartu |
| Nastavi | Pošalji kod |
| OK | Razumem / Zatvori |
| Submit, Continue, Restore | nikad engleski |

"Dalje" je u redu samo kad je korak zaista samo korak.

"Vrati kupovine" je obavezan tekst za Restore dugme na paywallu (Apple).

## Dužina

Srpske reči su duže od engleskih — "Get" je tri slova, "Preuzmi" sedam. Naslov
koji staje u jedan red u glavi ume da se prelomi na tri na malom telefonu.

- Naslov ekrana: do ~30 znakova.
- Tekst dugmeta: do ~20 znakova, jedna reč je najbolje.
- `question` varijanta (razmaknuti verzali u onboardingu) je **najskuplja** —
  `tracking-[3px]` i verzali troše mnogo širine. Do ~28 znakova.
- Kad nisi siguran, napiši i dužu i kraću varijantu i reci koju preporučuješ.

## Poruke o grešci i prazna stanja

Tri stvari, tim redom: **šta se desilo → zašto → šta korisnik može.**

Bez krivice korisnika, bez tehničkih izraza (`400`, `token`, `captcha_failed`),
bez izvinjavanja u dve rečenice.

> Kod nije tačan. Proveri da li si uneo svih šest cifara, ili zatraži nov.

Posebno za ovaj projekat — **poruka mora da prizna neznanje kad ga ima**:

- nepoznato vreme rođenja → reći da ascendent nije pouzdan, ne prikazati broj
- nepoznat pomeraj zone → karta se ne prikazuje, i kaže se zašto
- tranzit bez teksta u korpusu → sažet red, **ne** prazna kartica i **ne**
  izmišljen tekst

## Šta se ne piše

- **Nikad ne pisati tumačenja.** Glas tumačenja je astrologov. Generisan
  astrološki tekst u ovoj aplikaciji je proizvodna greška, ne pomoć. (Stub od
  pet pasusa je već jednom stajao u `horoscope.ts` i izbačen je baš zato što je
  ostavljao utisak da je glas astrologa.)
- Bez obećanja ishoda, bez zdravstvenih i finansijskih saveta — i u UI tekstu i
  u korpusu (Apple smernice, deo 6 u `APPLESTORE.md`).
- Bez pominjanja praćenja, analitike ili personalizacije preko ponašanja — toga
  nema.

## Postojeći tekst kao referenca

Pre nego što napišeš nov tekst, pogledaj kako je već rešeno na sličnom mestu:
`src/app/(onboarding)/` za tok, `onboarding-step.tsx` za `PRIVACY_NOTE`,
`(tabs)/daily/index.tsx` i `profile.tsx` za tekst oko sadržaja. Doslednost je važnija
od toga da je nova formulacija malo lepša.
