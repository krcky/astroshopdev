# Uvoz tekstova u Supabase i napomene za astrologa

Stanje: 28. septembar 2026. Brojevi su izračunati iz samih fajlova (`izvestaj.py`, `natal.py --izvestaj`, `lunarni.py`), ne prepisani.

---

## DEO 1 — Uvoz u Supabase (za Ivana)

Tri korpusa, tri tabele. Za svaku: prvo SQL (napravi tabelu i zaštitu), pa CSV.

| Korpus | SQL | CSV | Redova |
|---|---|---|---:|
| Tranziti | `supabase/transit-texts.sql`, pa `supabase/transit-tone.sql` | `~/Desktop/Astroshop App/Tranziti AstroShop/transit-texts.csv` | 1191 (596 kratkih + 595 dugih) |
| Natalna karta | `supabase/natal-texts.sql` | `files/natal-texts.csv` (u projektu, van git-a) | 508 (sa podznakom, 28.9.) |
| Lunarni kalendar | `supabase/lunar-texts.sql` | `~/Desktop/Astroshop App/Lunarni kalendar/lunar-texts.csv` | 420 |

CSV fajlovi su već napravljeni i u njima je primenjena lektura. Ako se u međuvremenu promeni neki `.docx`, prvo ih napravi ponovo:

```bash
python3 scripts/korpus/izvoz_csv.py
```
```bash
python3 scripts/korpus/natal.py
```
```bash
python3 scripts/korpus/lunarni.py
```

### Korak 1 — SQL

Supabase → projekat → **SQL Editor** → **New query**. Nalepi ceo sadržaj fajla → **Run**. Redom:

1. `supabase/transit-texts.sql` → poruka `OK: tabela transit_texts spremna`
2. `supabase/transit-tone.sql` → `OK: kolona transit_texts.tone postoji` (kolona za ručni ton; može ostati prazna)
3. `supabase/natal-texts.sql` → `OK: tabela natal_texts spremna`
4. `supabase/lunar-texts.sql` → `OK: tabela lunar_texts spremna`

Svi fajlovi smeju da se puste i više puta: tabelu prave samo ako ne postoji, a politike brišu pa prave iznova.

### Korak 2 — isprazni tabele (ako su nekad već punjene)

CSV je **ceo korpus, ne dopuna**. Ako u tabeli već ima redova, uvoz bi pao na duplom ključu. U SQL Editoru:

```sql
truncate public.transit_texts;
truncate public.natal_texts;
truncate public.lunar_texts;
```

### Korak 3 — CSV

Supabase → **Table Editor** → izaberi tabelu → dugme **Insert** → **Import data from CSV** → prevuci fajl.

- U pregledu proveri da su kolone prepoznate po imenu (prvi red CSV-a je zaglavlje) i da nijedna nije označena za preskakanje.
- **Import**. Za tranzite (2,4 MB) traje malo duže.

Redosled nije bitan.

### Korak 4 — provera

U SQL Editoru. Mora da vrati tačno ove brojeve:

```sql
select 'transit short' as sta, count(*) from public.transit_texts where version = 'short'   -- 596
union all select 'transit long', count(*) from public.transit_texts where version = 'long'   -- 595
union all select 'natal', count(*) from public.natal_texts                                   -- 508
union all select 'natal besplatni', count(*) from public.natal_texts where free              -- 36
union all select 'lunar', count(*) from public.lunar_texts;                                  -- 420
```

Ako je broj manji, uvoz je negde prekinut. Ponovi korak 2 i 3 za tu tabelu.

### Ponovni uvoz samo natalne karte (podznak, 28.9.2026)

Prvi uvoz (496 redova, 24 besplatna) je prošao, ali je bio **bez podznaka**. Novi CSV ima 508 redova i 36 besplatnih. Uvozi se ceo, ne samo 12 novih redova:

