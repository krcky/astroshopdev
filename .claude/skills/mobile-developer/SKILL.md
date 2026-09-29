---
name: mobile-developer
description: Zanat Expo / React Native-a na ovom projektu — šta u SDK 57 radi a šta ne, Expo Go naspram dev build-a, NativeWind 4, Reanimated 4 worklets, navigacija i montirani ekrani, stanje i keš, i šta se MORA proveriti pre commita. Učitaj pre pisanja ili izmene bilo kog koda u `src/`, i kad nešto radi na webu a pada na telefonu.
---

# Mobile developer — Astroshop

Poslovna pravila i arhitektura su u `CLAUDE.md` (17 pravila koja se ne krše).
Ovde je ono što `CLAUDE.md` ne pokriva: zanat platforme i redosled poteza.

**Pre bilo kakve izmene pročitaj `CLAUDE.md`.** Ako se nešto ovde kosi sa njim,
`CLAUDE.md` je jači.

## Stanje mašine — proveri pre nego što obećaš

- **Xcode JE instaliran** (26.6, iOS 26.5 SDK; od 28.9.2026), uz Homebrew i
  CocoaPods. iOS simulator postoji (iOS 18.6 i 26.5). Folder `ios/` je proizvod
  prebuild-a, gitignorisan je — pravi se iznova sa
  `npx expo prebuild --platform ios --clean`.
- **Plaćenog Apple naloga NEMA.** Svakodnevni razvoj i dalje ide kroz
  **`npm start` + Expo Go na pravom telefonu**. Build za prodavnicu i TestFlight
  ide preko **EAS Build-a** i čeka nalog.
- Instalacija na telefon preko besplatnog Apple ID-a (Personal Team) radi, uz tri
  obavezne izmene u Xcode-u: build u **Release** konfiguraciji (Debug traži Mac
  sa serverom), Bundle Identifier **`com.krcky.astroshop.test`** (pravi ostaje
  slobodan za plaćeni nalog) i **obrisana "Push Notifications"** mogućnost
  (dodaje je `expo-notifications`, besplatni tim je ne podržava i potpisivanje
  pada). Aplikacija ističe posle 7 dana, najviše 3 takve po telefonu. Posle
  `prebuild --clean` izmene se ponavljaju.
- `npm run web` je dobar samo za grubu proveru rasporeda i logike. Fontovi,
  bezbedna zona, gestovi i native moduli se na webu ne ponašaju isto — nikad ne
  tvrdi da nešto radi zato što radi na webu.

## Expo Go naspram dev build-a

Pre nego što dodaš paket, proveri da li ga Expo Go nosi u sebi. Ako ne nosi,
dodavanje ODMAH lomi Ivanov tok razvoja jer dev build još ne postoji.

- `react-native-webview` Expo Go NOSI (pinovan na 13.16.1 za SDK 57) — Turnstile
  zato radi bez dev build-a.
- Dev build danas čeka samo Apple i Google prijavu. Ne uvoditi još jedan razlog.
- Verzije paketa koje Expo pinuje ne diži ručno. `npx expo install` bira verziju
  za SDK 57; `npm install` ume da povuče nespojivu.

## NativeWind 4.2 (Tailwind 3.4)

- **Tailwind v4 nije podržan** u stabilnom NativeWind-u. Ne migrirati.
- `className` radi na RN komponentama, ali NE na svemu — SVG elementi
  (`react-native-svg`), lucide ikone i neki `@expo/ui` elementi primaju propove,
  ne klase. Za njih se boja uzima iz konstante, ne iz hexa u letu.
- Kod kontejnera sa sadržajem koristi `contentContainerClassName` (ScrollView),
  ne `className` — to je česta tiha greška, stil se primeni na pogrešan sloj.
- Klase se razrešavaju u vreme gradnje iz `content` šablona u `tailwind.config.js`
  (`./src/**/*.{js,jsx,ts,tsx}`). **Dinamički sklopljeno ime klase
  (`` `text-${boja}` ``) NE postoji u bundle-u.** Piši pune klase i biraj granama,
  ili preko `cva` varijante.
