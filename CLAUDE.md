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
| Prijava | Supabase Auth, sestocifreni kod na email | SMTP je SendGrid, ne Resend |
| CAPTCHA | Cloudflare Turnstile u WebView-u | stiti `/auth/v1/otp` od zloupotrebe |

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
    celestial-orb.tsx    proceduralno nebesko telo (onboarding)
    turnstile.tsx        CAPTCHA kapija pred slanje koda
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
Rezervno pravilo je GRUBA APROKSIMACIJA i tacno je samo za Srbiju/Jugoslaviju:
nema letnjeg vremena pre 1983, kraj u septembru do 1995, u oktobru od 1996.
Za druge evropske zemlje istorija je drugacija — zato Intl mora da radi, a
rezerva je samo mreza za pad.

RADIJE PRIZNATI NEGO POGADJATI. `isOffsetReliable()` kaze da li za dati
trenutak i zonu uopste znamo pomeraj. Ako ne znamo, karta se NE prikazuje.
Dvaput smo imali istu gresku: kod nije znao pomeraj pa je vratio nesto sto
izgleda tacno, a ascendent je zavrsio u pogresnom znaku bez ijedne poruke.
Pogresna karta je gora od poruke da karta ne moze da se izracuna.
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

**8. Paywall se proverava na serveru.**
`isPremium` dolazi iz tabele `entitlements`, koju korisnik po RLS politici sme
samo da CITA. Upis ide iskljucivo preko RevenueCat webhook-a sa service_role
kljucem na serveru. Da postoji politika za upis, svako bi sebi mogao da upise
`active = true`.
Kad stigne backend: API mora da vraca SKRACEN tekst korisniku bez prava
pristupa — nikad pun tekst pa sakriven u UI-ju.

**9. Anon kljuc je javan, service_role nikad ne sme u aplikaciju.**
`EXPO_PUBLIC_*` promenljive se ugradjuju u bundle i svako moze da ih procita.
Za anon (publishable) kljuc to je u redu — podatke stiti RLS. `service_role`
kljuc zaobilazi RLS i njegovo mesto je iskljucivo na serveru.

**10. Podaci o rodjenju moraju biti izmenjivi.**
Izmena ide kroz `/edit` — SVE na jednom ekranu, ne kroz cetiri koraka.
Onboarding vodi korak po korak jer korisnik tada ne zna sta ga ceka; kod izmene
zna tacno sta menja.

**11. Bez naloga se ne vidi nista.**
`app/index.tsx` je jedina kapija: nema sesije -> welcome, ima sesiju bez karte
-> unos podataka, sve postoji -> tabovi. Nijedan ekran ne sme sam da odlucuje
o preusmeravanju.

**12. Onboarding draft NE ide na disk.**
`store/draft.ts` je namerno bez `persist` — dogovoreno je da prekid znaci
pocetak ispocetka. Karta se upisuje na server odmah po potvrdi koda, da se
podaci ne izgube ako korisnik prekine na koraku sa imenom.

**13. Jedinstveni ID-jevi u SVG gradijentima.**
`url(#id)` se razresava na PRVI element sa tim id-jem u celom dokumentu, a
React Navigation drzi prethodne ekrane montirane (sakrivene, 0x0). Dva SVG-a
sa istim id-jem = vidljivi ostaje bez ispune. Uvek `React.useId()`.

**14. Nekadasnje pravilo — nalog nije uslov — VISE NE VAZI.**
Zid je uveden namerno, ali je postavljen POSLE ekrana sa velikom trojkom —
korisnik prvo vidi vrednost pa se onda trazi nalog. Ne pomerati ga na pocetak.

**15. Dva podesenja u Supabase-u su spregnuta sa kodom.**
Ako se razidju, prijava pada — i to za sve odjednom, tiho.

`Email OTP length` mora biti **6**. Toliko prima `/code` ekran (`LENGTH` u
`code.tsx`), a visak odseca i na `maxLength` i na `slice` — korisnik onda nikad
ne moze da unese osmocifreni kod i dobija "Kod nije tacan". Zatecena vrednost je
bila 8 i tako je i otkriveno.

