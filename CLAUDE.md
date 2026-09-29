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
    sky-place.tsx    izbor mesta odakle se gleda nebo (NE dira profil) — LIST odozdo (formSheet)
    sky-datum.tsx    kalendar za Nebo — LIST odozdo sa dugmeta sa datumom
    (onboarding)/    welcome, date, time, place, reveal, account, code, name, push
    dev-kartice.tsx  SAMO DEV: pregled kartica Premium za test kartu sa ASC u Ribama
    dev-tipografija.tsx SAMO DEV: sve uloge teksta i kompozicije, za procenu debljina
    dev-tranziti.tsx SAMO DEV: tab Tranziti + ocene oblasti za test kartu, dan nadjen racunom
    premium.tsx      PAYWALL (po uzoru na CHANI) — modal preko celog ekrana, sa svakog "Otključaj"; paketi iz `kupovina.ts`
    transit.tsx      tumacenje tranzita — NATIVNI LIST odozdo (formSheet u _layout.tsx), kao SVA TUMACENJA
    tvoj-dan-info.tsx  nativni iOS list (formSheet): na osnovu cega je tekst "Tvog dana" + vladar
    natal.tsx        tumacenje iz natalne karte (?tema=sun | ascendant | natal.moon.square.sun)
    natalna-karta-info.tsx  list "Šta je natalna karta" (ikonica "i" pored tocka): sazetak, legenda aspekata, elementi
    nebo-info.tsx    list "Šta je trenutno nebo" (ikonica "i" pored tocka na Nebu): krug, R, tacke, aspekti
    moon.tsx         lunarni kalendar — LIST odozdo (formSheet, SIVI: `SheetScroll siva`) sa kartice na pocetnoj (?day=pomeraj); dan se menja strelicama
                     i MESECNIM KALENDAROM (`lib/lunarni-kalendar.ts`), znak je dole desno uz crtez
    profile.tsx      profil — NIJE tab, otvara se dugmetom gore desno (nazad gore levo)
    pitanje-novo.tsx pisanje pitanja astrologu — pageSheet preko celog ekrana (pravilo 21)
    pitanje.tsx      pitanje i glasovni odgovor — LIST odozdo, kao tumacenja
    (tabs)/          home (Danas), daily (Tranziti), ask (Pitaj), chart (Ti), sky (Nebo)
                     svaki tab je FOLDER: index.tsx + _layout.tsx = TabStack (native traka, pravilo 17)
  theme/
    tokens.ts        IZVOR ISTINE za boje, pismo i mere (vidi DESIGN.md)
  components/
    screen.tsx           okvir ekrana — preliv, zamucena traka, skrol, siva pozadina
    onboarding-step.tsx  zajednicki okvir svih koraka
    natal-wheel.tsx      SVG tocak natalne karte
    karta-lista.tsx      redovi ispod tocka (trojka, planeta, aspekt) i "i" uz tocak — ZAJEDNICKI za "Ti" i "Nebo"
    info-list.tsx        delovi listova sa objasnjenjem tocka (odeljak, stavka, aspekti) — oba "i" lista
    moon-disc.tsx        Mesec u trenutnoj fazi — jedna od 30 slika (`assets/images/mesec/`, pravi ih `scripts/mesec-faze.ts` iz punog Meseca)
    celestial-orb.tsx    proceduralno nebesko telo (onboarding)
    uvod.tsx             uvodna animacija pri pokretanju — krug se vrti, pa se otvori (pravilo 20)
    turnstile.tsx        CAPTCHA kapija pred slanje koda
    ui/                  text, button, card, input, list, chip, glyph, row, wheel-picker
  store/
    draft.ts         onboarding pre naloga — BEZ persist (prekid = ispocetka)
    profile.ts       podaci o rodjenju, kes servera
    auth.ts          sesija + pravo pristupa
    sky-place.ts     mesto posmatranja, null = grad iz profila
    sky-time.ts      pomeren trenutak na Nebu (null = sadasnjost) — BEZ persist
  lib/
    zodiac.ts        12 znakova, longituda -> znak
    astro.ts         ephemeris + aspekti        <- engine
    natal.ts         ASC, MC, Placidus kuce     <- engine
    transits.ts      tranziti na natalnu kartu  <- personalizacija
    points.ts        cvor, Lilit, Tacka srece   <- nema ih u engine-u
    sky.ts           stanje neba SADA nad gradom iz profila
    moon.ts          procenat, oblik faze, lunarni dan, mlad/pun, element i deo biljke
    sky-events.ts    sledeci ulazak u znak / promena smera + kuca od podznaka
    timezone.ts      lokalno vreme -> UTC
    wheel.ts         geometrija tocka (cista, bez RN uvoza)
    tocak-stil.ts    izgled tocka (boje, crtice, aspekti) — deli ga panel
    znak-oblici.ts   oblici i boje ikonica znakova — deli ih panel
    uvod.ts          uvod: vremena, vrtenje, prozor (cist racun)
    pristup.ts       STA BESPLATNI VIDI — sve granice na jednom mestu (pravilo 18c)
    cities.ts        ugradjena lista gradova + predlozi (najveci u Srbiji)
    traits.ts        osobine po znaku — PRIVREMENO, ceka astrologa
    horoscope.ts     composer                   <- ovde ulazi korpus
    supabase.ts      klijent
    sync.ts          profil <-> server
    pitanja.ts       Pitaj astrologa: cist racun, snimak karte   <- pravilo 21
    pitanja-api.ts   upiti (TanStack Query); kupovina.ts = mesto za RevenueCat
supabase/
  schema.sql         tabele + RLS politike
  pitanja.sql        pitanja, krediti, astrolozi, skladiste `odgovori`
  pitanja-obavestenja.sql  okidac: placeno pitanje -> mejl astrologu (pg_net)
panel/               veb panel za astrologa (Vite + React), NIJE deo aplikacije
scripts/
  check-*.ts         provere tacnosti
  font/              sklapanje AstroGlyphs.ttf iz Noto izvora
