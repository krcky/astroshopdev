# Prevod aplikacije — kako tekst ide kroz rečnik

Cilj prvog koraka (1.10.2026): sav tekst koji korisnik vidi je u rečniku `src/i18n/sr/`, a
aplikacija izgleda ISTO kao pre. Drugi jezici (hr, bs, sl, mk, en) su posle toga samo novi
rečnici iste oblike.

## Gde je šta

| Fajl | Šta |
|---|---|
| `src/i18n/jezik.ts` | tekući jezik, `tr()`, `registrujJezik`, spajanje sa srpskim. Čist modul (pravilo 6). |
| `src/i18n/use-t.ts` | `useT()` za komponente |
| `src/i18n/sr/index.ts` | srpski rečnik = OSNOVA i TIP (`Recnik`) svih jezika |
| `src/i18n/sr/opste.ts` | reči sa mnogo ekrana: Nastavi, Sačuvaj, Otkaži… |
| `src/i18n/sr/gramatika.ts` | množina (`dana`, `meseci`, `tranzita`, `mnozina`), `veliko`, `locale` za `Intl` |
| `src/i18n/sr/datum.ts` | imena dana i meseci, OBLIK datuma ("Uto, 29. sep 2026") |
| `src/i18n/sr/nebo.ts` | planete, tačke, aspekti, znakovi sa padežima, faze Meseca, `uZnaku` / `uZnak`; PADEŽI planeta (sa rodom) i aspekata: `padeziTela`, `padeziAspekta` |
| `src/i18n/sr/<deo>.ts` | po delu aplikacije: `onboarding`, `profil`, `pitaj`, `prica`, `danas`, `karta` |

## Pravila

1. **Tekst se ne piše u ekranu.** Komponenta: `const t = useT();` (iz `@/i18n`), pa
   `t.profil.naslov`. Van komponente (`lib/`, store, funkcija van crtanja): `tr()` iz
   `@/i18n/jezik`, pozvan U TRENUTKU kad tekst treba.
2. **Nikad preveden tekst u konstanti na nivou modula.** Modul se izvrši jednom, pre nego što
   se jezik postavi. Konstanta sa tekstom postaje funkcija ili getter
   (`get name() { return tr().nebo.tela[key]; }` — tako rade `SIGNS`, `BODIES`, `ASPECTS`, `POINTS`).
3. **Cela rečenica je jedna stavka.** Ako rečenica nosi promenljivu, stavka je funkcija:
   `trajeJos: (koliko: string) => \`Traje još ${koliko}\``. Ne lepiti delove u ekranu —
   drugi jezik ima drugi red reči.
4. **Gramatika iz rečnika:** planeta ili aspekt u padežu NIKAD ručno — `t.nebo.padeziTela[key].instrumental`, `t.nebo.padeziAspekta[key].lokativ`, a rod planete (`rod`: m/z/s) bira "tvojim / tvojom". množina `t.gramatika.dana(n)`, `meseci(n)`, `tranzita(n)`, a nova
   reč uz broj je funkcija u svom delu, preko `mnozina` iz `./gramatika`. Znak u padežu:
   `t.nebo.uZnaku(key)` ("u Lavu"), `t.nebo.uZnak(key)` ("u Lava"), ili
   `t.nebo.znaci[key].lokativ`. Ime planete: `.name` (getter) ili `t.nebo.tela[key]`.
5. **Datum samo kroz `lib/horoscope.ts`** (`datum`, `formatDate`, `opsegDatuma`…) — oni već čitaju rečnik.
6. **Tekst ostaje ISTI, znak po znak** (dijakritika, crte —/–, tačke, razmaci).
7. **Ključevi** su kratki, camelCase, srpski bez dijakritike; jedan pod-objekat po ekranu ili
   komponenti, sa komentarom koji fajl ga koristi. Komentar za prevodioca samo gde kontekst
   nije očigledan ("verzal", "mora u jedan red", "prvo lice — ide na karticu za deljenje").
8. **Šta je tekst za korisnika:** JSX tekst; `title`, `label`, `subtitle`, `placeholder`;
   `accessibilityLabel` / `accessibilityHint`; `Alert.alert`; tekst deljenja i obaveštenja;
   poruke greške koje se prikazuju; ime fajla koje korisnik vidi ("Astro Shop <dan>.png").
   **Nije:** komentari, `console.*`, ključevi, klase, putanje, kodovi grešaka, dev ekrani
   (`app/dev-*.tsx`), korpus astrologa i podaci sa sajta (`simbolika.ts`, `znak-opis-podaci.ts`,
   `traits.ts`) — to je sadržaj i prevodi se u drugom koraku.

## Provera

