# Astro Shop: astrološka logika aplikacije

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
- Kuće se računaju po **Whole Sign** sistemu, od ascendenta izračunatog za podne. Te kuće su nepouzdane i **ne crtaju se** (30.9.2026): točak tada nema kuća, Ascendenta ni MC-a, a levo je 0° Ovna umesto ascendenta za podne.
- **Ascendent i MC se ne koriste nigde**: ni kao meta tranzita, ni u izboru Hero-a, ni za kuće u „Promenama na nebu".
- Pozicije planeta ostaju upotrebljive, osim **Meseca**, koji za 12 sati pređe i do 7°. ⏳ Da li u tom slučaju Mesec treba izostaviti iz natalnih meta?

**Natalni aspekti** (između planeta u karti i na Ascendent; **na MC ne**, odluka 28.9.2026), sa orbisima:

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

### 4.0 „Tvoj dan" (za sve od 29.9.2026; Premium od 27.9.2026) ✅

**Zamenjuje Hero** (4.1) za sve korisnike (od 29.9.2026; do tada samo za Premium). Izbor tranzita je isti za besplatne i Premium. Razlika je samo u tekstu: besplatni dobija kratku verziju, a ceo tekst je uz Premium. Hero (4.1) se više nigde ne prikazuje i ostaje zapisan kao arhiva. Pravila su iz `docs/tvoj_dan_simulacija.py`; kod (`src/lib/tvoj-dan.ts`) daje **isti izbor 20 od 20 dana** kao simulacija na njenoj test karti (27.9.–16.10.2026).

**Orbisi** (samo za ovu karticu; tab „Tranziti" i „Danas ukratko" ostaju na 3°):

| Tranzitna planeta | Orbis |
|---|---|
| Sunce, Merkur, Venera, Mars, Jupiter, Saturn | 1,5° |
| Uran, Neptun, Pluton | 1° |
| Mesec | 0° (samo dan kad je aspekt tačan) |

**Dan** je lokalni kalendarski dan. Tranzit je „aktivan" ako je u orbisu u jednoj od dve ponoći ili ako tokom dana postaje tačan. *Počinje* = juče nije bio aktivan; *završava se* = sutra neće biti.

**Bodovanje:** težina planete × aspekt × meta × blizina × momenat.

| Planeta | Težina | | Aspekt | Množilac |
|---|---|---|---|---|
| Pluton | 10 | | konjunkcija | 1,0 |
| Neptun, Uran | 9 | | opozicija, kvadrat | 0,9 |
| Saturn | 8 | | trigon | 0,7 |
| Jupiter | 7 | | sekstil | 0,5 |
| Mars, Sunce | 5 | | | |
| Venera, Merkur | 4 | | | |
| Mesec | 2 | | | |

- **Meta** ×1,3: natalno Sunce, Mesec, Ascendent, MC, **ili je u tranzitu vladar horoskopa** (natalni ili tranzitni).
- **Blizina**: 1 − 0,3 × (udaljenost / orbis).
- **Momenat**: tačan danas ×1,5, počinje danas ×1,2.

