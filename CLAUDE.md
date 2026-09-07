# Astroshop

Mobilna aplikacija za horoskop (iOS + Android), Expo + React Native.

## Stack

| Sloj | Izbor | Napomena |
|---|---|---|
| App | Expo SDK 57, RN 0.86, React 19, Expo Router | pravi native buildovi, ne WebView |
| Styling | NativeWind 4.2 (Tailwind 3.4) | Tailwind v4 jos NIJE podrzan u stabilnom NativeWind-u |
| Komponente | React Native Reusables pattern | copy-paste u `src/components/ui`, kod je nas |
| Ephemeris | `astronomy-engine` (MIT) | lokalno racunanje, bez API-ja i bez troska |
| Data | TanStack Query + Zustand | |
| Placanja | RevenueCat (jos nije integrisan) | IAP je obavezan za digitalni sadrzaj |

## Struktura

```
src/
  app/
    index.tsx        KAPIJA — jedino mesto koje odlucuje gde korisnik ide
    edit.tsx         izmena podataka o rodjenju (sve na jednom ekranu)
    (onboarding)/    welcome, date, time, place, reveal, account, code, name, push
    (tabs)/          home (pregled dana), daily, chart, profile
  components/
    onboarding-step.tsx  zajednicki okvir svih koraka
    natal-wheel.tsx      SVG tocak natalne karte
    celestial-orb.tsx    proceduralno nebesko telo
    ui/                  text, button, card, input, glyph, wheel-picker
  store/
    draft.ts         onboarding pre naloga — BEZ persist (prekid = ispocetka)
    profile.ts       podaci o rodjenju, kes servera
    auth.ts          sesija + pravo pristupa
  lib/
    zodiac.ts        12 znakova, longituda -> znak
    astro.ts         ephemeris + aspekti        <- engine
    natal.ts         ASC, MC, Placidus kuce     <- engine
    transits.ts      tranziti na natalnu kartu  <- personalizacija
    timezone.ts      lokalno vreme -> UTC
    wheel.ts         geometrija tocka (cista, bez RN uvoza)
    cities.ts        ugradjena lista gradova
    traits.ts        osobine po znaku — PRIVREMENO, ceka astrologa
    horoscope.ts     composer                   <- ovde ulazi korpus
    supabase.ts      klijent
    sync.ts          profil <-> server
supabase/
  schema.sql         tabele + RLS politike
scripts/
  check-*.ts         provere tacnosti
```

## Pravila koja se ne krse

**1. Longitude su uvek u ECT (prava ekliptika datuma).**
`astro.ts` koristi `Rotation_EQJ_ECT`. NIKAD ne koristiti `Astronomy.Ecliptic()` —
on vraca J2000 koordinate, sto danas odstupa ~0.36 stepeni zbog precesije i
pomerilo bi svaku poziciju u aplikaciji. Provera: `npm run check:ephemeris`
(Sunce mora biti na 0/90/180/270 na ravnodnevicama i solsticijima).

**2. Tema je bela sa crnim tekstom.**
Sve boje su CSS varijable u `global.css` pod `:root`. Zlatna (`--gold`) se
koristi ISKLJUCIVO kao akcenat na placenom sadrzaju — nigde drugde, da paywall
ostane jedina stvar koja "svetli" na stranici. Tamna tema je i dalje definisana
pod `.dark:root` ako je ikad budemo ponudili kao opciju; `_layout.tsx` je
zakljucan na `colorScheme.set('light')`.

**3. Simboli idu iskljucivo kroz `<Glyph>`.**
Unicode astroloski znaci (♈ ♃ ☽) imaju podrazumevanu EMOJI prezentaciju i
sistem ih renderuje kao obojene kvadratice. `components/ui/glyph.tsx` forsira
tekstualni font. Nikad ne stavljati simbol direktno u `<Text>`.

**4. Vreme rodjenja mora u UTC preko `timezone.ts`.**
Zemlja se okrene 15°/h — greska od sat vremena pomeri ascendent za pola znaka.
Zimsko/letnje vreme se racuna ZA DATUM RODJENJA. Nikad ne koristiti
`new Date(...)` sa lokalnim vremenom direktno.

**5. Bez tacnog vremena rodjenja nema Placidusa.**
`resolveProfile` automatski prelazi na Whole Sign i postavlja `timeUnknown`.
UI mora da prizna da ascendent nije pouzdan umesto da prikaze izmisljen broj.

**6. Cista matematika ide u `lib/`, nikad u komponentu.**
`wheel.ts` je izdvojen iz `natal-wheel.tsx` bas zato: cim nesto uveze
`react-native`, ne moze da se testira u Node-u. Ako pises geometriju ili
racun — ide u `lib/` i dobija test.

**7. Korpus astrologa nikad ne ide na klijenta.**
`horoscope.ts` sada ima stub `CORPUS` u kodu. U produkciji je to Postgres
tabela i composer se izvrsava NA SERVERU; app dobija samo gotov tekst za taj
dan. Korpus je jedina stvar koju konkurencija ne moze da kopira.