```bash
npm run check:prevod
```

Skener čita svaki fajl kao TypeScript stablo i pada na JSX tekst ili string sa srpskim slovom
van rečnika. String BEZ dijakritike ("Profil") ne vidi sam; `--svi` ispisuje i sve stringove sa
razmakom i velikim slovom, za ručni pregled.

## Šta je ostalo van rečnika (namerno)

- Nativni tekst: ime ispod ikonice (`app.json`), sistemski upiti za dozvole (`infoPlist`),
  kanal obaveštenja u Kotlinu i Swift modulima. Za njih Expo ima `locales` u `app.json`.
- Mejl sa kodom (Supabase šablon, jedan za sve) i panel astrologa (ostaje srpski).

## Glas (srpski) — opcija A, 2.10.2026

Izabrano: **prijatelj koji zna**. Topao i direktan, "ti", kratke rečenice, objašnjava umesto da glumi. Bez uzvika, bez
laskanja, bez obećanja ishoda ("tumači, ne proriče").

- Dugme kaže šta će se desiti: "Izračunaj moju kartu" (welcome), "Sačuvaj moju kartu" (reveal), "Otključaj ceo tekst",
  "Otključaj sve".
- Zaglavlje paywalla je ishod: "Cela slika tvog dana". Stavke: Piše astrolog, Ceo tekst dana, Natalna karta (ostaje taj
  naziv), Tvoji ljudi.
- Zaključano: "Ovo je kratka verzija. U celoj piše šta se dešava, koliko traje i šta možeš da uradiš." Reč "tranzit" se ne
  koristi dok nije objašnjena; zaključani redovi se broje kao "teksta" (`gramatika.teksta`).
- Odbačeno: B (urednički, tiši), C (razigran), D (Bobanov glas u prvom licu — samo uz njegov pristanak, i samo tamo gde
  Boban zaista govori).
- Isti glas u hr, bs, en, sl i mk (preveden 2.10.2026). Hr/bs: "račun", "mobitel" / "telefon".

Otvoreno: broj "oko 1.500 tumačenja" i "nijedno nije generisano" (Boban potvrđuje); korpus je na "Vi" — i jedna fraza astrologa
("Sa vama nikada nije dosadno") je u `natal-podnaslovi.py` prilagođena na "ti".

## Engleski (korak 2, 1.10.2026)

`src/i18n/en/` je CEO rečnik (tip `Recnik`, ne dopuna) — TypeScript pada čim ključ fali ili funkcija ima
drugi oblik nego u srpskom. Izbor jezika je u profilu, sekcija "Test" (samo probni build): tekstovi
astrologa (tranziti, natal, lunarni, priča o znaku) su još samo na srpskom. Bez ručnog izbora jezik
se uzima iz telefona: naš jezik na spisku željenih jezika, pa REGION telefona, pa engleski
(`i18n/jezik-uredjaja.ts`, 2.10.2026) — srpski region sa engleskim telefonom daje srpski. Ručni izbor
(prvi ekran, profil) uvek pobeđuje i pamti se (`store/jezik.ts`).

### Glas (English voice)

Same rules as Serbian (`copywriter-sr` skill): informal "you", the app INTERPRETS, never predicts
("the sky shows", not "fate brings"), no exclamation marks, no flattery, short sentences, sentence case
for titles and buttons ("Your day", not "Your Day"). Plain English for a lay reader; a term is explained
the first time it appears, exactly as the Serbian does. British/US neutral spelling where possible;
when it matters, US ("color", "favorite").

### Pojmovnik (glossary) — use EXACTLY these