- Spajanje klasa ide kroz `cn()` (`clsx` + `tailwind-merge`), nikad ručnom
  konkatenacijom.

## Expo Router

- **Ekrani ostaju montirani.** React Navigation drži prethodne ekrane živim
  (sakrivene, 0x0). Posledice koje su nas već koštale:
  - `url(#id)` u SVG gradijentu razrešava se na PRVI element tog id-ja u celom
    dokumentu — uvek `React.useId()` (pravilo 13 u `CLAUDE.md`).
  - Intervali, `setTimeout` i pretplate na montiranom a nevidljivom ekranu i
    dalje rade. Veži ih za `useFocusEffect`, ne za `useEffect`, kad treba da
    stanu kad se ekran napusti.
- **`src/app/index.tsx` je jedina kapija.** Nijedan drugi ekran ne sme sam da
  odlučuje o preusmeravanju (pravilo 11).
- Grupe `(onboarding)` i `(tabs)` ne ulaze u putanju. Preusmeravaj na konkretan
  ekran, ne na grupu.

## Reanimated 4 / worklets

- Animacija ide na UI niti. Sve što worklet dodiruje mora biti shared value ili
  `runOnJS`. Običan state u worklet-u je tiha greška.
- `react-native-worklets` je zaseban paket u SDK 57 — plugin mora ostati poslednji
  u `babel.config.js`.
- Kad menjaš `babel.config.js` ili `metro.config.js`, keš se mora obrisati:
  `npx expo start -c`. Bez toga se izmena ne vidi i gubi se sat vremena.

## Stanje

- **Zustand** za stanje koje živi (`store/`), **TanStack Query** za sve što dolazi
  sa servera. Ne drži serverske podatke u Zustand-u ručno.
- `store/draft.ts` je NAMERNO bez `persist` — prekid onboardinga znači početak
  ispočetka (pravilo 12). Ne dodavati persist.
- Sesija ide u `expo-secure-store`, ne u `AsyncStorage`.
- `EXPO_PUBLIC_*` promenljive završavaju u bundle-u i svako ih može pročitati.
  `service_role` ključ NIKADA ne sme u aplikaciju (pravilo 9).

## Račun i tačnost

- Čista matematika ide u `src/lib/`, nikad u komponentu — čim fajl uveze
  `react-native`, ne može da se testira u Node-u (pravilo 6). `wheel.ts` je
  izdvojen iz `natal-wheel.tsx` baš zbog toga.
- Svaki nov račun dobija proveru u `scripts/check-*.ts`.
- Vreme rođenja uvek kroz `timezone.ts`. Nikad `new Date(...)` sa lokalnim
  vremenom. Ako pomeraj zone nije pouzdan, karta se NE prikazuje — radije
  priznati nego pogađati (pravilo 4).

## Pre nego što kažeš da je gotovo

```bash
npm run check
```

To pokreće typecheck i sve provere (ephemeris, natal, timezone, sky, cities).
Pusti ga pre svakog commita. Ako si dirao geometriju, vreme ili efemeride, navedi
u odgovoru koja provera je prošla — ne tvrdi da radi bez toga.

Uz to, za izmene u UI-ju: reci šta si proverio na telefonu i šta nisi. Ako nešto
nisi mogao da proveriš (dev build, push, IAP), napiši to otvoreno umesto da zvuči
završeno.

## Šta ne raditi bez pitanja

- Ne dodavati analitiku ni bilo kakvo praćenje. Nema ga i to je prednost koja
  stoji napismeno u politici privatnosti.
- Ne dodavati `expo-location`. Odlučeno je da se grad bira ručno — sistemska
  dozvola bi tražila obrazloženje u prodavnici, a razlika između dva grada u
  Srbiji se na ekranu ne vidi.
- Ne postavljati `apple-app-site-association` ni `assetlinks.json`. Sajt
  `astroshop.rs` mora da radi nezavisno od aplikacije.
- Ne slati korpus astrologa na klijenta (pravilo 7) i ne davati pun tekst pa ga
  kriti u UI-ju (pravilo 8).
- Ne menjati `contentKey` format `telo.aspekt.telo` — to je primarni ključ u bazi
  tekstova.