**Rotacija:**
- Brze (Sunce, Merkur, Venera, Mars): posle prikaza **odmor 3 dana**, osim na dan tačnosti ako nije prikazan juče.
- Spore (Jupiter–Pluton): **samo na dan početka, tačnosti ili kraja**, odmor **7 dana**.
- Mesec: rezerva, samo na dan kad je aspekt tačan.
- Nijedan kandidat: kartica se ne prikazuje.
- Kad se isti tranzit vrati, iz svakog odeljka duge verzije („Pozitivni efekti", „Izazovi", „Saveti") ide **sledeća stavka**.
- Odmor i rotacija gledaju šta je **taj nalog na tom telefonu** već video (29.9.2026). Zato dve osobe sa istom kartom ponekad istog dana dobiju različit tranzit. Češći razlog je vreme rođenja: Saturn je sad skoro stacionaran, pa 15 minuta razlike pomeri dan tačnog kvadrata na Mesec za dva dana.

**Vladar horoskopa** = vladar znaka Ascendenta, **tradicionalni** (astrolog, 27.9.2026: „svih 12 znakova ima jednako živ protok dnevnih tekstova"). Moderni i oba su podešavanje u kodu (`RULER_SYSTEM`). Bez vremena rođenja nema Ascendenta, pa ni vladara.

**Ton** (Povoljno / Izazovno / Mešovito): ručna oznaka astrologa ima prednost; bez nje se računa po prirodi obe planete ⏳

| Priroda | Planete |
|---|---|
| blaga | Venera, Jupiter |
| neutralna | Sunce, Mesec, Merkur, Ascendent, MC |
| dinamična | Mars, Uran, Neptun |
| teška | Saturn, Pluton |

- trigon, sekstil → Povoljno
- konjunkcija: ima tešku → Mešovito ako je druga blaga, inače Izazovno; ima dinamičnu → Mešovito; inače Povoljno
- kvadrat, opozicija: ima blagu a nema tešku → Mešovito, inače Izazovno

**Trajanje**: od dana ulaska u orbis do poslednjeg dana u orbisu, po orbisu LISTE (3°, sekstil 2°; vidi „Koliko još traje" u poglavlju 11), ne po orbisima iz tabele gore — oni važe samo za izbor. Tako isti tranzit ima isto trajanje na svakom ekranu (29.9.2026).

### 4.1 Hero (glavni tranzit dana) — ARHIVA; ne prikazuje se od 29.9.2026

Do 27.9.2026 ovo je bio izbor za sve. Orbisi i težine koje koristi su u poglavlju 3 (3°, sekstil 2°; težine 0,3–1,0).

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

### 4.3 „Mesec danas" (za sve od 29.9.2026) i stara kartica Mesec (arhiva)

**„Mesec danas"** (od 27.9.2026 za Premium, od 29.9.2026 za sve; lunarni kalendar je besplatan):
- **Faza dana**: Mlad Mesec, Prva četvrt, Pun Mesec, Poslednja četvrt nose **ceo kalendarski dan** (lokalno vreme) u kom se desi tačan trenutak; ostali dani su Rastući ili Opadajući Mesec. ✅
- **Znak u naslovu**: za glavnu fazu to je znak u tačnom trenutku faze, inače znak u kom je Mesec sada. ✅
- **Osvetljenost** u procentima i smer (raste / opada). ✅
- **Lični deo — „Za tebe, {ime}"** (Ivan, 28.9.2026): kako Mesec danas utiče na tebe. Najjači Mesečev aspekt na natalnu kartu koji postaje tačan tog dana, sa satom (isti izbor kao na staroj kartici Mesec, gore). Ako je baš taj tranzit već u „Tvom danu", ide sledeći najjači. Dana bez ijednog tačnog aspekta nema (0–9 godišnje) i red se ne prikazuje. ✅
- **Red o lunaciji u kući**: samo na Mlad i Pun Mesec, samo sa vremenom rođenja. Navodi u koju natalnu kuću (**Placidus**) faza pada. Teme kuća su početne vrednosti ⏳. Tekst po kući još ne postoji, pa se red ne prikazuje.
- **Rečenica faze** je PRIVREMENA (nije astrologova) dok ne stignu tekstovi ⏳.
- **Oblasti**: tekst lunarnog kalendara po paru faza + znak. Na kartici ide **jedna** stavka, prva iz liste (Ivan, 28.9.2026), a u Bašti „Uradi" i „Izbegavaj" (stavke koje počinju sa „Ne", „Nemojte", „Izbegavajte" ili sadrže „nepovoljn"). Ceo tekst je na ekranu Mesec.

**Kartica Mesec (arhiva — do 29.9.2026 za besplatne):**

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

Svi tranziti **sporih** planeta (Jupiter–Pluton) u orbisu, po tačnosti, sa datumom do kada traju. ✅ Besplatni vidi prvi, ostale samo po imenu (poglavlje 5c).

### 4.6 Drugi dani

Meni „Juče / Sutra / ±2 dana" je samo za Premium (29.9.2026). Besplatni uvek vidi danas.

### 4.7 Priča dana (30.9.2026)

Nekoliko slika o današnjem danu, kao „story" na Instagramu, sa dugmetom za deljenje. **Ništa se ne računa iznova** — priča uzima iste izbore kao početna, da ne bi rekla nešto drugo nego kartice:

- **Naslovna:** svi tranziti sa liste „Tranziti" (poglavlje 5), prebrojani po tonu (skladan / mešovit / napet, `lib/tone.ts`). Točak pokazuje prave položaje: tranzitna planeta spolja, natalna tačka unutra, Ascendent levo. ✅
- **Tvoj dan:** isti tranzit kao kartica „Tvoj dan" (4.0), naslov i prve rečenice **kratkog** teksta. ✅
- **Ocene:** iste ocene kao na početnoj (poglavlje 11); strelica „bolje nego juče" kad je juče ocena bila niža. U priči **i besplatni vidi sve četiri** (30.9.2026) — na početnoj i dalje samo Ljubav. ✅
- **Ide ti / Koči te:** isti izbor kao 4.2, rečenice `positive` i `challenge`. Bez teksta slike nema. ✅
- **Mesec:** faza, procenat, znak, sledeća glavna faza; „Za tebe" je najjači Mesečev tranzit dana (4.3), ako ima tekst. ✅
- **Savet:** savet iz kratkog teksta tranzita „Tvog dana". Bez saveta slike nema. ✅

Na slici za deljenje isti tekst ide u prvom licu („Moj dan", „Ide mi", „Koči me").

---

## 5. Tab „Tranziti"

**Premium (od 28.9.2026):** svi tranziti dana (Sunce–Pluton, bez Meseca), **orbisom
kao „Tema perioda"** — 3°, sekstil 2°, za sve planete (Ivan, 28.9.2026; do tada uski
orbis „Tvog dana", pa su falili spori tranziti na 1–3°, npr. Pluton opozicija ASC na 2°),
**po važnosti**, svaki u svojoj kartici: naslov tumačenja, ime tranzita, koliko još
traje, ton. Važnost = jačina iz poglavlja 11. Bez oblasti i bez ocena — ocene su
samo na početnoj (kartica na slajdu „Danas ukratko"). ✅

**Besplatni (od 29.9.2026):** ista lista, isti redosled. Prva **3** tranzita imaju karticu (naslov, kratak tekst na dodir), ostali se vide samo po imenu i trajanju, pod katancem. Do 29.9.2026 besplatni je imao stari prikaz sa svim kratkim tekstovima.

## 5c. Šta je besplatno, a šta uz Premium (29.9.2026)

Besplatni i Premium vide **iste ekrane**; Premium otključava dubinu. Sve granice su u jednom fajlu, `src/lib/pristup.ts`.

| Mesto | Besplatno | Premium |
|---|---|---|
| „Tvoj dan" | isti izbor, kratak tekst | ceo tekst |
| Ocene oblasti | na početnoj samo Ljubav, ostale pod katancem; u priči dana sve četiri | sve četiri |
| Ide ti / Koči te, Mesec danas, Promene na nebu | sve | sve |
| Tema perioda | prvi spori tranzit | svi |
| Tab „Tranziti" | prva 3, ostali po imenu | svi |
| Drugi dani (juče, sutra…) | ne | da |
| Tumačenje tranzita | kratko | dugo |
| Natalna karta | Sunce, Mesec, podznak u znaku | sve |
| Nebo, ekran Mesec, lunarni kalendar | sve | sve |
| Druge osobe („Tvoji ljudi", tab „Ti") | 1 osoba; njena karta i tranziti sa istim granicama kao gore | do 10 osoba |
| Pitanje astrologu o drugoj osobi ili o odnosu | ista cena kao pitanje o sebi | ista (niža) cena kao pitanje o sebi |

**Druge osobe (29.9.2026).** Karta druge osobe računa se **istim pravilima** kao korisnikova (poglavlja 1–3): bez vremena rođenja Whole Sign i bez ascendenta i kuća, bez pouzdane vremenske zone nema ni karte ni tranzita. Tranziti na njenu kartu su ista lista po važnosti kao tab „Tranziti" (poglavlje 5), a vladar karte je vladar NJENOG podznaka. „Tvoj dan" i ocene oblasti postoje samo za korisnika. Kad Premium istekne, osobe se ne brišu: otvorena ostaje prva dodata. Uz pitanje o drugoj osobi astrolog dobija njenu kartu, odnos („Partner", „Dete"…) i ime onoga ko pita; uz pitanje o odnosu i kartu onoga ko pita.

Ono što se računa na telefonu (izbor, ocene, redosled) sakriva samo prikaz. Tekstovi koji se plaćaju stižu samo sa servera.

## 5b. Tumačenja natalne karte (tab „Ti", od 28.9.2026) ✅

Dodir na planetu, Ascendent ili aspekt otvara tekst astrologa:
- **Planeta**: tekst za znak („Sunce u Lavu") i za kuću („Sunce u 5. kući"), kuće po Placidusu.
- **Ascendent**: podznak u znaku.
- **Aspekt**: između planeta i na Ascendent, natalnim orbisima (poglavlje 2). **Na MC nema aspekata.** MC nema tumačenje.
- **Besplatno**: Sunce, Mesec i podznak u znaku. Ostalo je uz Premium; provera je u bazi.

**Nepoznato vreme rođenja** (radije priznati nego pogađati):
- nema podznaka, kuća ni aspekata na Ascendent;
- **Mesec**: znak se tumači samo ako je Mesec ceo dan rođenja bio u istom znaku. Ako je tog dana prešao u sledeći, aplikacija kaže da ne zna i nudi unos vremena. ⏳
- **Mesečevi aspekti se ne tumače** (red ostaje u tabeli, bez teksta), jer orbis može da odstupa i do ±7° pa aspekt možda i ne postoji. ⏳ Povezano sa pitanjem 10 u poglavlju 9.

**Ekran „Ti" (od 28.9.2026, po uzoru na sajt):**
- **Velika trojka** ispod imena: Sunce, Mesec i podznak, svaki vodi na besplatno tumačenje. Bez vremena rođenja podznak piše „Nepoznat", a Mesec koji je tog dana promenio znak piše oba znaka („Blizanci ili Rak").
- **Lista planeta** se rasklapa: „u Raku" i „u 2. kući", uz **podnaslov tumačenja** i katanac kad je tekst plaćen. Naslovi zaključanih tekstova stižu kroz funkciju `natal_naslovi` (samo naslov, nikad tekst). Ascendent i MC su na kraju liste.
- **Aspekti**: podnaslov tumačenja je glavni red, ispod ime aspekta i orbis.
- **Simbolika** na vrhu tumačenja (planeta, znak, kuća, aspekt): ključne reči astrologa iz `files/simbolika/` (`src/lib/simbolika.ts`): planete i znakovi po 7 reči, kuće iz „Kuće značenje", aspekti tema + rečenica („Konjunkcija – Borba"). Ispravljene samo slovne greške (spisak u vrhu fajla).

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
4. **Vladari znakova**: „Tvoj dan" koristi tradicionalne (odluka 27.9.2026); stari Hero (besplatni) i dalje moderne.
5. **Konjunkcije u „ide ti / koči te"**: podela po tranzitnoj planeti.
6. **Najjači Mesečev aspekt dana**: redosled kriterijuma.
7. **Deo biljke po elementu** (Maria Thun).
8. **Kuće u „Promenama na nebu"** po Whole Sign-u umesto Placidusa.
9. **Prag „jakog" aspekta za Hero**: 1,5°. **Pauza**: 7 dana. **Dan egzaktnosti**: najviše 1,5°.
10. **Nepoznato vreme rođenja**: da li natalni Mesec izostaviti kao metu, jer za 12 sati pređe i do 7°?
11. **Ton tranzita** (4.0): pravilo po prirodi planeta, dok ne postoji ručna oznaka.
12. **Teme kuća** za red „Za tebe" (4.3).
13. **Ocene oblasti** (poglavlje 11): veza kuća i planeta sa oblašću, jačine, formula ocene, ton Mladog i Punog Meseca.
14. **Pitanja o drugoj osobi** (5c): da li prima pitanja o trećoj osobi koja ona možda ne bi želela („da li me vara", njeno zdravlje) — to mora da piše i u uslovima; i da li je pitanje o odnosu (dve karte) iste cene kao obično.
15. **Tumačenja za drugu osobu**: tekstovi su pisani sa „Vi". Ima li tekstova (npr. teški tranziti) koje ne bi trebalo prikazivati kao tumačenje tuđe karte?

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

---

## 11. Ocena dana po oblastima (od 28.9.2026; besplatni vidi samo Ljubav, 29.9.2026) ⏳

Četiri reda bez linija (ikona, naziv, tačkice), u istoj kartici iznad „Ide ti / Koči te" na slajdu „Danas ukratko" na početnoj; oznaka („Dobar dan") je samo u VoiceOver-u. Tab „Tranziti" koristi ŠIRI spisak (orbis „Teme perioda", poglavlje 5) i
istu jačinu (za redosled po važnosti), ali oblasti i ocene NE prikazuje (Ivan, 28.9.2026). **Sve vrednosti iz ovog poglavlja
su u jednom fajlu, `src/lib/oblasti-config.ts`** — menjaju se bez diranja koda.
Sve je predlog iz specifikacije i čeka potvrdu.

**Koji tranziti ulaze u ocenu:** svi tranziti Sunca do Plutona koji su tog dana u orbisu.
Orbisi su **isti kao za „Tvoj dan"** (1,5°; Uran, Neptun, Pluton 1°), a ne 3° kao
u „Danas ukratko". Tranzit je „tog dana" ako je u orbisu u nekoj od dve ponoći ili
postaje tačan tokom dana — lista i ocena su iste ceo dan. **Mesečevi tranziti ne
ulaze** (traju nekoliko sati i zatrpali bi listu).

**Oblasti i veza:**

| Oblast | Kuće | Planete |
|---|---|---|
| Ljubav | 5, 7 | Venera, Mesec, Mars |
| Zdravlje i lepota | 1, 6 | Sunce, Mars, Asc |
| Karijera i finansije | 2, 10 (6 i 8 slabije) | Jupiter, Saturn, Merkur, MC |
| Kuća i bašta | 4 | Mesec, Saturn |

Tranzit je vezan za oblast ako: tranzitna planeta prolazi kroz njenu kuću, ili
pogođena natalna tačka stoji u njenoj kući, ili je tranzitna ili natalna planeta
na njenoj listi. Jačina veze: kuća 1,0 (slabija kuća 0,5), planeta 0,5 — uzima se
najveća. Tranzit može biti u više oblasti; bez ijedne veze ne utiče ni na jednu ocenu. Kuće su Placidus, kao u natalnoj karti.

**Jačina tranzita (0–1):** planeta (Pluton, Neptun, Uran 1,0; Saturn 0,9; Jupiter
0,8; Mars 0,7; Sunce, Venera, Merkur 0,6) × aspekt (konjunkcija 1,0; opozicija i
kvadrat 0,9; trigon 0,7; sekstil 0,5) × 1,2 ako je pogođeno Sunce, Mesec, Asc, MC
ili vladar horoskopa × blizina (1 − 0,5 × udaljenost / orbis; tačan = 1, ivica
orbisa = 0,5). Najviše 1. Udaljenost je najmanja tog dana, ne u trenutku otvaranja.

**Ocena:** doprinos = znak tona (Povoljno +1, Izazovno −1, Mešovito 0) × jačina ×
veza × 2; ocena = 3 + zbir doprinosa, zaokruženo i u granicama 1–5. Zaokružuje se
simetrično oko 3 (+2,5 → 5 i −2,5 → 1), da loš dan ne ispadne blaži od dobrog.
Oznake: 5 „Odličan dan", 4 „Dobar dan", 3 „Miran dan", 2 „Oprezno", 1 „Težak dan".
Ton je astrologova ručna oznaka, a bez nje pravilo iz 4.0.

**Mlad i Pun Mesec u kući:** poseban red u oblasti te kuće, samo na dan faze:
„Novi početak: {tema kuće}" (Povoljno) / „Vrhunac: {tema kuće}" (Mešovito), jačina
0,5. Teme kuća su iz 4.3. Ulazi samo u ocenu (na tabu „Tranziti" se ne prikazuje).

**Bez vremena rođenja:** kuća nema, veza je samo preko planeta, Asc i MC nisu mete,
nema Mladog i Punog Meseca u kući.

**Koliko još traje** — ISTO na svim ekranima: tab „Tranziti", „Tema perioda" na početnoj, ceo tekst
tranzita i list „Na osnovu čega". Do izlaska iz orbisa liste (3°, sekstil 2°). N = broj dana POSLE danas
do poslednjeg dana u orbisu, pa se slaže sa opsegom datuma („27 SEP – 30 SEP" 28. septembra = „Traje još 2 dana").
Do 30 dana „Traje još N dana" („Poslednji dan" na poslednji), preko toga „Traje još N meseci"; Mesec „Samo danas".
Do 29.9.2026 ceo tekst je merio orbisom „Tvog dana" (1,5°) i pokazivao drugi broj nego lista.

Provere: `npm run check:oblasti`. Pregled sa test kartom: `/dev-tranziti` (samo dev).