CAPTCHA prekidac (Authentication -> Attack Protection) se ukljucuje **poslednji**,
tek kad je verzija koja salje `captchaToken` na telefonima. Obrnutim redosledom
svaki `signInWithOtp` vraca `400 captcha_failed`. Prekidac za nuzdu je praznjenje
`EXPO_PUBLIC_TURNSTILE_SITE_KEY` — tada `getToken()` vraca `undefined` i kapije
nema. Token je jednokratan, pa se trazi neposredno pre poziva i nikad se ne cuva.

`react-native-webview` NE trazi dev build — Expo Go ga nosi u sebi. Dev build
ceka samo Apple i Google prijava.

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
- [x] `supabase/schema.sql` pokrenut — tabele postoje, RLS provoren (anon ne vidi tudje redove)
- [ ] Apple i Google prijava — dugmad postoje, ceka dev build. Xcode nije instaliran
      na masini, pa ide ili preko App Store-a ili preko EAS Build-a.
- [x] SMTP (SendGrid) + `{{ .Token }}` u sablonu **Magic Link** — dok je "Confirm
      email" iskljucen, Supabase salje samo taj sablon, "Confirm signup" se ne koristi
- [x] Turnstile — widget, `captchaToken` u oba poziva, provera upaljena u Supabase-u
- [ ] Osobine po znaku od astrologa (`lib/traits.ts`) — 12 x 3 reda, mali posao
- [x] ETL korpusa — 18 .docx fajlova parsirano (`scripts/korpus/parse_docx.py`),
      tekstovi u `transit_texts`. Popunjeno 433/600 kratkih i 443/600 dugih.
- [ ] MESEC — nema nijedan tekst, a jedini menja ton svakog dana. 50 po verziji.
      CEKA astrologa. Spisak: `python3 scripts/korpus/izvestaj.py`
- [ ] Ascendent i MC kao meta — 100 tekstova po verziji. ODLUCENO 23.9.2026:
      ostaju u proracunu, ocekuju se tekstovi. Ako ne stignu, izbaciti ih iz
      `transits.ts`. Dotle nije kvar — `daily.tsx` tranzit bez teksta prikazuje
      kao sazet red, ne kao praznu karticu.
- [ ] RevenueCat: subscription + one-time, entitlement na serveru
- [x] Brisanje naloga u aplikaciji — Edge Function `delete-account` deplojovana,
      dugme u `profile.tsx`. Zatvara Apple zahtev 5.1.1(v). Funkcija koga brise
      cita ISKLJUCIVO iz tokena; anon kljuc je validan JWT i prolazi platformsku
      proveru, pa je `getUser()` u kodu jedina prava kapija — ne uklanjati je.
- [ ] Objaviti `web/` na Cloudflare Pages (`pravila.astroshop.rs`) — popuniti
      podatke o pravnom licu, napraviti aliase, dati pravniku. Vidi `web/README.md`.
      ODLUCENO 23.9.2026: bez `.well-known` fajlova — sajt radi nezavisno od
      aplikacije i link ka `astroshop.rs` NE SME da otvara app.
- [ ] Push notifikacije
- [x] Astroloski font — `assets/fonts/AstroGlyphs.ttf` (5,3 KB), sklopljen iz dva
      Noto izvora jer nijedan sam ne pokriva svih 27 znakova. Postupak i razlozi:
      `assets/fonts/POREKLO.md`. Ako se doda novo telo (cvorovi, Hiron, Lilit),
      font se MORA presloziti — novog znaka u njemu nema.
- [ ] Proveriti kako izgledaju ASC i MC — oni idu kroz `<Glyph>` kao obicna slova
      (`transits.ts:45`), a font nema latinicu, pa ih sistem crta rezervnim fontom.
      Ako odudaraju, prikazivati ih kroz obican `<Text>`.
