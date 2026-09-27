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
    sky-place.tsx    izbor mesta odakle se gleda nebo (NE dira profil)
    (onboarding)/    welcome, date, time, place, reveal, account, code, name, push
    moon.tsx         ekran Mesec — otvara se sa kartice na pocetnoj (?day=pomeraj)
    profile.tsx      profil — NIJE tab, otvara se dugmetom gore desno (nazad gore levo)
    (tabs)/          home (Danas), daily (Tranziti), ask (Pitaj), chart (Ti), sky (Nebo)
  theme/
    tokens.ts        IZVOR ISTINE za boje, pismo i mere (vidi DESIGN.md)
  components/
    screen.tsx           okvir ekrana — preliv, zamucena traka, skrol, siva pozadina
    onboarding-step.tsx  zajednicki okvir svih koraka
    natal-wheel.tsx      SVG tocak natalne karte
    moon-disc.tsx        crtez Meseca u trenutnoj fazi (crno-belo, ne lila)
    celestial-orb.tsx    proceduralno nebesko telo (onboarding)
    turnstile.tsx        CAPTCHA kapija pred slanje koda
    ui/                  text, button, card, input, list, chip, glyph, row, wheel-picker
  store/
    draft.ts         onboarding pre naloga — BEZ persist (prekid = ispocetka)
    profile.ts       podaci o rodjenju, kes servera
    auth.ts          sesija + pravo pristupa
    sky-place.ts     mesto posmatranja, null = grad iz profila
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
    cities.ts        ugradjena lista gradova + predlozi (najveci u Srbiji)
    traits.ts        osobine po znaku — PRIVREMENO, ceka astrologa
    horoscope.ts     composer                   <- ovde ulazi korpus
    supabase.ts      klijent
    sync.ts          profil <-> server
supabase/
  schema.sql         tabele + RLS politike
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
ne izabrane. Pismo je SISTEMSKO (SF Pro na iOS-u, Roboto na Androidu) —
`fontFamily` se nigde ne postavlja, debljina ide obicnim `font-semibold` i
slicnima. Sa snimaka se Inter i SF Pro ne mogu razlikovati (merenja su u
`DESIGN.md`); presudilo je to sto je referenca nativna iOS aplikacija i sto
izvedene velicine padaju tacno na iOS-ovu lestvicu. Zlatna (`--gold`) se koristi ISKLJUCIVO kao akcenat na placenom sadrzaju
— nigde drugde, da paywall ostane jedina stvar koja "svetli" na stranici. Tamna
tema je i dalje definisana pod `.dark:root` ako je ikad budemo ponudili kao
opciju; `_layout.tsx` je zakljucan na `colorScheme.set('light')`.

Svaki kljuc dodat u `tailwind.config.js` MORA da se pojavi i u spisku u
`src/lib/utils.ts`. Bez toga `tailwind-merge` svrsta klasu u pogresnu grupu —
`text-button` prodje kao boja teksta i pojede belu na crnom dugmetu.

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

UNUTRASNJE STRANE (`pushed`: profil, tumacenje, Mesec, mesto, izmena) imaju svoje
zaglavlje, isto za sve (Ivan, 27.9.2026): strelica nazad + ime strane u istoj liniji,
BEZ loga i BEZ preliva (izuzetak: Mesec ima ljubicasti, `tint="purple"`). Strelicu
crta `Screen` sam — ekran je ne salje.

Merenja i cela slika su u `DESIGN.md`, poglavlje 5.

**17b. `docs/ASTRO-LOGIKA.md` je opis SVE astroloske logike za astrologa.**
Svaka promena pravila, orbisa, tezina ili izbora (Hero, sazetak, Mesec, kuce) se
upisuje i tamo, u istom commitu — inace astrolog proverava zastarelo stanje.

**18. Tranzit dana se bira waterfall-om prioriteta, ne po skoru.**
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
- [x] ETL korpusa — .docx fajlovi parsirani (`scripts/korpus/parse_docx.py`),
      tekstovi u `transit_texts`. Pokrivenost: `python3 scripts/korpus/izvestaj.py`.
      Duge verzije stigle 27.9.2026 (i Mesec, ASC i MC) — 593/597; NIJE JOS UVEZENO.
- [ ] MESEC — duga verzija stigla (50/50), KRATKE NEMA NIJEDNE. 50 kratkih
      CEKA astrologa. Spisak: `python3 scripts/korpus/izvestaj.py`
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
- [x] Pomeranje vremena na tom ekranu — dugmad za SAT i DAN, plus "Trenutno" za
      povratak. Cim se vreme pomeri, minutno osvezavanje staje i naslov se menja u
      "Nebo u izabranom trenutku" — ekran ne sme da tvrdi da je sadasnjost.
      Dan ide preko ZID-SATA (`shiftDays`), pa u noci kad se pomera sat i dalje
      pogadja isti sat; sat je prostih 60 minuta stvarnog vremena, jer u satu koji
      se ponovi isti zid-sat postoji dvaput. Mesec i godina nisu dodati.
- [ ] Kiron — jedino telo sa referentnog snimka koje ne prikazujemo. Nema ga u
      `astronomy-engine` (nije ni geometrijska tacka kao cvor), pa mu treba zasebna
      efemerida. Kad stigne: i font se mora presloziti, ⚷ u njemu ne postoji.
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
- [ ] Tekstovi za karticu Mesec — tekstova
      za Mesec kao tranzitnu planetu ima samo duga verzija (kratka 0/50), a tekstovi lunarnog kalendara
      (`~/Desktop/Astroshop/lunarni/`, 12 znakova x 5 oblasti) NISU najnoviji — ne uvoziti
      dok Ivan ne posalje aktuelne.
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
