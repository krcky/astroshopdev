# Astroshop: astrološka logika aplikacije

Stanje: 27. septembar 2026.

Ovaj dokument opisuje **sve što aplikacija trenutno izračunava**, kojim pravilima bira šta će korisnik videti i koje su izmene predložene. Namenjen je proveri sa astrologom **pre** bilo kakve promene u kodu.

Oznake:

- ✅ **odlučeno**: pravilo je u upotrebi i potvrđeno
- ⏳ **čeka astrologa**: pravilo je u upotrebi, ali je privremeno (moj izbor ili pretpostavka)
- 💡 **predlog**: još nije u aplikaciji, traži odluku

Tamo gde je navedena funkcija u kodu (npr. `pickHero`), to je samo putokaz za programiranje. Astrolog može to da preskoči.

---

## 1. Osnova proračuna

| Stavka | Kako radimo | Status |
|---|---|---|
| Zodijak | **Tropski**, prava ekliptika datuma (true equinox of date) | ✅ |
| Efemerida | astronomy-engine, tačnost oko ±1 lučni minut | ✅ |
| Tela | Sunce, Mesec, Merkur, Venera, Mars, Jupiter, Saturn, Uran, Neptun, Pluton | ✅ |
| Kiron | **Nije uključen.** Asteroid je i traži posebnu efemeridu. | ⏳ da li je potreban? |
| Čvor, Lilit, Tačka sreće | Računaju se, ali se **samo prikazuju** u tabu „Nebo" (poglavlje 7). Ne ulaze u tranzite, jer za njih nema tekstova. | ⏳ |

## 2. Natalna karta

**Vreme rođenja → UTC.** Lokalno vreme se pretvara u svetsko po istoriji vremenskih zona **za datum rođenja**, uključujući letnje i zimsko računanje vremena tog dana. Greška od jednog sata pomera ascendent za oko 15°, pa je ovo najosetljiviji korak. ✅

**Sistem kuća.** Koristi se **Placidus**. ✅
- Na polarnim širinama (iznad ~66°) Placidus se ne može izračunati, pa aplikacija sama prelazi na **Whole Sign**. ✅

**Nepoznato vreme rođenja.** ✅
- Uzima se **podne**.
- Kuće se računaju po **Whole Sign** sistemu, od ascendenta izračunatog za podne. Te kuće su nepouzdane i služe samo za crtež.
- **Ascendent i MC se ne koriste nigde**: ni kao meta tranzita, ni u izboru Hero-a, ni za kuće u „Promenama na nebu".
- Pozicije planeta ostaju upotrebljive, osim **Meseca**, koji za 12 sati pređe i do 7°. ⏳ Da li u tom slučaju Mesec treba izostaviti iz natalnih meta?

**Natalni aspekti** (između planeta u karti), sa orbisima:

| Aspekt | Ugao | Orbis |
|---|---|---|
| konjunkcija | 0° | 8° |
| sekstil | 60° | 4° |
| kvadrat | 90° | 6° |
| trigon | 120° | 6° |
| opozicija | 180° | 8° |

⏳ Orbisi su uobičajene vrednosti. Da li astrolog koristi drugačije, npr. veći orbis za Sunce i Mesec?

## 3. Tranziti (današnje nebo prema natalnoj karti)

**Mete tranzita:** 10 natalnih planeta + **Ascendent** + **MC**. ✅

**Orbisi za tranzite** su namerno uži od natalnih: tranzit opisuje jedan dan, a posle oko 3° postaje pozadina.

| Aspekt | Orbis tranzita |
|---|---|
| konjunkcija, opozicija, kvadrat, trigon | 3° |
| sekstil | 2° |

⏳ Isti orbis važi za sve tranzitne planete. Da li Mesec (brz) i Pluton (spor) treba da imaju drugačiji?

**Jačanje ili slabljenje.** Tranzit je „primenjujući" (jača) ako mu se orbis sutra smanjuje. Za sada se samo beleži i ne utiče na izbor. ✅

**Skor (važnost tranzita).** Koristi se **samo za redosled u tabu „Tranziti"**:

> skor = (1 − orbis / najveći orbis) × težina tranzitne planete × težina natalne mete

| Tranzitna planeta | Težina | | Natalna meta | Težina |
|---|---|---|---|---|
| Mesec | 0,3 | | Sunce, Mesec, Ascendent | 1,0 |
| Sunce | 0,6 | | MC | 0,9 |
| Merkur, Venera | 0,5 | | Merkur, Venera, Mars | 0,7 |
| Mars | 0,7 | | Jupiter, Saturn | 0,5 |
| Jupiter, Neptun | 0,9 | | Uran, Neptun, Pluton | 0,3 |
| Saturn, Uran, Pluton | 1,0 | | | |