1. SQL Editor: `truncate public.natal_texts;`
2. Table Editor → `natal_texts` → Insert → Import data from CSV → `files/natal-texts.csv`
3. Provera: `select count(*) as ukupno, count(*) filter (where free) as besplatno from public.natal_texts;` mora vratiti **508 | 36**. (Bez `as` SQL Editor spoji dve kolone istog imena i pokaže samo drugu.)

Tranzite i lunarni kalendar ne treba dirati.

### Korak 5 — pristup za testiranje na telefonu

Duge verzije tranzita i plaćeni natal server šalje samo nalogu koji ima kupovinu (`entitlements`) ili poklon (`pokloni`). Jednom pokreni `supabase/pokloni.sql` u SQL Editoru, pa za svaki nalog: `select admin.daj_premium('email');`. Spisak: `select * from admin.spisak_poklona;`.

Prekidač za Premium u profilu (dev) menja samo prikaz. Duge tekstove ne otključava, to radi ovaj korak.

### Šta posle uvoza radi u aplikaciji

| Tabela | Ko čita | Gde se vidi |
|---|---|---|
| `transit_texts` kratka | svaki prijavljen | Hero, „Danas ukratko", tab Tranziti |
| `transit_texts` duga | samo sa pristupom | „Tvoj dan" (tri stavke), ekran tumačenja |
| `lunar_texts` | svaki prijavljen | „Mesec danas", ekran Mesec |
| `natal_texts` | besplatno: Sunce, Mesec i podznak u znaku (36); ostalo samo sa pristupom | tab „Ti": dodir na planetu, Ascendent ili aspekt otvara tumačenje (`/natal`) |

Na webu (`npm run web`) tekstovi stižu tek kad si prijavljen. `/dev-kartice` bez prijave pokazuje samo proračun.

---

## DEO 2 — Napomene za astrologa

Sve što tekstovi traže od astrologa, na jednom mestu. Uz svaku stavku piše šta tačno fali i šta aplikacija radi dok ne stigne.

### A. Tranziti

**1. Kratke verzije koje fale — 161.** Aplikacija sada prikazuje **nacrte** sažete iz astrologovih dugih verzija (njegove reči). Nacrti su u `Tranziti AstroShop/NACRT kratke verzije - Mesec, ASC, MC.docx`, u istom obliku kao njegovi kratki fajlovi. Treba da ih pregleda, ispravi i vrati; njegov tekst tada automatski zamenjuje nacrt.

| Grupa | Fali | Nacrt postoji |
|---|---:|---:|
| Mesec kao tranzitna planeta (sve mete) | 50 | 50 |
| Planete na Ascendent i MC | 100 | 99 |
| Merkur konjunkcija Pluton | 1 | 1 |
| Pluton sekstil (Sunce … Pluton) | 10 | 10 |

Bez nacrta, jer nema ni duge verzije: **Pluton kvadrat Ascendent**.

**2. Duge verzije koje fale — 4.**
- Pluton kvadrat Ascendent
- Pluton trigon Pluton
- **Pluton konjunkcija Neptun** i **Pluton opozicija Pluton**: u dokumentu umesto teksta stoji napomena da ih treba izbrisati. Ovi tranziti **se dešavaju** (provereno proračunom): Pluton konjunkcija Neptun imaju rođeni 1999–2011 upravo sada, a opoziciju Pluton–Pluton ljudi oko 83. godine. Dok tekst ne stigne, u bazi ostaje stari tekst iz 2025.

**3. Upisano dvaput** (zadržana je prva verzija). Dupli naslov često znači da je na tom mestu trebalo da stoji drugi tranzit:
- Sunce opozicija Uran, Sunce opozicija Venera, Sunce sekstil Jupiter — *Sunce tranziti kratki.docx*
- Pluton trigon Neptun — *10. Pluton tranziti duga v.docx*
- Pluton sekstil Ascendent — *11. Planete tranziti Ascendent.docx*

**4. Ne treba pisati** (ciklus duži od ljudskog veka): Neptun konjunkcija Neptun, Pluton konjunkcija Pluton, Pluton opozicija Neptun.