```

## Pravila koja se ne krse

**1. Longitude su uvek u ECT (prava ekliptika datuma).**
`astro.ts` koristi `Rotation_EQJ_ECT`. NIKAD ne koristiti `Astronomy.Ecliptic()` —
on vraca J2000 koordinate, sto danas odstupa ~0.36 stepeni zbog precesije i
pomerilo bi svaku poziciju u aplikaciji. Provera: `npm run check:ephemeris`
(Sunce mora biti na 0/90/180/270 na ravnodnevicama i solsticijima).

**2. Tema je svetla: SIVA pozadina, BELE kartice, crn tekst. Dizajn sistem je u `DESIGN.md`.**
Pozadina ekrana je `bg-grouped` (#F6F7F8), povrsine su bele i poluprovidne
(`CARD_SURFACE` u `ui/card.tsx`). Obrnuto ne radi — vidi pravilo 17.
Sve boje su CSS varijable u `global.css` pod `:root`, a njihov izvor je
`src/theme/tokens.ts` — vrednosti su IZMERENE sa snimaka referentne aplikacije,
ne izabrane. Pismo je PLUS JAKARTA SANS (Ivan, 28.9.2026; pre toga istog dana
Satoshi, a jos ranije sistemsko): pet rezova (Regular, Medium, SemiBold, Bold,
ExtraBold) u `assets/fonts/plus-jakarta-sans/`, licenca SIL OFL uz njih. Satoshi fajlovi ostaju
u `assets/fonts/satoshi/` (ITF FFL zabranjuje izmenu i podskup; repo mora ostati
privatan), povratak je `FONT_SATOSHI` u `theme/font.ts`. Klase tezine ostaju
(`font-semibold`…), a `<Text>` iz njih bira familiju — `theme/font.ts`. Hijerarhija
je `TEZINE_JAKARTA_LAKSE` (Ivan: "mnogo su debeli"): naslovi, podnaslovi i dugme
SemiBold, sve ostalo Medium. Teze stanje sa cetiri nivoa (800/700/600/500) je
`TEZINE_JAKARTA`, Satoshi stanje `TEZINE_SATOSHI`. DEBLJINA SVAKE ULOGE je u `theme/tipografija.ts` — ekrani ne
pisu `font-semibold` sami nego `tezina('uloga')`; stanje pre procene hijerarhije
su sacuvana kao `TEZINE_SATOSHI_1`, `TEZINE_HIJERARHIJA` i `TEZINE_SATOSHI` (povratak: jedna linija).
Tekst za citanje je Medium, ne Regular (Ivan: "malo podebljaj"). Uzorak: `/dev-tipografija`. `TextInput` nosi `font-sans`; SVG tekst i natpisi tabova
dobijaju `FONT.*` direktno. Ne postavljati `fontWeight` uz ucitanu familiju —
Android bi je vestacki podebljao. Skala velicina (merena sa SF Pro-a) je ostala. BOJA PREMIUM-A JE INDIGO (Ivan, 29.9.2026; do tada zlatna `--gold`): katanci,
kartica "Otključaj" i paywall uzimaju `PREMIUM` iz `components/zakljucano.tsx`
(= `brand.indigo`), nikad svoj hex. Indigo je i boja brenda (ikonice planeta,
tackica novog odgovora), pa Premium ne prepoznaje boja sama nego katanac u njoj.
`--gold` za Premium vise nije u upotrebi. Tamna
tema je i dalje definisana pod `.dark:root` ako je ikad budemo ponudili kao
opciju; `_layout.tsx` je zakljucan na `colorScheme.set('light')`.

DATUM je svuda istog oblika, "Uto, 29. sep 2026" (Ivan, 29.9.2026): skracen dan i mesec,
godina bez tacke; mesta se razlikuju samo po tome da li nose dan i godinu. Sklapa ga
ISKLJUCIVO `datum()` u `lib/horoscope.ts` (i omotaci `formatDate`, `formatDatum`,
`formatDay`, `opsegDatuma`, `datumRodjenja`) — ekran ne pise imena meseci sam.

Svaki kljuc dodat u `tailwind.config.js` MORA da se pojavi i u spisku u
`src/lib/utils.ts`. Bez toga `tailwind-merge` svrsta klasu u pogresnu grupu —
`text-button` prodje kao boja teksta i pojede belu na crnom dugmetu.

**3. Simboli idu iskljucivo kroz `<Glyph>`.**
Unicode astroloski znaci (♈ ♃ ☽) imaju podrazumevanu EMOJI prezentaciju i
sistem ih renderuje kao obojene kvadratice. `components/ui/glyph.tsx` forsira
tekstualni font. Nikad ne stavljati simbol direktno u `<Text>`.
Izuzetak (28.9.2026): na tabu "Tranziti" planete i tacke su Ivanove SVG ikonice
(`components/planeta-ikona.tsx`, beo krug sa sivim obrisom, znak u indigu) — ima ih za 10 tela,
Ascendent, MC, Severni cvor i Kiron; aspekti su `components/aspekt-ikona.tsx` (precrtani kao linije ISTE debljine kao znaci planeta, `PLANETA_POTEZ`; indigo
iz fajlova, `brand.indigo`). KARTICA TRANZITA (28.9.2026) ipak koristi SLIKE planeta
(`assets/images/planete/`) na ILUSTRACIJI ASPEKTA (`components/aspekt-ilustracija.tsx`,
`assets/images/aspekti/`): tocak, natalna planeta unutra, tranzitna van kruga — slike se
lepe preko tackica cije su pozicije IZMERENE na slikama (`MERE`). Asc/MC su SVG ikonica.
Ilustracije u `assets/` imaju belu pretvorenu u providnu; izvor je u `files/`.
ZNACI ZODIJAKA su SVUDA Ivanove SVG ikonice (28.9.2026, `components/znak-ikona.tsx`): krug u boji
elementa + beli znak — prsten natalnog tocka, redovi Ascendent/MC, ekran Mesec, dobrodoslica.
`SIGNS[].glyph` ostaje samo za tekst; znak se vise ne crta kroz `<Glyph>`.

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
POKLONJEN PREMIUM (28.9.2026) je zasebna tabela `pokloni` — vlasnik ga daje iz SQL
Editora (`select admin.daj_premium('email', do_datuma)`, `supabase/pokloni.sql`).
Odvojena je da RevenueCat webhook ne bi obrisao poklon. Paywall politike pitaju
`public.ima_premium()` = kupovina ILI poklon; nova placena tabela ide kroz nju.
Kod koji korisnik ukuca u aplikaciji NE (Apple 3.1.1) — za kampanje su Offer Codes.
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
"NAPRAVI NALOG" SA EMAILOM KOJI VEC IMA KARTU (Ivan, 29.9.2026): posle koda ekran kaze
"Ovaj email vec ima nalog" — drugi email (odjava samo sa ovog telefona, draft ostaje) ili
ulazak u postojeci. Nikad tiho u stari nalog. Put nosi `?nov=1` (reveal -> account -> code);
"Vec imam nalog" ga nema. Pita se POSLE koda, ne pre — pre bi otkrivalo ciji je email.

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

**16. Izvedene tacke ne ulaze u `BODIES`.**
Cvor, Lilit i Tacka srece stoje u `lib/points.ts`, odvojeno od `astro.ts`. Da
su u `BODIES`, usle bi u natalnu kartu SVAKOG korisnika, u `findAspects()` i u
dnevne tranzite — a korpus za njihove aspekte nema nijedan tekst, pa bi
`daily.tsx` dobio gomilu sazetih redova bez tumacenja. Za sada se samo
PRIKAZUJU, na ekranu "Trenutno na nebu".

Konvencije su izabrane i proverene, ne pretpostavljene: cvor je PRAVI
(oskulirajuci, iz vektora ugaonog momenta Meseca) jer srednji odstupa i do
1,8°; Lilit je SREDNJI apogej jer pravi skace i do 30°. Oznaka "R" na cvoru se
RACUNA — pravi cvor po nekoliko dana mesecno ide napred. Sve troje drzi
`npm run check:sky`, prema vrednostima sa astro-seek-a.

**17. Vrh ekrana ide kroz `Screen`, i redosled slojeva se ne menja.**
`components/screen.tsx` crta preliv, zamucenu traku, skrol i sivu pozadinu;
ekran to ne sklapa sam. Ekrani sa svojim rasporedom (pocetni, koraci
onboardinga) uzimaju samo `ScreenBackdrop` — tamo sadrzaj ne klizi ispod trake
pa zamucenje nema sta da zamuti, ali boja na vrhu mora da ostane ista da se tok
ne prelomi. Razmak na vrhu sadrzaja je `insets.top + headerBar.height` i
racuna se na jednom mestu — da ga svaki ekran sam sabira, prvi naslov bi se na
jednom podvukao pod traku a na drugom odlepio, i videlo bi se tek na telefonu
sa zarezom.

TRI stvari koje izgledaju kao sitnica a nisu:

POZADINA MORA BITI SIVA. Bela kartica na beloj pozadini je ista boja, a preliv
koji stoji iznad oboji i nju i pozadinu podjednako — kartica koja prolazi kroz
preliv se tada uopste ne vidi kao kartica i od celog efekta ne ostane nista.
Otuda `bg-grouped` na ekranu i `bg-card/80` na povrsini. Tanke linije koje
stoje DIREKTNO na sivom idu na `border-fill-strong`; `border-border` (#F0F0F0)
na #F6F7F8 ima sest nivoa razlike umesto petnaest koliko je imao na belom, pa
podvlake polja skoro nestanu. Unutar bele kartice `border-border` ostaje.

PRELIV JE IZNAD SADRZAJA, NE POZADINA. Sve tri boje su providne, pa kartice
prolaze ispod njega i primaju nijansu. Cim postane pozadina, kartice ostanu
bele i efekta nema. Mora da nosi `pointerEvents="none"` — inace pokrije gornjih
230pt liste i tamo nista ne moze da se pritisne. Crta se POSLE zamucenja: ako
ode iznad, gornjih 53pt izgubi boju i traka izgleda kao siva pruga. Sva tri
sloja su direktna deca korenskog `View`-a jer Android secka ono sto izadje iz
roditelja, a iOS ne — razlika bi se videla tek na drugom telefonu.

ZAMUCENJE IDE PREKO `animatedProps`, NE PREKO RN-ovog `Animated`. Pali se tek
kad sadrzaj predje `headerBar.blurAt` — na vrhu liste nema sta da se zamuti,
pa bi traka samo posvetlela prazan prostor i procitala se kao siva pruga.
`intensity` je obican prop, a `BlurView` je klasna komponenta bez
`setNativeProps`: animirana providnost preko RN-ovog `Animated` NE STIGNE do
ekrana (provereno — traka ostane na nuli i kad je stanje upaljeno). `expo-blur`
zato izvozi `getAnimatableRef()` za Reanimated; provereno, `intensity` 20 daje
`blur(4px)`.

ANDROID TIHO OSTANE BEZ ZAMUCENJA. `ExpoBlurView.kt` radi
`if (blurTarget != null) method else BlurMethod.NONE` — nema greske, samo
providna traka. Zato je sadrzaj obmotan u `BlurTargetView` i njegov `ref` ide
traci. Na iOS-u je `BlurTargetView` obican `View` i ne kosta nista.

UNUTRASNJE STRANE (`pushed`: profil, Mesec, izmena) imaju svoje
zaglavlje, isto za sve (Ivan, 27.9.2026): strelica nazad + ime strane u istoj liniji,
BEZ loga i BEZ preliva (izuzetak: Mesec ima ljubicasti, `tint="purple"`). Strelicu
crta `Screen` sam — ekran je ne salje.

STAKLENO DUGME = NATIVE STAVKA TRAKE (Ivan, 29.9.2026). Svako glass dugme gore
(nazad, X, profil, kalendar, "Preskoči") se na iOS-u 26 pravi ISTO kao kalendar i
profil na pocetnoj: providna native traka (`headerShown` samo za `!STARI_IOS`,
`headerTransparent`) + `unstable_headerLeftItems` / `unstable_headerRightItems`.
Traka svih tabova je `components/tab-stack.tsx` (`TabStack`, u `_layout.tsx` svakog
taba); profil gore desno je `ProfileButton` (sam bira native stavku ili rezervu).
Onboarding: `(onboarding)/_layout.tsx` + `onboarding-step.tsx`.
`GlassView` (`ui/glass-button.tsx`) "lici na Apple glass, nije to" — ostaje samo kao
rezerva za Android / iOS < 26 i tamo gde trake nema (kapsule u karticama). Providan
roditelj (`active:opacity`) kvari staklo — nikad oko `GlassView`. `@expo/ui`
SwiftUI dugme sa `RNHostView` sadrzajem je u Expo Go-u oborilo ceo bundle.

UMETAK VRHA U TABU (29.9.2026): expo-router svaki native tab obmota SVOJIM
`SafeAreaProvider`-om, a skriven tab (montiran unapred) dobije od njega vrh 0 — pa je
svaki tab pri PRVOM prikazu ~0,1 s imao naslov preko sata i sadrzaj previsoko (snimak
sa iPhone-a). `TabStack` zato ide kroz `UmeciTaba` (`components/umeci.tsx`), koji tada
uzme umetke prozora iz korena (`KorenskiUmeci` u `_layout.tsx`). Ne uklanjati.

ZIVI PRELIV STAJE KAD KORISNIK MIRUJE (baterija, 28.9.2026): mrlje teku samo na ekranu u
fokusu, 20 s posle poslednjeg dodira uspore do nule (`store/budnost.ts`, dodir hvata koren u
`_layout.tsx`, tab i povratak u app bude). U Low Power Mode / usteda baterije (`expo-battery`)
pokreta nema. Nov ukrasni pokret koji traje ide kroz istu `useBudnost`.

Merenja i cela slika su u `DESIGN.md`, poglavlje 5.

**17b. `docs/ASTRO-LOGIKA.md` je opis SVE astroloske logike za astrologa.**
Svaka promena pravila, orbisa, tezina ili izbora (Hero, sazetak, Mesec, kuce) se
upisuje i tamo, u istom commitu — inace astrolog proverava zastarelo stanje.

**18b. Premium tab "Tranziti" = lista po VAZNOSTI; ocene oblasti SAMO na pocetnoj (28.9.2026).**
Tab "Tranziti" (`components/tranziti-lista.tsx`): svi tranziti dana, najjaci prvi, svaki u
svojoj kartici — BEZ oblasti i BEZ ocena (Ivan: "to je ok za homepage"). Ocena 1—5 po oblasti
je samo na pocetnoj: 4 reda bez linija, u ISTOJ kartici iznad "Ide ti / Koci te" na slajdu "Danas ukratko". Racun `lib/oblasti.ts` (`poVaznosti` za listu,
`oblasti` za ocene), SVE vrednosti za astrologa u `lib/oblasti-config.ts`. Oba ekrana idu
kroz ISTI `useOblastiDana`. Mnozina ("21 dan", "5 meseci") samo kroz `lib/mnozina.ts`.
Interesovanja iz onboardinga jos ne postoje: `redosled`/`iskljucene` su parametri sa
podrazumevanom vrednoscu. Opis: `docs/ASTRO-LOGIKA.md`, poglavlje 11. Testovi: `npm run
check:oblasti`. Pregled: `/dev-tranziti` (samo dev).

**18c. Besplatno = ISTI ekrani, manje dubine (Ivan, 29.9.2026).**
Besplatni vise ne vidi "staru verziju": "Tvoj dan", "Mesec danas", ocene oblasti i
nova lista Tranziti su za sve. Granice su SAMO u `lib/pristup.ts` (`BESPLATNO`):
Tranziti prva 3 (ostali po imenu pod katancem), Tema perioda prvi, ocena samo za
Ljubav, dan-meni samo Premium. Ekran pita `usePremium()` (`store/auth.ts`) i cita
broj iz `BESPLATNO`, ne pise svoj. Zakljucano crta `components/zakljucano.tsx`
(indigo katanac `PREMIUM`, `PremiumKartica`, `ZakljucaniRedovi`) i sve vodi na `/premium`.
PAYWALL (`app/premium.tsx`): cetiri stavke sa nasim ilustracijama, dva paketa (godisnje
izabrano, "Uštedi N%" se RACUNA iz cena), jedno crno dugme, pa Uslovi / Vrati kupovine /
Privatnost i recenica o automatskom obnavljanju (Apple). Cena i proba SAMO iz prodavnice
(`usePaketiPremium`); u `__DEV__` probni paketi, u buildu bez cene paketi se ne crtaju.
Bez polja za promo kod (pravilo 8). Indigo (`PREMIUM`) samo na izabranom paketu i oznaci.
Tekst za besplatne je KRATKA verzija — dugu ionako salje samo server (pravilo 8).
Tabela: `docs/ASTRO-LOGIKA.md`, poglavlje 5c.

**18. Tranzit dana: "Tvoj dan" po SKORU, za sve (od 29.9.2026; Hero je arhiva).**
PREMIUM (od 27.9.2026, Ivan; od 29.9.2026 i besplatni, sa kratkim tekstom): `lib/tvoj-dan.ts`, pravila iz `docs/tvoj_dan_simulacija.py`
(isti izbor 20/20 dana). Svoji orbisi (1,5°, Uran—Pluton 1°, Mesec 0) — VAZE SAMO za izbor i
ocene oblasti. Lista u tabu "Tranziti" ide orbisom liste (`LISTA_ORB`: 3°, sekstil 2°), kao i
"Danas ukratko". TRAJANJE ("Traje jos N", opseg datuma) se racuna ISKLJUCIVO kroz
`trajanjeTranzita` (`lib/oblasti.ts`), orbisom liste, na svakom ekranu — do 29.9.2026 su lista
i ceo tekst istog tranzita pokazivali razlicit broj dana (Ivan). Provera: `check:oblasti`, deo 7. Bodovanje tezina x aspekt x meta (x1,3 za Sunce,
Mesec, ASC, MC i VLADARA) x blizina x momenat; brze odmor 3 dana, spore samo na dan
pocetka/egzaktnosti/kraja uz odmor 7, Mesec samo egzaktan. Vladar = TRADICIONALNI vladar
Ascendenta (`lib/rulers.ts`, `RULER_SYSTEM`). Ton: `lib/tone.ts`. Dnevnik:
`store/tvoj-dan-log.ts` (dan -> tranzit; broj prikaza bira stavku iz duge verzije).
DNEVNICI (oba) PRIPADAJU NALOGU, ne telefonu (29.9.2026): nose `userId`, tudji se cita kao
prazan, pri odjavi se brisu — ranije je drugi nalog na istom telefonu nasledjivao pauze.
DANAS na tabovima je `useDanas()` (`store/danas.ts`), NE `useMemo(() => new Date(), [])`:
tab ostaje montiran, pa je aplikacija ostavljena preko noci ujutru pokazivala jucerasnji dan.
Testovi: `npm run check:tvoj-dan`. Pregled sa ASC u Ribama: `/dev-kartice` (samo dev).
ARHIVA — do 29.9.2026 besplatni su videli Hero; kod (`pickHero`) i testovi ostaju:
`pickHero` u `lib/transits.ts` (specifikacija 26.9.2026): 1) jak aspekt (orb <= 1,5°,
`STRONG_ORB`) na VLADARA Ascendenta ili Sunca -> 2) tranzit na Ascendent, MC, Sunce
ili Mesec -> 3) najegzaktniji tranzit na bilo koju natalnu planetu -> 4) Hero se ne
prikazuje. Unutar prioriteta pobedjuje NAJMANJI ORBIS (skor iz `findTransits` mesa
tesnocu sa tezinama i ostaje samo za redosled liste u tabu "Tranziti"). Racuna se za
LOKALNU PONOC, da Hero bude isti ceo dan. Bez vremena rodjenja ASC i MC otpadaju iz
svih prioriteta. Vladar znaka je `SIGNS[].rulerKey`.

MESEC NE ULAZI U HERO — ima svoju karticu. PAUZA OD 7 DANA (`HERO_PAUSE_DAYS`):
tranzit prikazan u poslednjih 7 dana se preskace i pusta se sledeci po istom
redosledu, osim na DAN EGZAKTNOSTI (`exactDayKeys`: orbis nije veci nego dan pre ni dan
posle, i <= 1,5°). Do 27.9.2026 pauzu je probijao svaki dan sa orb < 0,3°, pa je spor
Saturn bio Hero nedelju dana zaredom (Ivan). Kljuc prikazan DANAS nikad nije na
pauzi. PREGLED DRUGIH DANA (dan-meni) koristi `heroHistoryFor`: dnevnik se odigra kao
da je aplikacija otvarana svaki dan, inace bi juce/sutra ponavljali danasnji Hero. Dnevnik je `store/hero-log.ts`, LOKALNO u AsyncStorage-u — telefon i web mogu
istog dana da pokazu razlicit Hero; ako zasmeta, dnevnik ide u bazu, oblik ostaje.
Testovi: `npm run check:natal`, deo 9.

"DANAS UKRATKO" (`pickBrief`, `briefBucket`): ide ti / koci te po ASPEKTU — trigon i
sekstil skladni, kvadrat i opozicija napeti, konjunkciju deli tranzitna planeta
(Sunce, Merkur, Venera, Jupiter -> ide ti; ostale -> koci te; PRAVILO CEKA POTVRDU
ASTROLOGA). Prikazuje `positive` odnosno `challenge` recenicu kratkog teksta, bez
Hero-a i bez Meseca, po orbisu; tranzit bez teksta se preskace. Testovi: deo 9b.

**19. Bez interneta aplikacija radi sa onim sto je vec stiglo (29.9.2026).**
Racun je ionako lokalan. Tri stvari su zavisile od mreze i sad imaju rezervu:
SESIJA — `useAuthListener` cita sacuvanu sesiju sa diska ODMAH; `getSession()` bez
mreze ~25 s ponavlja obnovu tokena i onda vrati `null`, pa je kapija slala korisnika
na welcome. Greska MREZE (`isAuthRetryableFetchError`) sesiju ne brise; brise je samo
pravi odgovor servera. TEKSTOVI — `lib/kes-na-disku.ts`: sve sto je server vec poslao
(tranziti, ton, lunarni, natalni), do 300 stavki i 14 dana, kljuc sadrzi nalog i pravo
pristupa. Disk je REZERVA: upit ide pri svakom pokretanju, "nema teksta" se ne pamti.
PRAVO PRISTUPA — poslednje sa servera, najvise 7 dana i nikad posle `expiresAt`, SAMO za
prikaz; `fetchEntitlement` vraca `null` na gresku mreze (ne "besplatno"). Ne otkljucava
nista novo — duge tekstove i dalje salje samo server (pravilo 8). Sve troje se brise
pri odjavi i brisanju naloga. Traku "Nema interneta" crtaju `Screen` i `SheetScroll`
(`components/bez-interneta.tsx`); mreza je `lib/mreza.ts` — BEZ nativnog modula
(`expo-network` Expo Go NEMA): zakljucuje se iz Supabase zahteva (`pratiFetch`). Bez mreze se ne pise "tekst nije napisan" — kaze se da ce stici.

**20. Uvod pri pokretanju: prvi kadar = sistemski splash (28.9.2026).**
`components/uvod.tsx`, racun u `lib/uvod.ts` (varijanta "Krug se otvori", po Lumi):
krug loga se zavrti brzo (~1,2 s), pa uspori i vrti se polako DOK SE CEKA (Ivan,
29.9.2026), na vrhu se pojavi preliv (isti kao na pocetnoj); kad je aplikacija spremna — zalet, krug se pretopi a iz sredine se siri
krug-prozor BEZ OBODA kroz koji je vec aplikacija. Bez cekanja ~1,3 s. Vrtenje je
`logo-krug-uvod.json` (`python3 scripts/logo/build-krug-uvod.py`): isti krug kao
logo, okret koji ne staje. Ivan je istog dana ODBIO, ne vracati: sjaj IZA kruga,
dvostruki prsten loga kao ivicu prozora, i talas znakova oko kruga (pokret iz
loadera sa sajta) dok se ceka. Tri stvari se ne krse:
SPLASH = PRVI KADAR. `app.json` splash je `#F6F7F8` + `splash-krug.png` sirine
`UVOD_KRUG` (180); slika se crta iz `logo-krug.json` (`swift scripts/logo/build-splash.swift`),
ne iz brend SVG-a. Splash se sklanja tek kad Lottie javi da je ucitan. Menja se
krug ili velicina -> ponovo obe skripte; `check:uvod` drzi app.json, krug i prozor.
UVOD SAMO POKRIVA. Ne preusmerava (pravilo 11), ceka isto sto i kapija (pismo,
sesija i profil sa diska) i NIKAD mrezu. APLIKACIJA SE MONTIRA TEK KAD UVOD KRENE
(`onPocetak`): njeno prvo crtanje zauzme JS, pa je krug u simulatoru stajao 1,5 s pre
okreta. Zato je vrtenje ceo u Lottie JSON-u, a zalet i otvaranje se zakazuju na
niti za animaciju — nista od pokreta ne ceka JS.
Uz "Smanji pokrete" uvod se samo pretopi. U Expo Go-u je splash Expo Go-ov (ikonica +
ime); spoj splash -> uvod se vidi tek u dev buildu.