**8. @firecms/neat nosi VODENI ZIG i licencu vezanu za domen.**
Biblioteka je ugradjena u `src/vendor/neat-umd.ts` i vrti se u WebView-u.
Bez placenog kljuca crta zig "NEAT" u svaki kadar:
`this._licensed || this._renderWatermark(n)`. Kljuc se izdaje za DOMEN
(`LicensePayload { domain, email }`, provera preko `window.location.hostname`),
a mobilna aplikacija domen nema. U kodu postoji izuzetak za razvojne hostove
koji bi u WebView-u prosao — NE oslanjati se na to, jer je to zaobilazenje
naplate. Pre izlaska: ili dogovor sa autorima, ili zamena sopstvenim sejderom
(`components/flow-gradient.tsx` je zapoceta osnova, radi kroz expo-gl bez
ikakve licence).

**9. Paywall se proverava na serveru.**
`isPremium` dolazi iz tabele `entitlements`, koju korisnik po RLS politici sme
samo da CITA. Upis ide iskljucivo preko RevenueCat webhook-a sa service_role
kljucem na serveru. Da postoji politika za upis, svako bi sebi mogao da upise
`active = true`.
Kad stigne backend: API mora da vraca SKRACEN tekst korisniku bez prava
pristupa — nikad pun tekst pa sakriven u UI-ju.

**10. Anon kljuc je javan, service_role nikad ne sme u aplikaciju.**
`EXPO_PUBLIC_*` promenljive se ugradjuju u bundle i svako moze da ih procita.
Za anon (publishable) kljuc to je u redu — podatke stiti RLS. `service_role`
kljuc zaobilazi RLS i njegovo mesto je iskljucivo na serveru.

**11. Podaci o rodjenju moraju biti izmenjivi.**
Izmena ide kroz `/edit` — SVE na jednom ekranu, ne kroz cetiri koraka.
Onboarding vodi korak po korak jer korisnik tada ne zna sta ga ceka; kod izmene
zna tacno sta menja.

**12. Bez naloga se ne vidi nista.**
`app/index.tsx` je jedina kapija: nema sesije -> welcome, ima sesiju bez karte
-> unos podataka, sve postoji -> tabovi. Nijedan ekran ne sme sam da odlucuje
o preusmeravanju.

**13. Onboarding draft NE ide na disk.**
`store/draft.ts` je namerno bez `persist` — dogovoreno je da prekid znaci
pocetak ispocetka. Karta se upisuje na server odmah po potvrdi koda, da se
podaci ne izgube ako korisnik prekine na koraku sa imenom.

**14. Jedinstveni ID-jevi u SVG gradijentima.**
`url(#id)` se razresava na PRVI element sa tim id-jem u celom dokumentu, a
React Navigation drzi prethodne ekrane montirane (sakrivene, 0x0). Dva SVG-a
sa istim id-jem = vidljivi ostaje bez ispune. Uvek `React.useId()`.

**14. Nekadasnje pravilo — nalog nije uslov — VISE NE VAZI.**
Zid je uveden namerno, ali je postavljen POSLE ekrana sa velikom trojkom —
korisnik prvo vidi vrednost pa se onda trazi nalog. Ne pomerati ga na pocetak.

## Kanonski kljucevi sadrzaja

`findAspects()` generise `contentKey` u formatu `telo.aspekt.telo`, npr.
`mars.square.saturn`. Redosled tela prati `BODIES` niz da bi kljuc bio
deterministican. Ovi kljucevi su primarni kljuc u bazi tekstova — **ne menjati
ih posle prvog importa korpusa.**

## Komande

```
npm start                 dev server (Expo Go / dev client)
npm run web               web verzija (react-native-web)
npm run check             SVE provere odjednom  <- pusti ovo pre commita
npm run typecheck         TypeScript
npm run check:ephemeris   pozicije planeta
npm run check:natal       ascendent, MC, Placidus kuce, tranziti
npm run check:timezone    vreme rodjenja -> UTC
```

## Jos nije uradjeno

- [x] Auth (Supabase) — registracija, prijava, odjava, sinhronizacija profila
- [ ] POKRENUTI `supabase/schema.sql` u Supabase SQL Editoru (bez toga nema tabela)
- [ ] Apple i Google prijava — dugmad postoje, logika ceka dev build (native moduli)
- [ ] SMTP (Resend) + `{{ .Token }}` u Supabase email sablonu — bez toga kod ne stize
- [ ] Osobine po znaku od astrologa (`lib/traits.ts`) — 12 x 3 reda, mali posao
- [ ] Backend + Postgres, ETL korpusa od 800 strana. CEKA: format dokumenata.
- [ ] RevenueCat: subscription + one-time, entitlement na serveru
- [ ] Push notifikacije
- [ ] Pravi astroloski font umesto sistemskog (vidi `glyph.tsx`)
