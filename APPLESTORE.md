# Izlazak na App Store

Stanje na dan 24.9.2026. Redosled je bitan: stvari iz prvog dela obaraju review
odmah, bez obzira na to koliko je ostalo dobro uradjeno.

Google Play ima svoj spisak i ovde nije obradjen; ono sto je zajednicko
(pravne strane, brisanje naloga) naznaceno je u `web/README.md`.

## 1. Obara review

### [ ] Paywall vodi u corsokak

`daily.tsx` i `transit.tsx` prikazuju dugme "Otkljucaj" koje vodi na
`/profile`. Tamo NEMA nacina da se bilo sta kupi — samo prikaz statusa i dev
prekidac (`store/dev.ts`, ugasen u release bildu). Reviewer otvori ekran, ne
nadje kupovinu, i to je odbijanje po smernici 3.1.1.

Dva izlaza, treceg nema:

- integrisati RevenueCat i napraviti proizvode u App Store Connect-u, ili
- za 1.0 skloniti paywall i pustiti sve besplatno, pa naplatu dodati u 1.1

### [ ] Reviewer ne moze da se prijavi

Najveca zamka i nema veze sa kodom. Prijava ide sestocifrenim kodom na email
(`AUTH_MODE = 'otp'`), a Apple reviewer nema pristup nijednom postanskom
sanducetu. Bez resenja review pada na prvom ekranu, pre nego sto vidi ijednu
funkciju.

Opcije, po redu pozeljnosti:

1. ~~**Test OTP u Supabase-u**~~ — PROVERENO 25.9.2026, NE POSTOJI za email.
   U konzoli, Email provider ima samo `Email OTP expiration` i `Email OTP
   length`. Polje **Test Phone Numbers and OTPs** postoji iskljucivo pod Phone
   providerom. Opcija otpada, ne proveravati ponovo.
2. **Demo nalog sa pristupom sanducetu** — `review@astroshop.rs`, pa Apple-u
   dati i lozinku webmail-a, u poljima "Demo Account" i "Notes". OVO JE JEDINI
   PUT posto test OTP za email ne postoji.

   U Notes obavezno napisati: da kod stize na email, gde se cita, i da pri
   prijavi postoji Turnstile provera "niste robot" (Managed rezim ga skoro
   sigurno pusti bez klika, ali neka zna da nije kvar).

   Nalog NE brisati pri ciscenju test korisnika — sledeci review bi pao.
3. ~~Prebaciti `AUTH_MODE` na `'password'`~~ — grana postoji u kodu, ali binary
   koji reviewer dobija je isti onaj koji ide u prodaju, pa bi lozinku dobili
   svi korisnici. Nije resenje za review, nego promena proizvoda.

Sta god se izabere, podaci idu u App Store Connect → App Review Information.

### [ ] Pravne strane nisu objavljene

Privacy Policy URL je OBAVEZNO polje u App Store Connect-u. Spisak onoga sto
fali je u `web/README.md`:

- popuniti `[NAZIV PRAVNOG LICA]`, `[ADRESA SEDISTA]`, `[MB]`, `[PIB]`,
  `[REGION]`, `[GRAD]` i obrisati zuti okvir `<div class="popuniti">`
- napraviti aliase `privatnost@`, `podrska@`, `brisanje@`
- objaviti na Cloudflare Pages, poddomen `pravila.astroshop.rs`
- dati pravniku na potvrdu

### [ ] Nalog u Apple Developer Program i prvi build

Clanarina je 99 USD godisnje. Xcode nije instaliran na masini, pa build ide
preko EAS-a — `eas.json` profil `production` je vec spreman.

## 2. Obavezno ako pretplata ostaje u 1.0

Ovo mora da stoji u SAMOM UI-ju paywall ekrana, ne samo u opisu na prodavnici:

- [ ] cena i trajanje perioda
- [ ] tekst o automatskoj obnovi
- [ ] link na uslove koriscenja i politiku privatnosti
- [ ] dugme **"Vrati kupovine"** (Restore) — cest razlog odbijanja

Podsetnik iz pravila 8 u `CLAUDE.md`: pravo pristupa se i dalje proverava na
serveru, a ne u aplikaciji. RevenueCat webhook upisuje u `entitlements`
service_role kljucem; aplikacija taj red sme samo da cita.

## 3. Podesavanja u `app.json`

- [ ] **`ITSAppUsesNonExemptEncryption`** nije postavljen, pa ce App Store
      Connect pitati za svaki build. Aplikacija koristi samo HTTPS, sto je
      izuzeto, pa ide `ios.config.usesNonExemptEncryption: false`.
- [ ] **`expo-notifications`** je u `package.json`, ali plugin nije dodat u
      `app.json` — push dakle jos ne radi. Ako ne ide u 1.0, izbaciti paket;
      nekoriscene mogucnosti umeju da izazovu pitanja pri review-u.
- [x] **`supportsTablet`** nije postavljen, dakle aplikacija je samo za iPhone.
      To je dozvoljeno i znaci da iPad screenshotovi NISU potrebni.
- [ ] Proveriti da li neki dodatni SDK (RevenueCat) trazi svoj privacy
      manifest. Za Expo module ih generise sam Expo.

## 4. Metapodaci u App Store Connect-u

- [ ] screenshotovi — 6.9" je obavezan; pri unosu proveriti da li ASC trazi i
      manje dijagonale ili ih izvodi sam
- [ ] ikona 1024x1024
- [ ] opis, kljucne reci, Support URL, Privacy Policy URL
- [ ] **App Privacy** upitnik — prikupljamo email (Supabase Auth) i podatke o
      rodjenju (datum, vreme, mesto). Oboje se prijavljuje, vezano za nalog.
- [ ] uzrasna kategorija

## 5. Vec reseno

- [x] **Brisanje naloga u aplikaciji** (5.1.1(v)) — Edge Function
      `delete-account`, dugme u `profile.tsx`
- [x] **Pravi native build**, ne WebView (4.2)
- [x] **Nema nepotrebnih sistemskih dozvola** — ni lokacija, ni kamera, ni
      kontakti. Mesto posmatranja na ekranu "Trenutno na nebu" bira se rucno,
      bas da se `expo-location` ne bi trazio.

## 6. Srednji rizici — ne obaraju sigurno, ali se zakace

- **5.1.1(i), zid pre sadrzaja.** Bez naloga se ne vidi nista. Odbrana je dobra
  jer su podaci o rodjenju direktno potrebni za funkciju, a zid je namerno
  postavljen POSLE ekrana sa velikom trojkom (pravilo 14 u `CLAUDE.md`) — ali
  pripremiti odgovor za slucaj da pitaju.
- **4.8, Sign in with Apple.** Cim se ukljuci Google prijava, Sign in with
  Apple postaje OBAVEZAN. Dugmad vec stoje i cekaju dev build — ne pustati
  Google bez Apple-a.
- **Tvrdnje u korpusu.** Tekstovi koji zvuce kao finansijski ili zdravstveni
  savet drze se u ravni astroloskog tumacenja, bez kategoricnih tvrdnji.

## 7. Redosled

1. Odluka o naplati u 1.0 (tacka 1, prva stavka) — od nje zavisi ceo deo 2.
2. Pravne strane na mrezi (traje najduze zbog pravnika i aliasa).
3. Resenje za prijavu reviewer-a.
4. Podesavanja iz dela 3, pa EAS build.
5. TestFlight — interno testiranje ne trazi review, eksterno trazi.
6. Metapodaci, pa slanje.