**21. Pitaj astrologa (29.9.2026): pitanje -> placanje -> glasovni odgovor.**
Tab "Pitaj" ima dve strane: "Pitaj čoveka" (Boban Vujović, `ASTROLOG` u `lib/pitanja.ts`)
i "Pitaj AI" (uskoro). ROKA NEMA (Ivan): "obicno za 2—3 radna dana" je samo tekst —
nema kolone za rok, statusa "kasni" ni kredita za zakasneli odgovor. Ne dodavati.
TOK: `draft` -> `paid` -> `answered` (+ `refunded`). Pitanje se PRVO cuva kao nacrt
(`sacuvaj_nacrt`, sa snimkom karte), pa ide placanje; jedan nacrt po nalogu. Dok se kuca,
tekst je i na telefonu (`pitanje-lokalno.ts`, brise se pri odjavi).
KO STA PISE (kao pravilo 8): korisnik samo kroz `sacuvaj_nacrt` i `posalji_kreditom`;
za tabele NEMA politike za upis i prava su oduzeta. `paid` upisuje server (webhook, jos
ne postoji) ili kredit. Astrolog (`astrolozi`, `je_astrolog()`) vidi SAMO poslata pitanja
i odgovara kroz `odgovori_na_pitanje`, koja proveri da snimak postoji.
ZVUK: privatno skladiste `odgovori/<korisnik>/<pitanje>.m4a|mp3`, u bazi PUTANJA (ne
link); aplikacija pusta preko potpisanog linka (sat). SAMO m4a, mp3 ili aac — iPhone ne
pusta WebM ni ogg/opus; panel snima u MP4, ili astrolog OTPREMI snimak sa telefona
(Diktafon, Android snimac; `vrstaSnimka` u `panel/src/pomoc.ts` kaze zasto format ne prolazi). iOS
plejer trazi fajl deo po deo (HTTP Range) — Supabase to ume, obican probni server ne.
Brisanje naloga brise i snimke (`delete-account`, pre naloga).
STRANA (Ivan, 29.9.2026): bez pitanja stoji uvod (`components/pitaj-uvod.tsx`: astrolog,
uslovi, cena) i "Pitaj"; sa pitanjima samo "Postavi pitanje" + "Moja pitanja", a uvod je
prvi korak lista (`/pitanje-novo?korak=uvod`). NOV ODGOVOR = snimak bez `procitano_at`:
broj u indigo krugu na tabu (`NativeTabs.Trigger.Badge`; kad je 0 ne salje se tekst —
`hidden` sam ostavlja "0") i indigo tackica u listi (`brand.indigo`). `oznaci_procitano` pri otvaranju
pitanja; bez push-a se lista osvezava kad se aplikacija vrati u prvi plan.
PLACANJE JOS NIJE UKLJUCENO: `lib/kupovina.ts` vraca `nedostupno`, cena se ne prikazuje
(dolazi SAMO iz RevenueCat Offerings, `question` / `question_member`; Premium po
`useEntitlement()`, da i poklon dobije nizu cenu). PRIVREMENO: probna cena `PROBNA_CENA`
(i probni Premium paketi) u `kupovina.ts`, samo za izgled — u razvoju (`__DEV__`) i u probnom
buildu sa `EXPO_PUBLIC_PROBNE_CENE=1` (lokalni `.env` za Xcode, EAS `development`/`preview`);
EAS `production` ga NEMA. Ide napolje sa RevenueCat-om. Do tada se salje samo kreditom:
`select admin.daj_pitanje('email')`. Push jos nema — ekran zato ne kaze "javicemo ti".
MEJL ASTROLOGU (Ivan, 29.9.2026): pitanje predje u `paid` -> okidac (`pitanja-obavestenja.sql`,
`pg_net`) -> funkcija `obavesti-astrologa` -> SendGrid, svim astrolozima. Samo ime, vreme i
link — bez teksta pitanja i podataka o rodjenju; bez pracenja klikova. Tacno jednom po
pitanju: funkcija ga "zauzme" upisom `obavesteno_at`; neuspeh vrati NULL (log funkcije).
Funkcija je bez tokena (`--no-verify-jwt`) — telu veruje samo id. Sadrzaj: `_shared/obavestenje.ts`.
PANEL (`panel/`, `npm run panel`): prijava kodom (`shouldCreateUser: false`), Turnstile
kao u aplikaciji — widget za `astroshop.rs` vazi i za poddomen, za `localhost` se mora
dodati u Cloudflare-u. `#/proba` = izmisljena pitanja bez prijave, samo u razvoju.
NATALNI KRUG u panelu (`panel/src/tocak.tsx`, Ivan 29.9.2026): isti crtez kao
`natal-wheel.tsx`, ali u SVG-u pregledaca. Geometrija (`wheel.ts`), izgled
(`tocak-stil.ts`) i znakovi (`znak-oblici.ts`) su zajednicki; kad se RASPORED tocka u
aplikaciji promeni, ista izmena ide i u panel. Karta se racuna iz podataka o rodjenju
(`buildNatalChart`, kao `resolveProfile`); bez vremena rodjenja bez kuca, ASC/MC i
Mesecevih aspekata, a bez pouzdane zone tocka nema.
Uloga u panelu se samo prikazuje; kapija je RLS. Testovi: `check:pitanja`,
`check:pitanja-baza` (SQL u PGlite-u, sa Supabase delovima napravljenim u testu).

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
npm run check:tokens      global.css se nije razisao sa theme/tokens.ts
npm run check:ephemeris   pozicije planeta
npm run check:natal       ascendent, MC, Placidus kuce, tranziti
npm run check:timezone    vreme rodjenja -> UTC
npm run check:sky         cvor, Lilit, Tacka srece, kuce (prema astro-seek-u)
npm run check:cities      predlozi gradova + da se pretraga nije suzila
npm run check:lunarni-kalendar mreza meseca, glavne faze po danima, pomeranje dana (ekran Mesec)
npm run check:natal-tekst kljucevi natalnih tumacenja postoje u korpusu (files/natal-texts.csv)
npm run check:oblasti     lista Tranziti, ocene oblasti, mnozina, naslov tumacenja
npm run check:uvod        uvod: splash u app.json, krug i vrtenje iz logo-krug-uvod.json, prozor
npm run check:pitanja     Pitaj astrologa: provera pitanja, snimak karte, natpisi
npm run check:pitanja-baza pitanja.sql u PGlite-u: ko sme sta (RLS, funkcije, skladiste)
npm run panel             panel za astrologa na http://localhost:5180 (#/proba bez prijave)
npm run panel:build       panel za objavu -> panel/dist
```

## Jos nije uradjeno

- [x] Auth (Supabase) — registracija, prijava, odjava, sinhronizacija profila
- [x] `supabase/schema.sql` pokrenut — tabele postoje, RLS provoren (anon ne vidi tudje redove)
- [ ] Apple i Google prijava — dugmad postoje, ceka dev build. Xcode JE instaliran
      (26.6, od 28.9.2026), ali Sign in with Apple trazi placeni Apple nalog — besplatni
      tim tu mogucnost nema. Build za prodavnicu ide preko EAS Build-a.
- [x] SMTP (SendGrid) + `{{ .Token }}` u sablonu **Magic Link** — dok je "Confirm
      email" iskljucen, Supabase salje samo taj sablon, "Confirm signup" se ne koristi
- [x] Turnstile — widget, `captchaToken` u oba poziva, provera upaljena u Supabase-u
- [ ] Osobine po znaku od astrologa (`lib/traits.ts`) — 12 x 3 reda, mali posao
- [x] ETL korpusa — .docx fajlovi parsirani (`scripts/korpus/parse_docx.py`),
      tekstovi u `transit_texts`. Pokrivenost: `python3 scripts/korpus/izvestaj.py`.
      Duge verzije stigle 27.9.2026 (i Mesec, ASC i MC) — 593/597. Uvezeno 27.9.2026:
      short 596 (od toga 160 NACRTA sazetih iz dugih — Ivan odobrio, cekaju astrologa),
      long 595. Lektura (775 ispravki) u `ispravke.json` pored .docx, ne u repou.
- [ ] MESEC — duga 50/50; kratke su NACRTI (sazeti iz dugih, u bazi) dok ih
      astrolog ne potvrdi. Spisak: `python3 scripts/korpus/izvestaj.py`
      Predlog "Mesecev naslov dana" (Co-Star analiza, oblik teksta, varijante):
      `docs/ASTRO-LOGIKA.md`, poglavlje 10.
- [ ] Ascendent i MC kao meta — duga 99/100 stigla 27.9.2026, kratka 0/100.
      ODLUCENO 23.9.2026: ostaju u proracunu. Ako kratke ne stignu, izbaciti ih iz
      `transits.ts`. Dotle nije kvar — `daily.tsx` tranzit bez teksta prikazuje
      kao sazet red, ne kao praznu karticu.
- [x] "Trenutno na nebu" (peti tab) — nebo SADA nad gradom iz profila: tocak,
      planete sa kucama, cvor/Lilit/Tacka srece, aspekti, pomeranje vremena,
      izbor mesta posmatranja. Bez tumacenja — prikazuje
      se samo ono sto se racuna. Lokacija je grad iz profila, bez `expo-location`:
      razlika izmedju dva grada u Srbiji se na ekranu ni ne vidi, a sistemska
      dozvola bi trazila razlog i objasnjenje u prodavnici. Grad se moze promeniti
      rucno (`/sky-place`, `store/sky-place.ts`) — kroz ISTU pretragu kao onboarding,
      ali u zasebnom store-u: mesto rodjenja se menja jedino u `/edit`, jer od njega
      zavisi natalna karta. Pozicije tela su geocentricne i sa mestom se ne menjaju;
      menjaju se uglovi, kuce i dnevna/nocna formula za Tacku srece.
- [x] Pomeranje vremena na tom ekranu (Ivan, 28.9.2026): ispod sata DVA STAKLENA
      DUGMETA — datum (sa godinom) otvara KALENDAR (`sky-datum.tsx`, list odozdo; na
      Androidu sistemski dijalog), mesto otvara izbor grada (`sky-place.tsx`, list
      odozdo). Ispod njih "‹ dan  ‹ sat  Trenutno  sat ›  dan ›" u staklu (`GlassBubble`).
      Cim se vreme pomeri, minutno osvezavanje staje i "Trenutno" postaje aktivno —
      ekran ne sme da tvrdi da je sadasnjost. Pomeren trenutak je u `store/sky-time.ts`
      (menja ga i kalendar), BEZ persist: posle pokretanja opet sadasnjost.
      Dan i dan iz kalendara idu preko ZID-SATA (`shiftDays`, `naDan`), pa u noci kad
      se pomera sat i dalje pogadjaju isti sat; sat je prostih 60 minuta stvarnog
      vremena, jer u satu koji se ponovi isti zid-sat postoji dvaput. Kalendar radi u
      zoni UREDJAJA, pa dobija NOSILAC DANA (`danZaKalendar`), ne trenutak — korisniku
      u dijaspori zone se razlikuju. Provera: `check:sky`, deo 6.
      Ekran je stilizovan kao natalna karta (redovi iz `components/karta-lista.tsx`),
      ali BEZ velike trojke — samo lista (Ivan, 28.9.2026).
- [ ] Kiron — jedino telo sa referentnog snimka koje ne prikazujemo. Nema ga u
      `astronomy-engine` (nije ni geometrijska tacka kao cvor), pa mu treba zasebna
      efemerida. Kad stigne: i font se mora presloziti, ⚷ u njemu ne postoji
      (SVG ikonica vec postoji u `planeta-ikona.tsx`).
- [ ] Natalna tumacenja (stigla 27.9.2026) — parser `scripts/korpus/natal.py`,
      tabela `supabase/natal-texts.sql`, CSV `files/natal-texts.csv` (496). Kljucevi
      `natal.sun.sign.aries` / `natal.sun.house.1` / `natal.moon.square.sun`.
      Besplatno Sunce, Mesec i podznak u znaku. FALI: podznak 0/12, aspekti na MC.
      Jos nije: uvoz u bazu, lektura, prikaz u tabu "Ti".
- [ ] RevenueCat: subscription + one-time, entitlement na serveru
- [ ] Pitaj astrologa (pravilo 21) — URADJENO: baza (`pitanja.sql`), tab, pisanje, odgovor
      sa plejerom, panel. FALI: pokrenuti `pitanja.sql` + deploy `delete-account`; nalog za
      Bobana + `admin.dodaj_astrologa`; RevenueCat (consumable `question`/`question_member`,
      webhook NON_RENEWING_PURCHASE -> nacrt u `paid`, bez nacrta -> kredit, jedinstven
      transaction_id, povracaj -> `refunded`); push kad stigne odgovor; MEJL: SendGrid kljuc
      (Mail Send) kao tajna `SENDGRID_API_KEY`, deploy `obavesti-astrologa --no-verify-jwt`,
      pa `pitanja-obavestenja.sql` (i `PANEL_URL` dok panel nije na panel.astroshop.rs); objava panela
      (`panel.astroshop.rs`); politika privatnosti i uslovi (astrolog vidi podatke o
      rodjenju, cuva se snimak).
- [x] Brisanje naloga u aplikaciji — Edge Function `delete-account` deplojovana,
      dugme u `profile.tsx`. Zatvara Apple zahtev 5.1.1(v). Funkcija koga brise
      cita ISKLJUCIVO iz tokena; anon kljuc je validan JWT i prolazi platformsku
      proveru, pa je `getUser()` u kodu jedina prava kapija — ne uklanjati je.
- [ ] Objaviti `web/` na Cloudflare Pages (`pravila.astroshop.rs`) — popuniti
      podatke o pravnom licu, napraviti aliase, dati pravniku. Vidi `web/README.md`.
      ODLUCENO 23.9.2026: bez `.well-known` fajlova — sajt radi nezavisno od
      aplikacije i link ka `astroshop.rs` NE SME da otvara app.
- [ ] Push notifikacije
- [x] Kartica MESEC na pocetnom ekranu, posle "Danas ukratko" — faza, znak (i sat
      prelaska u sledeci), najjaci Mesecev tranzit DANA: `moonDay` u `transits.ts`
      trazi aspekte koji postaju egzaktni izmedju dve lokalne ponoci, pa je kartica
      ista ceo dan. "Najjaci" = tezina natalne mete, pa aspekt (konj. > opoz. >
      kvadrat > trigon > sekstil), pa raniji sat — MOJ IZBOR, ceka astrologa. Na
      0—9 dana godisnje nema nijednog egzaktnog aspekta; tada samo faza i znak.
      Red vodi na tumacenje tek kad tekst postoji. Testovi: `check:natal`, deo 9e.
- [x] "Promene na nebu" na pocetnoj, posle kartice Mesec (`lib/sky-events.ts`): do tri
      planete, svaka sa PRVIM sledecim dogadjajem — ulazak u znak, postaje retrogradna ili
      ponovo direktna — po datumu, sa trajanjem (do izlaska iz znaka / do stanice
      direktno; direktno kretanje nema kraj). Licni deo je
      kuca OD PODZNAKA (Whole Sign), jer tada ulazak u znak = ulazak u kucu; bez vremena
      rodjenja kuce nema. Bez Meseca. Tekstova "planeta u kuci" nema (120, ceka
      astrologa) — redovi ne vode nigde. Testovi: `check:natal`, deo 9f.
- [x] Mesec, drugi krug (27.9.2026): na pocetnoj crtez faze + procenat + znak, bez
      kruzica sa podacima (Ivan); red "Ljubav danas" se pojavi kad stignu saveti.
      Ekran Mesec (`app/moon.tsx`): veliki crtez, lunarni dan, do kad je u znaku,
      sledeci mlad/pun, cetiri podatka (Mesec %, znak, deo biljke, element), tabovi
      Ljubav/Zdravlje/Karijera/Kuca/Basta, svi Mesecevi tranziti dana. Deo biljke po
      elementu (biodinamicki: vatra plod, zemlja koren, vazduh cvet, voda list) —
      CEKA POTVRDU ASTROLOGA. Testovi: `check:natal`, deo 9g.
- [x] Lunarni kalendar (28.9.2026) — AKTUELNI tekstovi astrologa u
      `~/Desktop/Astroshop App/Lunarni kalendar/` (7 faza x 12 znakova x 5 oblasti = 420).
      Stari `~/Desktop/Astroshop/lunarni/` (2019) se NE uvoze. Kljuc `lunar.<faza>.<znak>.<oblast>`,
      faza i znak iz `phaseDay()` (moon.ts) — isti izvor za karticu i ekran Mesec. BESPLATNO za
      prijavljene (`supabase/lunar-texts.sql`), ceo tekst (uvod + "• Naslov – tekst").
      Parser + lektura (899 ispravki) + CSV: `python3 scripts/korpus/lunarni.py`.
      Otvoreno za astrologa: Opadajuci u Jarcu/Zdravlje se prekida usred recenice;
      Opadajuci srp u Lavu pominje "Pun mesec" umesto Mladog.
- [x] Astroloski font — `assets/fonts/AstroGlyphs.ttf` (5,6 KB), 30 znakova iz tri
      Noto izvora. Sklapa ga `scripts/font/build-astroglyphs.py`, koji spisak znakova
      cita IZ KODA. Ako se doda novo telo, font se MORA presloziti — novog znaka u
      njemu nema. Skripta podrazumevano samo DOPUNJUJE postojeci font; sklapanje
      iznova bi promenilo izgled 16 starih simbola, jer se danasnji staticki Noto
      razlikuje od varijabilnog iz kog su prvobitno izvuceni. Razlozi i merenja:
      `assets/fonts/POREKLO.md`.
- [ ] Proveriti kako izgledaju ASC i MC — oni idu kroz `<Glyph>` kao obicna slova
      (`transits.ts:45`), a font nema latinicu, pa ih sistem crta rezervnim fontom.
      Ako odudaraju, prikazivati ih kroz obican `<Text>`.
