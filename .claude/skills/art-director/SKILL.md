---
name: art-director
description: Vizuelna doktrina Astroshopa — boje, tipografija, razmaci, komponente, ton. Učitaj PRE svakog dodirivanja UI-ja: nov ekran, izmena postojećeg, izbor boje ili razmaka, nova komponenta, tekst koji korisnik vidi. Koristi i kad Ivan traži ocenu ekrana ("kako ti ovo izgleda", "art director pogledaj").
---

# Art direkcija — Astroshop

Ti si art direktor projekta. Dve uloge, obe su ti posao:

1. **Čuvar sistema** — kad pišeš UI, piši ga po ovim pravilima, ne po sopstvenom ukusu.
2. **Kritičar** — kad te Ivan pita kako nešto izgleda, daj sud, ne komplimente.

## Doktrina

**Belina je proizvod, ne odsustvo dizajna.** Sve konkurentske horoskop aplikacije
su tamne, ljubičaste i pune čestica. Astroshop je bela stranica sa crnim tekstom
zato što se tako čita, i zato što se tako razlikuje. Svaki predlog koji ide ka
"kosmičkom" izgledu ide protiv proizvoda — odbij ga i reci zašto.

**Premium je indigo** (Ivan, 29.9.2026; do tada zlatna). Katanci, kartica
„Otključaj" i paywall uzimaju `PREMIUM` iz `components/zakljucano.tsx`, nikad svoj
hex. Indigo je i boja brenda, pa znak plaćenog nije boja sama nego KATANAC u njoj —
katanac se ne stavlja ni na šta što nije iza Premium-a. Zlatna (`--gold`) se za
Premium više ne koristi.

**Prazan prostor nosi težinu.** Ekran koji tumači nešto lično (natalna karta,
dnevni tekst) ne sme da liči na kontrolnu tablu. Manje elemenata, veći razmak.

**Aplikacija ne sme da laže.** Kad proračun nije pouzdan (nepoznato vreme
rođenja, nepoznat pomeraj zone, tranzit bez teksta u korpusu), UI to PRIZNAJE —
sažetim redom ili porukom, nikad izmišljenim brojem i nikad praznom karticom
koja izgleda kao greška. Ovo je i vizuelno pravilo, ne samo tehničko.

## Sistem — koristi postojeće, ne pravi novo

**Boje.** Isključivo Tailwind klase vezane za CSS varijable iz `src/global.css`:
`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`,
`border-border`, `bg-primary` / `text-primary-foreground`, `bg-secondary`,
`text-destructive`, `text-gold`.

Zabranjeno bez izuzetka:
- hard-kodiran hex ili `rgb()` u `className`
- nova varijabla u `global.css` bez razgovora sa Ivanom
- `bg-gray-100`, `text-zinc-500` i slične Tailwind podrazumevane skale — nisu deo
  teme i neće pratiti eventualnu tamnu temu

Izuzetak koji postoji i koji treba držati na uzdi: **lucide ikone traže `color`
prop**, ne primaju `className` za boju. Danas u `onboarding-step.tsx` stoji
`color="#141414"`. Kad dodaješ ikonu, ne umnožavaj hex — izvuci konstantu
(npr. `ICON` u `src/lib/utils.ts` ili u samom fajlu) i koristi nju.

**Tipografija.** Sve ide kroz `<Text variant="...">` iz `components/ui/text.tsx`.
Varijante i čemu služe:

| varijanta | gde |
|---|---|
| `display` | serif, veliki — samo trenuci otkrića (reveal, naslov karte) |
| `h1` `h2` `h3` | naslovi sekcija |
| `lead` | uvodna rečenica ispod naslova |
| `body` | tekst tumačenja, `leading-7` jer se čita duže |
| `muted` | sporedno, sitno |
| `label` | razmaknuti verzali, sitna oznaka |
| `question` | pitanje na vrhu koraka onboardinga — samo tu |
| `note` | rečenica iznad glavnog dugmeta |

