---
name: store-release
description: Izlazak na App Store i Google Play — šta obara review, podešavanja u `app.json` i `eas.json`, EAS build, metapodaci, i poslovni deo (PDV, isplate, Bank Territory). Učitaj pre EAS build-a, pre slanja na review, kad se menja `app.json`/`eas.json`, i kad se odlučuje o naplati u verziji 1.0.
---

# Izlazak u prodavnice

Puna lista sa stanjem je u **`APPLESTORE.md`** u korenu repoa — **pročitaj je,
ne prepisuj je ovde.** Ovaj skill je redosled poteza i ono što se lako previdi.

## Pravilo broj jedan

**Redosled je bitan.** Stvari iz prve grupe obaraju review odmah, bez obzira na
to koliko je ostalo dobro urađeno. Nema smisla praviti screenshotove dok paywall
vodi u ćorsokak.

## Četiri stvari koje obaraju review

1. **Paywall vodi u ćorsokak.** `daily.tsx` i `transit.tsx` nude "Otključaj" →
   `/profile`, gde se ništa ne može kupiti. Smernica 3.1.1, sigurno odbijanje.
   Dva izlaza, trećeg nema: integrisati RevenueCat + proizvode u ASC, **ili**
   za 1.0 skloniti paywall i sve pustiti besplatno.
2. **Reviewer ne može da se prijavi.** Prijava je šestocifreni kod na email
   (`AUTH_MODE = 'otp'` u `src/lib/auth-mode.ts`), a reviewer nema pristup
   sandučetu. Rešenja po poželjnosti: test OTP u Supabase-u za tačno jednu
   adresu → demo nalog uz lozinku webmail-a. **Ne** prebacivati `AUTH_MODE` na
   `'password'` — binary koji reviewer dobija je isti onaj koji ide u prodaju,
   pa bi lozinku dobili svi korisnici.
3. **Pravne strane nisu objavljene.** Privacy Policy URL je obavezno polje.
   Spisak praznih polja je u `web/README.md`; plan je Cloudflare Pages,
   poddomen `pravila.astroshop.rs`. Traje najduže — zbog pravnika i aliasa
   (`privatnost@`, `podrska@`, `brisanje@`). **Počni od ovoga.**
4. **Nalog u Apple Developer Program** (99 USD/god) i prvi build.

## Podešavanja koja se zaborave

- `ios.config.usesNonExemptEncryption: false` u `app.json` — aplikacija koristi
  samo HTTPS, što je izuzeto. Bez toga ASC pita za svaki build.
- `expo-notifications` je u `package.json` ali **plugin nije u `app.json`** — push
  ne radi. Ako ne ide u 1.0, **izbaciti paket**; nekorišćene mogućnosti izazivaju
  pitanja na review-u.
- `supportsTablet` nije postavljen → samo iPhone → **iPad screenshotovi nisu
  potrebni.** To je namerno, ne propust.
- Ako pretplata ostaje u 1.0, na **samom paywall ekranu** mora: cena i trajanje,
  tekst o automatskoj obnovi, link na uslove i privatnost, i dugme
  **"Vrati kupovine"** (čest razlog odbijanja).

## Sign in with Apple — zamka 4.8

**Čim se uključi Google prijava, Sign in with Apple postaje obavezan.** Dugmad
već stoje i čekaju dev build. Ne puštati Google bez Apple-a.

## Build

Xcode **je instaliran** (26.6, od 28.9.2026), ali služi za simulator i
besplatnu instalaciju na sopstvene telefone. Build za prodavnicu ide preko
**EAS**:

```bash
npx eas build --platform ios --profile production
```

`eas.json` ima profile `development` (dev client, internal), `preview` i
`production` (`autoIncrement: true`, `appVersionSource: "remote"` — verziju vodi
EAS, ne `app.json`).

TestFlight: **interno testiranje ne traži review, eksterno traži.**

## Poslovni deo — ovo nije tehničko pitanje i blokira lansiranje

- **PDV je uslov za Android u Srbiji.** Google izričito prebacuje PDV na
  programera za domaće kupce: za kupca iz Srbije PDV obračunavaš i plaćaš ti.
  Za kupce van Srbije obračunava Google. Pošto je Astro Shop na srpskom za srpsku
  publiku — to pogađa glavno tržište.
- **Apple strana nije potvrđena.** Sekundarni izvori kažu da je Srbija u
  Exhibit B (Apple je merchant of record), ali se to ne vidi iz Apple-ovog
  teksta. Proverava se u **App Store Connect → Business → Agreements, Tax, and
  Banking**.
- **Isplate u Srbiju — nepotvrđeno.** Apple ne objavljuje javnu listu; jedina
  merodavna provera je padajući meni "Bank Territory" na istom ekranu. RSD nije
  među Apple-ovim valutama, pa novac stiže u EUR ili USD. **EUR račun ima niži
  prag isplate (~$10 naspram ~$150)** — bolji izbor za namenski račun u
  Raiffeisen-u. Google Play podržava i developer i merchant registraciju iz
  Srbije (potvrđeno, default USD, wire transfer).
- Exhibit B i Bank Territory su **na istom ekranu** — proveriti oboje odjednom.
- Devizni priliv traži registrovan pravni oblik i knjigovodstvo. Račun krajnjem
  kupcu izdaju Apple/Google u svoje ime.

Ovo su stvari koje **samo Ivan može da proveri** (traže prijavu na njegov nalog).
Kad naiđeš na njih, reci mu to jasno umesto da nagađaš iz sekundarnih izvora.

## App Privacy upitnik

Prikuplja se: **email** (Supabase Auth) i **podaci o rođenju** (datum, vreme,
mesto). Oboje se prijavljuje i vezano je za nalog.

Prednost koju treba navesti tačno: **u aplikaciji nema nijednog alata za
analitiku ni praćenje** (provereno grepom kroz `src` i `package.json`). Cloudflare
je naveden kao obrađivač zbog Turnstile-a, koji pri prijavi vidi IP i signale
uređaja.

## Pre svakog slanja

1. `npm run check` prolazi.
2. Dev prekidač `store/dev.ts` je ugašen u release bildu.
3. `.env` vrednosti koje ulaze u build su produkcione (`EXPO_PUBLIC_*` završavaju
   u bundle-u i svako ih čita — `service_role` ključa tu ne sme biti).
4. Prođi `APPLESTORE.md` redom i **označi šta je zaista urađeno**, ne šta
   izgleda urađeno.