**5. Lektura — 775 ispravki**, izveštaj `Tranziti AstroShop/Lektura tumacenja 27.9.2026.docx`. Po vrsti: slovne 296, gramatika 264, kroatizmi 59, obraćanje („vi" usred rečenice) 52, ijekavica 49, **smisao 29**, razmaci 26. Najvažnije je da pregleda one označene kao **smisao**: tu je rečenica menjana po značenju, ne samo po slovu. Originalni `.docx` nisu dirani.

**6. Ton tranzita (novo).** Kartica „Tvoj dan" svakom tranzitu daje ton: Povoljno, Izazovno ili Mešovito. Sada se računa po pravilu (priroda obe planete; `ASTRO-LOGIKA.md`, 4.0). Astrolog može za bilo koji tranzit da upiše svoj ton, i on ima prednost. Najkorisnije: da pregleda spisak tranzita kod kojih pravilo daje „Mešovito" i potvrdi ga ili promeni.

### B. Natalna karta

**1. Podznak u znaku — stigao 28.9.2026, 12 od 12.** Natalna karta je sada kompletna: planete u znakovima 116/116, podznak 12/12, u kućama 120/120, aspekti 260/260. Uvodni pasus fajla („Ascendent ili podznak je…") je opšti, ne vezan za znak, pa se ne uvozi. U tekstovima je znak „Škorpion", a u aplikaciji „Škorpija" (naslov „Ascendent u Škorpionu").

**Aspekti na MC se u natalnoj karti NE koriste** (Ivan, 28.9.2026) i ne treba ih pisati. Na Ascendent da (50 tekstova). U tranzitima MC ostaje meta.

**2. Lektura — 896 ispravki** (`files/natal-ispravke.json`): slovne 537, gramatika 322, interpunkcija 9, kroatizmi 3, obraćanje 1, plus **24 u podznaku** (28.9.). Neke od njih u podznaku: „podzanaku / poznaku" → „podznaku", „izledate" → „izgledate", „intezivna" → „intenzivna", „Koliko ste za dobri" → „Koliko ste dobri", „To je prirodno konsekvenca vašem prilazu životu" → „prirodna konsekvenca vašeg pristupa životu". Izveštaj u Word-u za astrologa još nije napravljen; može se napraviti kao za tranzite.

**3. Putokazi umesto teksta.** Na više mesta stoji „pogledati kod Sunca" ili „ako treba, kopirati iz Meseca". Isti aspekt se u aplikaciji koristi jednom, pa je to u redu i ništa ne fali. Ako je astrolog nameravao da napiše drugačiji tekst iz ugla druge planete, treba to da kaže.

**4. Odbačen jedan tekst:** objašnjenje ispod napomene da Sunce i Venera ne mogu biti udaljeni više od 48°. Aspekti koji se ne mogu desiti nemaju tekst, i tako treba.

### C. Lunarni kalendar

Kompletno: **420 od 420** (7 faza × 12 znakova × 5 oblasti).

**1. Kratke liste.** Kartica na početnoj prikazuje **tri stavke** po oblasti. U 129 tekstova lista ima samo jednu ili dve stavke; tada aplikacija dopunjuje poslednjim rečenicama uvoda, što je ispravno ali nije idealno. Najbolje bi bilo da svaka lista ima bar tri stavke.

| Oblast | Tekstova sa 1–2 stavke (od 84) |
|---|---:|
| Kuća | 46 |
| Ljubav i odnosi | 27 |
| Bašta | 23 |
| Karijera i finansije | 22 |
| Zdravlje i lepota | 11 |

**2. Bašta: „Uradi" i „Izbegavaj".** Kartica deli savete na ta dva spiska. Oznake u tekstu nema, pa se prepoznaje po rečima („Ne…", „Nemojte…", „nepovoljno"). U **53 od 84** tekstova nema nijedne zabrane, pa „Izbegavaj" ostaje prazno. Predlog: da u Bašti uvek piše dva podnaslova, „Povoljno:" i „Nepovoljno:", kao u starom kalendaru iz 2019.

Stavke koje počinju sa „Ne", a nisu zabrane, treba da potvrdi (svrstane su u „Uradi"):
- Prva četvrt u Raku: „Nega rasada u leji."
- Prva četvrt u Biku: „Nega rasada i priprema leja."
- Poslednja četvrt u Vagi: „Nega zasejanih biljaka u staklenicima."
- Opadajući (posle Punog) u Ribama: „Negovati, zalivati i prehranjivati izniklo povrće."

**3. Deo biljke.** Svi tekstovi Bašte ga navode osim jednog: **Opadajući Mesec (posle Punog) u Vagi**. Aplikacija ga računa sama (vatra plod, zemlja koren, vazduh cvet, voda list), i to se sa tekstovima poklapa u svih 83.

**4. Lektura — 899 ispravki** (`Lunarni kalendar/ispravke.json`): slovne 496, gramatika 341, razmaci 22, kroatizmi 14, **smisao 13**, ijekavica 13. U tekstovima se piše „Škorpion", a u aplikaciji „Škorpija"; treba se dogovoriti oko jednog oblika.

**5. Nedostaje — rečenica faze.** Kartica „Mesec danas" ispod naslova ima jednu rečenicu o fazi. Sada je **privremena, nije astrologova**. Treba 6: Mlad Mesec, Prva četvrt, Pun Mesec, Poslednja četvrt, Rastući, Opadajući.

**6. Nedostaje — Mlad i Pun Mesec u tvojoj kući.** Red „Za tebe" na dan Mladog ili Punog Meseca kaže u koju natalnu kuću faza pada. Treba **24 teksta** (2 faze × 12 kuća). Dok ne stignu, red se ne prikazuje. Treba potvrditi i teme kuća:

| Kuća | Tema | Kuća | Tema |
|---|---|---|---|
| 1 | ti i tvoje telo | 7 | partnerstva |
| 2 | novac i vrednosti | 8 | zajednički novac i promene |
| 3 | komunikacija i okolina | 9 | putovanja i učenje |
| 4 | dom i porodica | 10 | karijera i ugled |
| 5 | ljubav, kreativnost i deca | 11 | prijatelji i planovi |
| 6 | posao i zdravlje | 12 | odmor i unutrašnji svet |

### D. Ostali tekstovi koji se čekaju

- **Osobine po znaku** (`lib/traits.ts`): 12 znakova × 3 reda. Sada je privremeno.
- **„Planeta u kući" kao tranzit** (120 tekstova): „Promene na nebu" pokazuju u koju kuću planeta ulazi, ali red ne vodi nigde jer teksta nema.

### E. Pitanja o logici

Detalji su u `docs/ASTRO-LOGIKA.md`, poglavlje 9. Ukratko:

1. **Kiron**: da li je potreban? Traži posebnu efemeridu.
2. **Orbisi**: natalni 8/4/6/6/8°; tranzitni 3° (sekstil 2°), a u „Tvom danu" 1,5° (Uran, Neptun, Pluton 1°). Da li treba drugačije za Mesec, Sunce ili spore planete?
3. **Težine** planeta i meta u bodovanju.
4. **Vladari**: „Tvoj dan" koristi tradicionalne (njegova odluka). Stari Hero za besplatne korisnike i dalje koristi moderne. Da li i njega prebaciti?
5. **Konjunkcije u „ide ti / koči te"**: podela po tranzitnoj planeti (Sunce, Merkur, Venera, Jupiter idu u „ide ti").
6. **Najjači Mesečev aspekt dana**: prvo meta, pa aspekt, pa raniji sat.
7. **Deo biljke po elementu** (Maria Thun).
8. **Kuće u „Promenama na nebu"** po Whole Sign-u umesto Placidusa.
9. **Prag jakog aspekta** 1,5° i **pauza** 7 dana (stari Hero).
10. **Nepoznato vreme rođenja**: da li izostaviti natalni Mesec kao metu? Za 12 sati pređe i do 7°.
11. **Ton tranzita**: pravilo po prirodi planeta (A6).
12. **Teme kuća** za red „Za tebe" (C6).