⏳ Težine sam postavio po logici „sporije = ređe = jače" i „lične planete i uglovi = najvažniji". Treba ih potvrditi.

**Do kada tranzit traje.** Za spore planete se računa dan kad tranzit **prvi put** izlazi iz orbisa. Ako se planeta retrogradno vrati, to je novi prolaz. Horizont je oko 3 godine, a iza toga piše „još godinama". ✅

**Brze i spore planete.** Brze su Mesec, Sunce, Merkur, Venera i Mars. Spore su Jupiter, Saturn, Uran, Neptun i Pluton. ✅

**Kad se računa.** Sve na početnom ekranu računa se za **lokalnu ponoć** tog dana, da bi slika bila ista ceo dan. ✅

---

## 4. Početni ekran

### 4.1 Hero (glavni tranzit dana)

Bira se **redom po prioritetima**. Staje se na prvom prioritetu koji ima kandidata: ✅

1. **Tranzit na vladara Ascendenta ili vladara Sunca**, ali samo **jak** (orbis ≤ 1,5°).
2. **Tranzit na Ascendent, MC, Sunce ili Mesec.**
3. **Najtačniji tranzit na bilo koju natalnu planetu.**
4. Ništa od toga: Hero se ne prikazuje.

Pravila unutar prioriteta:
- Pobeđuje **najmanji orbis**. Pri izjednačenju pobeđuje sporija planeta. ✅
- **Mesec ne ulazi u Hero**, jer ima svoju karticu. ✅
- Bez vremena rođenja nema Ascendenta ni MC, pa se gleda samo vladar Sunca. ✅
- Vladari su **moderni**: Škorpija → Pluton, Vodolija → Uran, Ribe → Neptun (ostali znakovi imaju iste vladare u oba sistema). ⏳ **Proveriti** da li astrolog želi moderne ili klasične (Mars, Saturn, Jupiter). To menja prvi prioritet Hero-a za sve sa Suncem ili Ascendentom u ta tri znaka.

**Pauza od 7 dana.** Tranzit koji je bio Hero u poslednjih 7 dana se preskače i ide sledeći kandidat. Bez pauze bi spor tranzit bio Hero nedeljama: na test karti isti Uran je bio Hero 50 od 60 dana. ✅

**Izuzetak: dan egzaktnosti.** Tranzit probija pauzu **samo na dan kad je najtačniji**, tj. kad mu je orbis manji nego dan pre i dan posle, a najviše 1,5°. ✅ (izmenjeno 27.9.2026)
- Ranije je pauzu probijao svaki dan sa orbisom ispod 0,3°. Spor Saturn je ispod tog praga oko nedelju dana, pa je Hero bio isti ceo taj period.