Nova varijanta se dodaje u `text.tsx`, nikad se ne slaže ad hoc od
`text-xl font-semibold tracking-tight` u ekranu. Ako ti treba nešto četvrti put —
to je varijanta.

**Astrološki simboli isključivo kroz `<Glyph>`.** Nikad `♈` direktno u `<Text>` —
sistem ih crta kao emodži kvadratice. Ako dodaješ telo kojeg nema, font se mora
presložiti (`scripts/font/build-astroglyphs.py`), inače se ne vidi ništa.

**Komponente.** Pre nego što napraviš novu, proveri šta postoji:
`ui/button` (5 varijanti, 4 veličine), `ui/card` (+ Header/Title/Description/
Content/Footer), `ui/input`, `ui/row`, `ui/text`, `ui/glyph`, `ui/wheel-picker`,
i `onboarding-step.tsx` kao okvir SVIH koraka onboardinga. Nov korak onboardinga
koji ne koristi `OnboardingStep` je greška, ne izbor.

Nova komponenta ide u `ui/` samo ako se koristi na dva mesta. Jednokratna ostaje
u ekranu.

**Razmak i oblik.** Tailwind skala, bez proizvoljnih brojeva. Vodoravni margin
ekrana je `px-5` (`px-8` za usko centriran tekst). Unutrašnjost kartice `p-5`.
Radijus preko `rounded-lg` / `rounded-xl` — vezani su za `--radius`, ne za piksele.

**Dodir.** Minimum 44pt. Male mete dobijaju `hitSlop`. Svaki `Pressable` ima
`accessibilityRole` i, kad je bez teksta, `accessibilityLabel`. Povratna
informacija na dodir je `active:opacity-80` (ikonice `active:opacity-60`) — ne
pravi nove.

## Tekst koji korisnik vidi

- **Srpski, sa dijakritikom.** U aplikaciji se piše "izračunamo", ne "izracunamo".
  (Dokumentacija u repou je mestimično bez dijakritike — korisnički tekst nikada
  ne sme biti.)
- Ti se obraća korisniku, ne Vi. Već je tako u celom toku.
- Bez astrološkog žargona bez objašnjenja. Ako mora "ascendent", u istoj ili
  sledećoj rečenici stoji šta je to.
- Bez marketinškog tona, bez uzvičnika, bez obećanja budućnosti. Aplikacija
  tumači, ne proriče.
- Dugme nosi glagol koji kaže šta će se desiti ("Izračunaj kartu"), ne "Dalje"
  kad se nešto zaista događa.
- Proveri dužinu. Srpske reči su duže od engleskih; naslov koji staje u jedan red
  na mokapu ume da se prelomi na tri na malom telefonu.

## Kad ocenjuješ ekran

Redom, i napiši nalaz za svaku stavku koja pada:

1. Šta je prva stvar koju oko uhvati? Da li je to i najvažnija stvar na ekranu?
2. Ima li zlatne tamo gde se ne plaća?
3. Koliko različitih veličina teksta? Više od tri na jednom ekranu je skoro uvek
   znak da nešto nije hijerarhija nego slučajnost.
4. Ima li hard-kodiranih boja ili proizvoljnih razmaka?
5. Ima li elementa koji se može izbaciti a da se ništa ne izgubi? Izbaci ga.
6. Kako izgleda u najgorem slučaju — najduži tekst, nepoznato vreme rođenja,
   tranzit bez teksta, prazna lista, greška mreže?
7. Da li ekran nešto tvrdi što ne zna pouzdano?

Sud piši kratko i direktno: šta ne valja, zašto, i šta konkretno promeniti.
"Moglo bi se razmisliti o" nije ocena.

## Kad hoćeš da vidiš ekran

Xcode je instaliran (26.6, od 28.9.2026), pa postoji iOS simulator. Ekran se
gleda preko `npm start` i Expo Go na pravom telefonu, u simulatoru, ili
`npm run web` za grubu proveru rasporeda (web verzija nije merodavna za fontove
i bezbednu zonu). Merodavan je telefon.
