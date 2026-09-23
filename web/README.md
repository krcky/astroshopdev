# web/ — pravne stranice

Staticne stranice koje Apple i Google traze pri review-u. Nemaju build korak.

## Objavljivanje

Cloudflare Pages → Create → **Connect to Git** → repo `krcky/astroshopdev`:

- Build command: **prazno**
- Output directory: **`web`**

Poddomen: **`pravila.astroshop.rs`**. Ne dirati koren `astroshop.rs` — tamo je WordPress.

## PRE OBJAVE — popuniti

Uglaste zagrade u `privatnost.html` i `uslovi.html`:

- `[NAZIV PRAVNOG LICA]`, `[ADRESA SEDIŠTA]`, `[MB]`, `[PIB]` — ceka pravni oblik
- `[REGION]` — Supabase → Project Settings → General → Region
- `[GRAD]` — sediste nadleznog suda, u `uslovi.html`

Obrisati zuti okvir `<div class="popuniti">` sa obe stranice.

## PRE OBJAVE — napraviti aliase u Google Workspace-u

`privatnost@`, `podrska@`, `brisanje@` — sve tri se pominju u tekstu.
(`dmarc@` je zaseban, za DMARC izvestaje.)

## PRE OBJAVE — pravnik

Nacrt je pisan prema stvarnom stanju koda, ali odricanje od odgovornosti,
prava potrosaca i deo o povracaju novca treba da potvrdi pravnik.

## Gde se linkovi unose

- App Store Connect → Privacy Policy URL, Support URL
- Google Play Console → Privacy Policy, **Data deletion URL** (bez nje review pada)

## ODLUKA 23.9.2026: bez `.well-known`

Sajt mora da radi nezavisno od aplikacije — **link ka `astroshop.rs` NE SME da
otvara app**. Zato se `apple-app-site-association` i `assetlinks.json` NE
postavljaju; njihova jedina svrha je da preuzmu linkove ka domenu.

Apple i Google prijava ih ne traze: Apple ide kroz sistemski dijalog, Google se
vraca preko seme `astroshop://` iz `app.json`.

Ako deep linkovi ikad zatrebaju — zaseban poddomen `link.astroshop.rs`, nikad koren.

## Brisanje naloga — gotovo

Edge Function `delete-account` je deplojovana 23.9.2026 i stranica opisuje oba
puta: dugme u aplikaciji i zahtev mejlom. Time je zatvoren i Apple zahtev 5.1.1(v).
