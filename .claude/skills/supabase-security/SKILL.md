---
name: supabase-security
description: Bezbednost servera — RLS politike, anon naspram service_role ključa, Edge Functions, OTP prijava i Turnstile, spregnuta podešavanja u Supabase konzoli. Učitaj pre izmene u `supabase/`, `src/lib/supabase.ts`, `sync.ts`, `auth-mode.ts`, `store/auth.ts`, pre dodavanja tabele ili Edge Function-a, i kad prijava počne da pada.
---

# Supabase — bezbednost i prijava

## Načelo koje nosi sve ostalo

**Anon ključ je javan.** `EXPO_PUBLIC_*` promenljive se ugrađuju u bundle i svako
ko raspakuje `.ipa` može da ih pročita. Podatke **ne štiti tajnost ključa nego
Row Level Security.**

Iz toga sledi sve: svaka tabela mora imati uključen RLS i **eksplicitne**
politike. Tabela bez politike sa uključenim RLS-om ne vraća ništa; tabela bez
RLS-a je potpuno javna.

**`service_role` ključ nikad ne sme u aplikaciju.** Zaobilazi RLS. Njegovo mesto
je isključivo na serveru (Edge Functions, webhook-ovi).

## Politike koje stoje i zašto

| Tabela | Ko čita | Ko piše |
|---|---|---|
| `profiles` | svoj red (`auth.uid() = id`) | svoj red, insert i update. **Namerno nema delete** — profil se briše brisanjem naloga, kroz `on delete cascade` |
| `entitlements` | svoj red | **niko.** Ni jedne politike za upis. Puni ga isključivo RevenueCat webhook sa `service_role` ključem |
| `transit_texts` | `short` — svaki prijavljen; `long` — samo aktivan `entitlements` red | **niko.** Korpus uvozi vlasnik kroz CSV |

**Paywall je u bazi, ne u aplikaciji.** Aplikacija ne može da ga zaobiđe izmenom
koda — server prosto ne pošalje dugu verziju. Ako bi postojala politika za upis
u `entitlements`, svako bi sebi upisao `active = true`.

Kad dodaješ tabelu: `enable row level security` + politike u istoj migraciji, i
provera na kraju (`schema.sql` ima `do $$` blok koji podigne izuzetak ako RLS
nije uključen — zadrži taj obrazac).

## Edge Functions

`supabase/functions/delete-account/` — jedina do sada.

**Sigurnosna suština koju ne dirati: koga briše određuje ISKLJUČIVO token iz
`Authorization` zaglavlja, nikad telo zahteva.** Da id stiže iz body-ja, svako sa
javnim anon ključem mogao bi da obriše bilo čiji nalog jednim pozivom.

Važno i neočigledno: **anon ključ je validan JWT projekta** i prolazi Supabase-ovu
platformsku `verify_jwt` proveru. Testirano — 401 vraća tek `getUser()` u samom
kodu funkcije. **Ta provera u kodu je jedina prava kapija.** Ne uklanjati je i ne
oslanjati se na platformsku.

Deploy:

```bash
npx supabase functions deploy delete-account --project-ref vwpmsqqwndsoakwhcmzt
```

Projekat **nije linkovan** (nema `config.toml`), pa `--project-ref` ide ručno.
Upozorenje "Docker is not running" je bezopasno. Ključeve `SUPABASE_URL`,
`SUPABASE_ANON_KEY` i `SUPABASE_SERVICE_ROLE_KEY` Supabase sam ubacuje u
okruženje funkcije — **ne postavljati ih ručno.**

## Prijava — dva podešavanja spregnuta sa kodom

Ako se raziđu, prijava pada **za sve odjednom i tiho.**

**1. `Email OTP length` mora biti 6.** Toliko prima `/code` ekran (`LENGTH` u
`code.tsx`), a višak odseca i na `maxLength` i na `slice`. Zatečena vrednost je
bila 8 — korisnik tada nikad ne može da unese kod i dobija "Kod nije tačan".

**2. CAPTCHA prekidač se uključuje POSLEDNJI**, tek kad je na telefonima verzija
koja šalje `captchaToken`. Obrnutim redosledom svaki `signInWithOtp` vraća
`400 captcha_failed`.

Ostalo o prijavi:

- SMTP je **SendGrid**, ne Resend. `smtp.sendgrid.net:587`, username je bukvalno
  `apikey`.
- `mailer_autoconfirm: true` (Confirm email isključen) → Supabase šalje **samo
  šablon Magic Link**; "Confirm signup" se ne koristi. Šablon nosi `{{ .Token }}`.
- `verifyOtp` sa `type: 'email'` prihvata magic-link token — provereno, vraća
  sesiju.
- `From` mora biti `@astroshop.rs` jer DKIM stoji na root domenu.
- Sesija ide u `expo-secure-store`, ne u `AsyncStorage`.

## Turnstile

- Widget `astroshop-app`, hostname `astroshop.rs`, Managed režim.
  **Pre-clearance isključen** — beskoristan je jer auth ide na `supabase.co`, ne
  kroz Cloudflare proxy.
- `src/components/turnstile.tsx` crta widget u `react-native-webview` sa
  `baseUrl: https://astroshop.rs` — **mora da se poklopi sa hostname-om widgeta.**
- Uključen u `account.tsx` i `code.tsx` — oba mesta koja zovu `signInWithOtp`.
- **Prekidač za nuždu:** prazan `EXPO_PUBLIC_TURNSTILE_SITE_KEY` → `getToken()`
  vrati `undefined` → kapije nema.
- Token je **jednokratan** — traži se neposredno pre poziva i nikad se ne čuva.
- Cloudflare analitika kasni i ume da pokaže "issued" bez "solved" iako je token
  ispravan. **Ne juriti to kao kvar.**

## Kako se proverava da zaštita zaista radi

Ne verovati konzoli, poslati zahtev:

- bez tokena → `captcha_failed: no captcha_token found`
- sa lažnim tokenom → `invalid-input-response` (to je Cloudflare-ova poruka iz
  siteverify — dokaz da Supabase zaista zove Cloudflare)
- RLS: anon ključem probaj da pročitaš tuđi red. Mora da vrati **nula redova**,
  ne grešku.

## Šta ne raditi

- Ne dodavati politiku za upis u `entitlements` ni u `transit_texts`.
- Ne slati pun tekst pa ga kriti u UI-ju — API mora da vraća **skraćen** tekst
  korisniku bez prava pristupa (pravilo 8).
- Ne seliti bazu na RDS ni composer na Lambdu. AWS je za backup korpusa (S3 +
  versioning + Glacier), ništa više.
- Plesk je periferija (mail na domenu, cron) — **ne za OTP i ne za API.**