**Pregled drugih dana** (meni „Danas / Sutra / Juče…"): aplikacija preračunava kao da je korisnik otvarao aplikaciju svaki dan, da juče i sutra ne bi ponavljali današnji Hero. ✅

Primer, karta 30.6.1988, 03:30, Niš:

| Dan | Hero |
|---|---|
| 25.9 | Venera trigon natalno Sunce |
| 26.9 | Jupiter opozicija natalni MC |
| 27.9 | Saturn kvadrat natalni Mesec |
| 28.9 | Jupiter sekstil natalni Merkur |
| 29.9 | Saturn kvadrat natalni Mesec (dan egzaktnosti, 0,02°) |

### 4.2 „Danas ukratko": ide ti / koči te

Tri kratke rečenice u svakoj grupi. Isključuju se Hero i Mesec. Redosled je po orbisu. Tranzit bez teksta se preskače.

Podela je **po aspektu**, jer tekstovi korpusa nisu podeljeni na dobre i loše:

| Aspekt | Grupa | Status |
|---|---|---|
| trigon, sekstil | ide ti | ✅ |
| kvadrat, opozicija | koči te | ✅ |
| konjunkcija, tranzitno Sunce, Merkur, Venera, Jupiter | ide ti | ⏳ |
| konjunkcija, tranzitni Mars, Saturn, Uran, Neptun, Pluton | koči te | ⏳ |

⏳ **Pitanje za astrologa:** da li je ova podela konjunkcija ispravna? Da li Venera na natalni Saturn „ide" ili „koči"?

### 4.3 Kartica Mesec

- **Faza** (procenat osvetljenosti, raste/opada), **lunarni dan** (1–30, od poslednjeg mladog Meseca), sledeći mlad i pun Mesec. ✅
- **Znak** u kom je Mesec. Ako tog dana menja znak, prikazuje se i vreme prelaska. ✅
- **Mesečevi aspekti na natalnu kartu koji postaju tačni tog dana**, sa satom. Mesec je u orbisu samo oko 11 sati, pa se ne gleda jedan trenutak nego ceo dan, od ponoći do ponoći. ✅
- **„Najjači" Mesečev aspekt dana** bira se ovako: ⏳
  1. težina natalne mete (Sunce, Mesec, Ascendent pre ostalih),
  2. pa jačina aspekta: konjunkcija > opozicija > kvadrat > trigon > sekstil,
  3. pa raniji sat.
- **Element i deo biljke** (biodinamički kalendar, Maria Thun): vatra → plod, zemlja → koren, vazduh → cvet, voda → list. ⏳
- **Oblasti** (Ljubav, Zdravlje, Karijera, Kuća, Bašta): tekstovi lunarnog kalendara postoje (12 znakova × 5 oblasti), ali **nisu uvezeni** jer nisu najnovija verzija. ⏳

### 4.4 Promene na nebu

Za tri planete se prikazuje **prvi sledeći događaj**: ulazak u znak, početak retrogradnog kretanja ili povratak u direktno kretanje. Uz događaj ide i do kada traje. Mesec ne ulazi. ✅

**Kuća u koju planeta ulazi** broji se **od podznaka, znak po znak (Whole Sign)**, da bi „ulazi u Škorpiju" i „ulazi u 8. kuću" bili isti dan. Po Placidusu granica kuće ne pada na granicu znaka. ⏳ Da li je astrologu ovo prihvatljivo, iako je ostatak karte po Placidusu?

Bez vremena rođenja kuća se ne prikazuje. ✅

### 4.5 Tema perioda

Svi tranziti **sporih** planeta (Jupiter–Pluton) u orbisu, po tačnosti, sa datumom do kada traju. ✅

---

## 5. Tab „Tranziti"

- **Svi** tranziti u orbisu, poređani po skoru (poglavlje 3). ✅
- Svaki ima kratko tumačenje. Plaća se dubina (dugo tumačenje), ne pristup. ✅
- **Planete u kućama:** prikazuju se do 3 spore planete sa kućom kroz koju prolaze. Tekstovi „planeta u kući" **ne postoje** (120 rečenica čeka astrologa). ⏳

## 6. Profil: „velika trojka"

Kratke osobine po Sunčevom znaku (3 reda po znaku) su **moje privremene formulacije**. Treba ih zameniti tekstom astrologa: 12 znakova × 3 reda. ⏳

## 7. Tab „Nebo" (trenutno nebo nad gradom iz profila)

| Tačka | Kako se računa | Status |
|---|---|---|
| Mesečev čvor | **pravi** (ne srednji); znak „R" se računa, ne pretpostavlja, jer pravi čvor povremeno ide napred | ✅ provereno prema astro-seek-u |
| Lilit | **srednji** apogej (Meeus); pravi osciluje i do 30° | ✅ provereno prema astro-seek-u |
| Tačka sreće | danju ASC + Mesec − Sunce, noću ASC + Sunce − Mesec (dan = Sunce u kućama 7–12) | ✅ |

---

## 8. Stanje tekstova (korpus)

| Grupa | Popunjeno | Napomena |
|---|---|---|
| Tranziti, kratki tekst | 433 / 600 | |
| Tranziti, dugi tekst | 443 / 600 | |
| **Mesec kao tranzitna planeta** | **0 / 50** | vidi predlog u poglavlju 10 |
| Ascendent i MC kao meta | 0 / 100 | ako ne stignu, ASC i MC izlaze iz tranzita |
| Planete u kućama | 0 / 120 | |
| Lunarni kalendar (12 × 5) | postoji, nije uvezen | čeka najnoviju verziju |
| Osobine po znaku (12 × 3) | privremeno moje | |

Tačan spisak onoga što nedostaje: `python3 scripts/korpus/izvestaj.py`

---

## 9. Pitanja za astrologa (sve ⏳ na jednom mestu)

1. **Kiron**: da li je potreban?
2. **Orbisi**: natalni (8/4/6/6/8) i tranzitni (3°, sekstil 2°). Da li su drugačiji za Mesec, Sunce ili spore planete?
3. **Težine** tranzitnih planeta i natalnih meta (tabela u poglavlju 3).
4. **Vladari znakova**: sada moderni (Pluton, Uran, Neptun). Da li klasični?
5. **Konjunkcije u „ide ti / koči te"**: podela po tranzitnoj planeti.
6. **Najjači Mesečev aspekt dana**: redosled kriterijuma.
7. **Deo biljke po elementu** (Maria Thun).
8. **Kuće u „Promenama na nebu"** po Whole Sign-u umesto Placidusa.
9. **Prag „jakog" aspekta za Hero**: 1,5°. **Pauza**: 7 dana. **Dan egzaktnosti**: najviše 1,5°.
10. **Nepoznato vreme rođenja**: da li natalni Mesec izostaviti kao metu, jer za 12 sati pređe i do 7°?

---

## 10. Predlog: dnevni ton preko Meseca (inspirisan Co-Star-om) 💡

### 10.1 Šta smo videli kod Co-Star-a

Poređenje njihovih 5 dana (25–29.9.2026) sa izračunatim tranzitima iste karte:

| Dan | Co-Star naslov i tema | Brz tranzit tog dana | Poklapanje |
|---|---|---|---|
| pet 25 | „razočaranje… emocionalni ciklusi" | Mesec kvadrat ASC, Venera, Merkur | Mesec = emocije |
| sub 26 | „zid koji si sagradio… pukotine su mesto gde ulazi svetlo" | Mesec kvadrat natalni **Saturn** (zid) i **Uran** (pukotine) | vrlo jako |
| ned 27 | „prestani da uvežbavaš razgovore, instinkt je oštriji od pripreme" | Mesec kvadrat natalni **Mesec**, Jupiter sekstil **Merkur** | jako |
| pon 28 | „neka odlaganje bude deo procesa, veruj pauzi" | Mesec **trigon Saturn** | vrlo jako |
| uto 29 | „neko će ti ukazati na greške, primi to bez napada na sebe" | **Merkur sekstil Saturn 0,01°** + Saturn kvadrat Mesec 0,02° | vrlo jako |

Zaključak (iz poređenja, ne iz njihovog koda):

1. **Ton daje spor tranzit.** Saturn kvadrat natalni Mesec traje svih 5 dana i svaki tekst je „saturnovski", ali se tranzit nigde ne imenuje.
2. **Svaki dan menja najtačniji brz tranzit, najčešće Mesečev.** Zato se naslov menja svakog dana.
3. **Naslov je aforizam** („No one's perfect."), a ne ime tranzita. Tekst je sinteza 2–3 tranzita.
4. **Oblasti života** („promene u domu i porodici") verovatno dolaze od pogođene natalne planete: Mesec → dom, Venera → ljubav.
5. Budući dani imaju samo naslov i tekst. Do/Don't liste i „Dive deeper" imaju samo danas i prošli dani.

### 10.2 Zašto ne menjamo izbor Hero-a

Simulirali smo 15 dana (25.9–9.10) sa „Hero = najtačniji brz tranzit":
- **Bez pauze:** Venera je početkom oktobra stacionarna, pa trigon natalnom Suncu pobeđuje **11 od 15 dana**. Brze planete nisu uvek brze.
- **Sa pauzom od 7 dana:** raznoliko, ali tri dana bira tranzit na ivici orbisa (preko 2°), jedan dan nema Hero-a, a najjači tranzit meseca (Saturn kvadrat Mesec) se ne pojavljuje nijednom.
- **Sadašnje pravilo** (poglavlje 4.1): 10 različitih tranzita u 15 dana, skoro uvek ispod 1,3°.

➡ **Preporuka: izbor Hero-a ostaje kakav je.** Co-Star dnevnu promenu dobija **Mesecom i tekstom**, ne izborom tranzita.

### 10.3 Predlog: Mesečev naslov dana

Na vrhu početnog ekrana stoji **kratak naslov dana iz najjačeg Mesečevog aspekta** (poglavlje 4.3). Ispod ostaje Hero, koji daje ton perioda. Ton se tako dobija rasporedom, bez pisanja spojeva „Mesec + spor tranzit", kojih bi bilo desetine hiljada.

**Potrebni tekstovi: Mesec kao tranzitna planeta**
- 5 aspekata × 10 natalnih planeta = **50 kombinacija** (+10 ako i Ascendent i MC).
- Oblik jednog teksta:
  - **naslov**: jedna rečenica do 8 reči, aforizam, bez imena tranzita;
  - **tekst**: 2–4 rečenice, u drugom licu, konkretno: šta danas oseća i šta da uradi.
- **Varijante:** isti Mesečev aspekt se ponavlja otprilike jednom mesečno. Sa **2–3 varijante** po kombinaciji (100–150 tekstova) ponavljanje je retko. Aplikacija bira varijantu po datumu.

Primer, Mesec trigon natalni Saturn:

> **Pauza nije lenjost.**
> Danas ti prija sporiji ritam. Ono što odlažeš ne beži — sleže se. Uradi jednu stvar kako treba umesto pet napola.

**Dodatna korist:** isti tekstovi popunjavaju i karticu Mesec (poglavlje 4.3) i Mesečeve tranzite u tabu „Nebo". Tamo danas za Mesec nema šta da se prikaže.

**Za odluku sa astrologom:**
- da li se slaže sa idejom „Mesec daje dan, spor tranzit daje period";
- da li je 50 kombinacija dovoljno ili traži i Ascendent i MC;
- koliko varijanti po kombinaciji;
- ton i dužina (primer iznad).