| Srpski | English |
|---|---|
| Tvoj dan / Moj dan (kartica) | Your day / My day |
| Danas, Tranziti, Pitaj, Ti, Nebo (tabovi) | Today, Transits, Ask, You, Sky |
| Danas ukratko | Today at a glance |
| Ide ti / Koči te (prvo lice: Ide mi / Koči me) | Going your way / Holding you back (Going my way / Holding me back) |
| Natalna karta | Birth chart |
| tumačenje | reading |
| Velika trojka | Big Three |
| Ascendent / podznak | Ascendant / rising sign ("Rising" as a short label) |
| MC | MC (Midheaven when spelled out) |
| kuća (5. kuća) | house (5th house) |
| tranzit, tranzitna planeta, natalna planeta | transit, transiting planet, natal planet |
| retrogradna / ponovo direktna | retrograde / direct again |
| aspekti | aspects (conjunction, sextile, square, trine, opposition) |
| orbis | orb |
| Severni čvor, Lilit, Tačka sreće | North Node, Lilith, Part of Fortune |
| element: vatra, zemlja, vazduh, voda | fire, earth, air, water |
| kvalitet: kardinalan, fiksan, promenljiv | cardinal, fixed, mutable |
| polaritet: pozitivan / negativan | positive / negative |
| vladar (znaka) | ruler / ruling planet |
| Mesec (planeta), lunarni kalendar, lunarni dan | Moon, lunar calendar, lunar day |
| mlad / pun Mesec, faza | new / full Moon, phase |
| Promene na nebu | Changes in the sky |
| Priča dana / Priča o znaku | Story of the day / Your sign's story |
| Tvoji ljudi | Your people |
| Pitaj astrologa / Pitaj čoveka / Pitaj AI | Ask an astrologer / Ask a human / Ask AI |
| Premium, Otključaj, Vrati kupovine | Premium, Unlock, Restore purchases |
| nalog, prijava, odjava, kod sa mejla | account, sign in, sign out, code from your email |
| Ljubav, Posao/Karijera, Zdravlje, Novac (oblasti) | Love, Career, Health, Money (match the Serbian key's meaning) |

Planet, sign and aspect names come from `t.nebo` — never re-type them. `nebo.uZnaku(k)` = "in Leo",
`nebo.uZnak(k)` = "into Leo".

### "Pitaj astrologa" na drugim jezicima (Ivan, 1.10.2026)

Astrolog odgovara glasom NA SRPSKOM. U engleskom, slovenačkom i makedonskom rečniku to se kaže otvoreno, u
postojećim rečenicama (`pitaj.uvod.glasovno`, `pitaj.pitanje.ceka`, `danas.tumacenje.pitajOpis`): "…glasovnom
porukom, na srpskom…". Hrvatski i bosanski to ne trebaju — srpski razumeju. Tab se ne sakriva.

## Hrvatski i bosanski (korak 3, 1.10.2026)

Oba su CEO rečnik (`src/i18n/hr/`, `src/i18n/bs/`, tip `Recnik`). Zajedničko (opste, gramatika, datum, nebo)
je napisano; delovi aplikacije se prevode iz srpskog. Množina i padeži su isti kao u srpskom (`mnozina` iz
`./gramatika`). Datum ima tačku posle godine: hr "Uto, 29. ruj 2026.", bs "Uto, 29. sep 2026.".
`check:prevod` pada na čestu ekavsku reč ("vreme", "posle", "mesto"…) u hr/bs rečniku.

### Hrvatski — pravila

- **Ijekavica** (vrijeme, mjesto, mjesec, dijete, lijepo, uvijek, gdje, poslije/nakon, primjer, cijena, dio).
- **Infinitiv, ne "da + prezent":** "možeš platiti", "želiš li promijeniti", ne "možeš da platiš".
- **Hrvatske riječi:** tjedan, tisuća, točka, račun (nalog), lozinka, postavke, spremi, izbriši, uredi,
  odustani, natrag, ponovno, obavijest, e-mail (ne "mejl"), pretplata, kupnja, zadnji, sljedeći, kroz,
  tko/što (ne ko/šta), mjesec (ne "mesec"), vlak, glazba, sveučilište, organizirati (-irati, ne -ovati).
- **Upitne rečenice:** "Želiš li…?", ne "Da li želiš…?".
- Glas isti kao srpski (`copywriter-sr`): "ti", tumači a ne proriče, bez uzvičnika i laskanja.

### Bosanski — pravila

- **Ijekavica** kao u hrvatskom, ali rječnik bliži srpskom: sedmica (ne tjedan, ne nedelja), hiljada,
  tačka, račun, šifra/lozinka, postavke, sačuvaj, obriši, nazad, ponovo, obavještenje, e-mail, kupovina,
  posljednji, sljedeći, ko/šta, historija, kahva (ako zatreba), voz. Mjeseci: januar, februar, mart, april, maj, juni, juli, august, septembar…
- **"da + prezent" i infinitiv su oba u redu;** biraj ono što zvuči prirodnije u Sarajevu.
- Glas isti.

### Pojmovnik (hr / bs)

| Srpski | Hrvatski | Bosanski |
|---|---|---|
| Mesec (planeta) | Mjesec | Mjesec |
| Severni čvor, Tačka sreće | Sjeverni čvor, Točka sreće | Sjeverni čvor, Tačka sreće |
| Devica, Škorpija, Strelac, Vodolija | Djevica, Škorpion, Strijelac, Vodenjak | Djevica, Škorpija, Strijelac, Vodolija |
| natalna karta, tumačenje | natalna karta, tumačenje | natalna karta, tumačenje |
| Ascendent / podznak | Ascendent / podznak | Ascendent / podznak |
| kuća (5. kuća) | kuća (5. kuća) | kuća (5. kuća) |
| Tvoj dan, Danas ukratko | Tvoj dan, Danas ukratko | Tvoj dan, Danas ukratko |
| Ide ti / Koči te | Ide ti / Koči te | Ide ti / Koči te |
| Priča dana / Priča o znaku | Priča dana / Priča o znaku | Priča dana / Priča o znaku |
| Tvoji ljudi | Tvoji ljudi | Tvoji ljudi |
| nalog, prijava, odjava | račun, prijava, odjava | račun, prijava, odjava |
| obaveštenja | obavijesti | obavještenja |
| podešavanja | postavke | postavke |
| Vrati kupovine | Vrati kupnje | Vrati kupovine |
| mejl / kod sa mejla | e-mail / kod iz e-maila | e-mail / kod sa e-maila |
| nedelja (7 dana) | tjedan | sedmica |
| Poslednja četvrt | Zadnja četvrt | Posljednja četvrt |
| "Pitaj astrologa" | odgovor je na srpskom — NE pisati posebnu napomenu (hr i bs razumiju srpski) | isto |

## Slovenački i makedonski (korak 4, 1.10.2026)

Celi rečnici (`src/i18n/sl/`, `src/i18n/mk/`). Zajedničko je napisano. "Pitaj astrologa": oba jezika
KAŽU da je odgovor glasovna poruka NA SRPSKOM (Ivan) — u `pitaj.uvod.glasovno`, `pitaj.pitanje.ceka` i
`danas.tumacenje.pitajOpis`, kao engleski.

### Slovenački — pravila

- **Množina ima četiri oblika** (dvojina): `mnozina(n, [1, 2, 3–4, 5+])` iz `./gramatika` — "1 oseba,
  2 osebi, 3 osebe, 5 oseb". Glagol se slaže: "2 tranzita trajata".
- **Šest padeža**; u rečniku: genitiv = rodilnik, dativ = dajalnik, akuzativ = tožilnik,
  instrumental = orodnik, lokativ = mestnik. Predlog "s/z" po glasu: "s tvojim Soncem", "z Luno".
- **Mesec (planeta) = Luna** (ženski rod). Znakovi: Oven, Bik, Dvojčka, Rak, Lev, Devica, Tehtnica,
  Škorpijon, Strelec, Kozorog, Vodnar, Ribi. "v Levu" (`nebo.uZnaku`), "v Leva" (`nebo.uZnak`).
- **Reči:** račun (nalog), e-pošta / e-poštni naslov, obvestila, nastavitve, shrani, izbriši, prekliči,
  naročnina (pretplata), nakup, obnovi nakupe (Vrati kupovine), teden, kdo/kaj, rojstni podatki,
  rojstna karta (natalna karta), razlaga (tumačenje), ascendent / podznak, hiša (5. hiša).
- **Ti-forma**, isti glas (`copywriter-sr`): tumači, ne proriče; bez uzvičnika.

### Makedonski — pravila

- **Ćirilica, ceo tekst.** Latinica samo za vlastita imena koja se tako pišu: "Astro Shop",
  "astroshop.rs", App Store, Google Play, Instagram, iPhone. Ime astrologa ćirilicom: "Бобан Вујовиќ".
- **Nema padeža**; ima **član** (определен член): "твојот Марс", "твојата Венера", "твоето Сонце" —
  rod je u `nebo.padeziTela[k].rod`. Množina: `mnozina(n, jedan, vise)` iz `./gramatika`
  ("1 ден, 2 дена", "1 месец, 3 месеци").
- **Mesec (planeta) = Месечина** (ženski rod). Znakovi: Овен, Бик, Близнаци, Рак, Лав, Девица, Вага,
  Скорпија, Стрелец, Јарец, Водолија, Риби; "во Лав" (`nebo.uZnaku`, isto i `uZnak`).
- **Reči:** сметка (nalog), е-пошта, известувања, поставки, зачувај, избриши, откажи, претплата,
  купување, Врати купувања, недела (7 dana), кој/што, роденден / податоци за раѓање,
  натална карта, толкување, асцендент / подзнак, куќа (5. куќа — "5-та куќа").
- Glas isti (`copywriter-sr`): ti-forma, tumači, ne proriče.

### FONT ZA MAKEDONSKI

Plus Jakarta Sans NEMA ćirilicu, pa je za makedonski CEO tekst u Manrope-u (Ivan, 1.10.2026): `FONT` u
`theme/font.ts` ima gettere i vraća Manrope kad je jezik `mk`. Polja za unos dobijaju isto pismo kroz `style`
(klasa `font-sans` je Jakarta). Poreklo i skripta: `assets/fonts/POREKLO.md`, `scripts/font/build-manrope.py`.
