# Pregled prevoda, 1.10.2026

Nezavisni recenzenti (model u ulozi izvornog lektora, novi kontekst), po jedan za svaki jezik. "ISPRAVLJENO" je već u kodu; "PREDLOZI" čekaju odluku.

---

## Lektura hrvatskog prevoda (src/i18n/hr/)

## ISPRAVLJENO

| fajl:ključ | bilo | sada | zašto |
|---|---|---|---|
| danas:tranzit.imeNatalni | `${tranzitna} ${aspekt} natalni ${natalna}` ("Saturn kvadrat natalni Venera", "… natalni Sunce") | rod se uzima iz `nebo.padeziTela` po imenu tela: "natalna Venera", "natalno Sunce", "natalni Mars/Ascendent/MC" | Pridev se nije slagao u rodu (pocetna, "Tvoj dan" info, citac ekrana); potpis funkcije nije menjan. |
| onboarding:reveal.vladajucaPlaneta | Vladajuća planeta: … | Vladajući planet: … | U hrvatskom standardu "planet" je muškog roda; drugi fajlovi (danas, prica) već pišu "nijedan planet" — sada je svuda isto. |
| profil:premium.natalnaTekst | Tumačenje svake planete … | Tumačenje svakog planeta … | Isto (planet, m. rod) — paywall. |
| karta:tumacenje.kucaBezVremena | U kojoj je kući planeta, … | U kojoj je kući planet, … | Isto. |
| karta:tumacenje.premiumOpis | Ostale planete u znakovima … | Ostali planeti u znakovima … | Isto. |
| karta:info.retro | R pokraj planete znači da je retrogradna | R pokraj planeta znači da je retrogradan | Isto, sa slaganjem prideva. |
| karta:natalnaInfo.uvod | … Mjesec i planete … | … Mjesec i planeti … | Isto. |
| karta:natalnaInfo.planete | Planete — što | Planeti — što | Isto. |
| karta:natalnaInfo.planeteOpis | Svaka planeta je … | Svaki planet je … | Isto. |
| karta:natalnaInfo.znakoviOpis | Ista planeta u svakom … | Isti planet u svakom … | Isto. |
| karta:natalnaInfo.kuceOpis | … gdje planeta djeluje | … gdje planet djeluje | Isto. |
| karta:natalnaInfo.krunicaOpis | Planeta s krunicom … u kojem ona sudjeluje | Planet s krunicom … u kojem on sudjeluje | Isto, sa zamenicom. |
| karta:natalnaInfo.krug | simboli su planete | simboli su planeti | Isto. |
| karta:neboInfo.uvod | … Mjesec i planete … | … Mjesec i planeti … | Isto. |
| karta:neboInfo.krug | simboli su planete | simboli su planeti | Isto. |
| pitaj:novo.primerOdnos | Npr. Kako se bolje razumjeti kad se ne slažemo? | Npr. Kako se možemo bolje razumjeti kad se ne slažemo? | Bezlični infinitiv uz "slažemo" je lomio rečenicu (nema subjekta u prvom delu); sada je "mi" u oba dela, kao u izvoru. |
| onboarding:nalog.bezVremena | „Vrijeme rođenja” | „Vrijeme rođenja“ | Jedini par navodnika sa drugim zatvaranjem; ostalih 5 mesta u hr ima „…“. |
| profil:rodjenje.nemaVise, pitaj:greske.nemaOsobe | … na tvojem popisu | … na tvom popisu | Ista rečenica je u danas/karta bila "tvom popisu"; sada je na sva 4 mesta isto (i "tvog" svuda drugde). |
| profil:osobaUredi.obrisatiTekst | nestaje s tvojeg popisa | nestaje s tvog popisa | Isto — jedan oblik prisvojne zamenice u celom rečniku. |

## PREDLOZI (nije primenjeno)

| fajl:ključ | sada | predlog | zašto |
|---|---|---|---|
| onboarding:ime.naslov | Kako da te zovemo? | Kako ćemo te zvati? | "da + prezent" je u pitanju prihvatljiv, ali buduće vreme zvuči prirodnije u Zagrebu. |
| profil:osoba.uzPremiumOpis | … karte i tranzite za do 10 osoba. | … karte i tranzite za najviše 10 osoba. | "za do" je kalk iz srpskog izvora; "najviše" je čistije. (Pazi: `osobaGen` daje genitiv, uz "za najviše 1" ne bi valjalo — ali n je 10.) |
| prica:ponudi.pravimoOkoMinut | Video izrađujemo oko minutu. | Izrada videa traje oko minutu. | "izrađujemo oko minutu" zvuči prevedeno. |
| danas:tvojDanInfo.vladarNatalni | … dan se osjeća osobnije i jače … | … dan je osobniji i jači … | "dan se osjeća" je kalk (isti je i u srpskom izvoru). |
| prica:video.sacuvano | Spremljeno u Fotografijama | Spremljeno u Fotografije | Uz "spremiti" hrvatski češće ide akuzativ (kamo); lokativ nije greška, pa je ostavljeno. |
| nebo:fazeMeseca / karta:luna.faze.new | Mladi Mjesec | Mlađak (ili ostaviti) | "Mlađak" je hrvatski naziv faze; "Mladi Mjesec" se razume i ostaje dosledan sa "Pun Mjesec". Odluka za Ivana. |
| prica:znak.kvalitet | Kardinalan / Fiksni / Promjenjiv | Kardinalni / Fiksni / Promjenjivi | Mešani kratki i dugi oblik prideva (preneto iz srpskog izvora); u naslovu `osnove` su svi dugi. |
| karta:nebo.trenutno | Sada | (ostaviti) ili Trenutačno | "Sada" je kraće za dugme; samo napomena da izvor kaže "Trenutno". |
| datum:mesecKratko | ruj, lis … (bez tačke) | ruj., lis. … | Hrvatski pravopis kratice meseci piše s točkom; PREVOD.md izričito traži oblik bez nje ("29. ruj 2026."), pa nije dirano. |

Opšta ocena: prevod je dobar i dosledan (ijekavica, infinitiv, hrvatski rečnik, „…“ navodnici, tačka iza godine su ispravni gotovo svuda); prave greške su bile slaganje "natalni + Venera/Sunce" i mešanje "planet"/"planeta", što je sada ujednačeno.

---

## Lektura bosanskog prevoda (src/i18n/bs/)

Provereno: svih 10 fajlova prema src/i18n/sr/. Posle izmena prolaze `npx tsc --noEmit -p .` i `npx tsx scripts/check-prevod.ts`.

## ISPRAVLJENO

| fajl:ključ | bilo | sada | zašto |
|---|---|---|---|
| danas.ts:tumacenje.kratkaVerzija | „…oblasti života na koja tranzit djeluje…“ | „…oblasti života na koje tranzit djeluje…“ | „oblast“ je ženskog roda, pa je množina „oblasti … na koje“. Ovo je greška u slaganju roda. |
| danas.ts:tranzit.imeNatalni | „Mars kvadrat natalni Venera“, „… natalni Sunce“ | „natalna Venera“, „natalno Sunce“, a za ostale „natalni“ | Pridev se nije slagao sa rodom. Rod se sad bira poređenjem sa `nebo.tela`, a potpis funkcije je ostao isti. Ista greška postoji i u **sr** (i u hr) — vidi napomenu ispod. |
| prica.ts:dnevna.boljeNegoJuce | „↑ bolje nego juče“ | „↑ bolje nego jučer“ | Ista reč nije bila ista u svim fajlovima: `danas.relativniDani` („Jučer“, „Prekjučer“) i `onboarding.push.juce` („jučer“) pišu „jučer“. |
| prica.ts:dnevna.ocenaA11y | „…, bolje nego juče“ | „…, bolje nego jučer“ | Isti razlog kao u redu iznad. |
| pitaj.ts:greske.nepoznato | „Probaj ponovo za minutu.“ | „Probaj ponovo za minut.“ | Svuda drugde u prevodu stoji „za minut“ i „oko minut“ (onboarding, profil, prica). |

## PREDLOZI (nije primenjeno)

| fajl:ključ | sada | predlog | zašto |
|---|---|---|---|
| sr/danas.ts (i hr):tranzit.imeNatalni | „natalni Venera“, „natalni Sunce“ | isti popravak kao u bs | Ovo je greška u srpskom IZVORU; vidi se na početnoj i u „Zašto baš ovaj tekst?“. Ja smem da menjam samo bs, pa ostalo nisam dirao. |
| karta.ts:kalendar.meseciPuno | „juni, juli, august“ | ostaviti ovako, ali dopuniti docs/PREVOD.md | PREVOD.md kaže „mjeseci … kao srpski“, a bosanska norma je juni / juli / august (kratko „aug“ u `datum` se slaže sa tim). Prevod je ispravan, a pravilo u dokumentu je neprecizno. |
| karta.ts:elementi, prica.ts:znak.element/polaritetOpis/osnove | „Zrak“, „zračni“ | ostaviti ovako (ili „Vazduh / vazdušni“) | Oba oblika su bosanska. „Zračni znakovi“ je uobičajeno u astro tekstovima u BiH. Pojam je isti u oba fajla. Odluka je stilska. |
| karta.ts:tumacenje.kucaBezVremena | „U kojoj je kući planeta, može se reći tek uz tačno vrijeme rođenja.“ | „U kojoj je kući planeta, zavisi od tačnog vremena rođenja.“ ili bez zareza | Ovako je malo nespretno i stoji zarez između subjekatske rečenice i predikata. Bliže je izvoru („zavisi od tačnog vremena“). |
| onboarding.ts:reveal.bezVremena | „Ako ne znaš vrijeme rođenja, ascendent se ne može izračunati. Možeš ga dodati kasnije u profilu.“ | „Bez vremena rođenja ascendent se ne može izračunati. Dopunit ćeš ga kasnije u profilu.“ | Prevod je ispravan, ali duži od izvora. Ovako je bliže srpskom. |
| karta.ts:neboInfo.uvod | „iz minute u minutu“ | ostaviti | Ovo je ustaljen izraz pa nije u sukobu sa „za minut“, ali ga beležim zbog doslednosti. |
| prica.ts:video.otvoriPodesavanja | „Otvori Postavke“ | ostaviti | iOS nema bosanski jezik, pa korisnici obično imaju hrvatski ili engleski sistem, gde aplikacija i jeste „Postavke“ / Settings. To se slaže sa pojmovnikom. |
| danas.ts:pocetna.relativniDani, prica.ts, onboarding.ts:push.juce | „jučer / prekjučer“ | ostaviti | „juče“ je takođe bosansko. Izabrao sam „jučer“ jer je već bilo na većini mesta, a važno je samo da se ne mešaju. |

## Opšta ocena

Prevod je dobar i dosledan: ijekavica je čista, pojmovnik je ispoštovan (račun, obavještenja, postavke, sedmica, tačka, ko/šta), padeži idu kroz `nebo`, a datum ima tačku iza godine. Našao sam jednu pravu gramatičku grešku (rod uz „oblasti“), jednu grešku nasleđenu iz srpskog izvora („natalni Venera“) i dve sitne nedoslednosti.

---

## Lektura slovenačkog prevoda (src/i18n/sl/)

Provereno: svih 10 fajlova prema `sr/`; padeži u `nebo`, dvojina u svim `mnozina` pozivima (1, 2, 3, 5, 101, 102),
s/z po glasu (nijedna greška), srbizmi (nijedan), napomena "v srbščini" u `pitaj.uvod.glasovno`,
`pitaj.pitanje.ceka` i `danas.tumacenje.pitajOpis` (sve tri postoje). `tsc` i `check-prevod.ts` prolaze.

## ISPRAVLJENO

| fajl:ključ | bilo | sada | zašto |
|---|---|---|---|
| prica:ponudi.upravoPravimo | „Tega dobiš, ko bo tisti končan.“ | „Tega lahko narediš, ko bo tisti končan.“ | POMEN: srpski „Ovaj možeš čim taj bude gotov“ = možeš da ga napraviš; prevod je obećavao da video stiže sam |
| karta:tumacenje.mesecPresao, mesecPresaoOsoba | „Brez časa rojstva …“ | „Brez ure rojstva …“ | nedoslednost: svuda drugde (ekrani, tabela, dugme „Dodaj uro rojstva“) je „ura rojstva“ |
| karta:tumacenje.kucaBezVremena | „od natančnega časa rojstva. Ko ga vneseš“ | „od natančne ure rojstva. Ko jo vneseš“ | isti pojam + rod zamenice (ura = ž. rod) |
| karta:lista.tackaA11y | „Mars, 12° 5' v znamenju Lev“ | „Mars, 12° 5' v Levu“ | „v znamenju“ traži rodilnik („Leva“), a funkcija dobija samo nominativ; mestnik iz `nebo.znaci` (lokalni pomoćnik `vZnamenju`) |
| danas:horoskop.nebo | „Luna v znamenju Lev · …“ | „Luna v Levu · …“ | isto kao gore |
| karta:neboInfo.strelice | „katerikoli dan“ | „kateri koli dan“ | pravopis: „kateri koli“ se piše odvojeno |
| karta:nebo.datumA11y | „Datum: … Dotakni se“ | „Datum: …. Dotakni se“ (tačka posle datuma) | čitač ekrana spajao dve rečenice (greška nasleđena iz srpskog) |
| profil:osobaUredi.obrisatiNaslov | „Izbrišem osebo?“ | „Izbrišeš osebo?“ | nedoslednost: ostali dijalozi su u 2. licu („Izbrišeš račun?“, „Se odjaviš …?“) |

## PREDLOZI (nije primenjeno)

| fajl:ključ | sada | predlog | zašto |
|---|---|---|---|
| gramatika:dana / meseci (oblik za 3–4) | „Traja še 3 dnevi“, „Preizkusi 3 dnevi brezplačno“, „Traja še 3 meseci“ | „3 dni“, „3 mesece“ (tožilnik trajanja) | NAJVAŽNIJE: posle „traja“ / „preizkusi“ ide tožilnik — Slovenac kaže „traja še tri dni / tri mesece“; „trije dnevi“ je nominativ. NIJE ispravljeno jer `scripts/check-prevod.ts` (red 133) zaključava baš „Traja še 3 dnevi … 3 meseci“; menja se zajedno sa testom: oblici `['dan','dneva','dni','dni']`, `['mesec','meseca','mesece','mesecev']` |
| onboarding:reveal.greskaCuvanja | „do strežnika nismo prišli“ | „strežnika nismo mogli doseči“ | kalk, zvuči prevedeno |
| onboarding:kod.zauzetNapomena, udjiUTaj | „Če vstopiš v obstoječi račun“, „Vstopi v ta račun“ | „Če se prijaviš v obstoječi račun“, „Prijavi se v ta račun“ | „vstopiti v račun“ je kalk srpskog „uđi u nalog“ |
| onboarding:vreme.neZnam / profil:rodjenje.neZnamVreme | „Ure ne vem“ / „Ne vem ure“ | isto u oba: „Ne vem ure“ | ista stvar, dva reda reči |
| onboarding:reveal.nepoznat / karta:lista.nepoznat / profil:novaOsoba.ulogaZnak | „neznan“ / „Neznano“ / „neznano“ | jedan oblik (npr. „neznano“) | nedoslednost roda |
| prica:posao.obavestenjeTekst, karta:nebo.datumA11y/mestoA11y | „Dotakni se, da …“ | „Tapni, da …“ | `onboarding.nalog.bezVremena` koristi „Tapni“; izabrati jedno |
| prica:racun.momenat.egzaktan / karta:mesec.tacanU | „točen danes“ / „Natančen ob …“ | isti pridev u oba (npr. „natančen“) | isti pojam (egzaktan aspekt) |
| prica:znak.naPoslu | „Pri delu“ | „V službi“ | par sa „V ljubezni“, prirodnije |
| profil:premium.kupovinaCeka | „Premium se vklopi takoj, ko ta pride.“ | „… takoj, ko bo nakup odobren.“ | „ko ta pride“ je nejasno (ta = odobritev) |
| profil:profil.aktivanObnavljaSe | „Aktiven, podaljša se Tor, 29. sep. 2026“ | „Aktiven, podaljša se dne tor., …“ ili mali dan | veliko slovo dana usred rečenice (isto u srpskom; rešava se u `datum()`) |
| datum:trajeGodinama | „Traja leta“ | „Traja več let“ | prirodnije |
| prica:znak.oznakaKvalitet | „Kvaliteta“ | „Kakovost“ ili „Modalnost“ | „kvaliteta“ je razgovorno; u slovenačkoj astrologiji češće „modalnost/križ“ — pitanje za astrologa |
| onboarding:nalog.odjavaTekst | „v tem telefonu“ | „na tem telefonu“ | češće u govoru (oba su ispravna) |

Opšta ocena: prevod je dobar i gramatički pažljiv (dvojina, padeži, s/z, rod „natalni/natalna/natalno“ su tačni, srpska napomena za astrologa postoji), a jedina ozbiljna sistemska greška je oblik za 3–4 dana/meseca posle „traja“, koji je zaključan testom.

---

## Pregled makedonskog prevoda (src/i18n/mk/)

Provereno: `npx tsc --noEmit -p .` prolazi; `npx tsx scripts/check-prevod.ts` prolazi. Množina je proverena za 1, 2, 5, 11 i 21 (dana, kuća, osobe, plaćena pitanja, ton, lunarni dan) i svuda je tačna. "На српски" stoji u sva tri obavezna ključa.

## ISPRAVLJENO

| fajl:ključ | bilo | sada | zašto |
|---|---|---|---|
| prica:znak.redni (REDNI[3]) | „Четврт знак во зодијакот“ | „Четврти знак во зодијакот“ | „четврт“ znači „četvrtina“; redni broj je „четврти“ |
| prica:znak.vladarNaslov | imena 12 znakova napisana ručno u funkciji | ime znaka iz `nebo.znaci[k].ime` | pravilo: imena znakova dolaze iz `nebo`, ne ručno |
| prica:znak.vladarRecenica | „…натална карта Месечина е во Рак.“ | „…натална карта Месечината е во Рак.“ | kao subjekat rečenice Сонце i Месечина nose član; planete (Марс, Венера) ne |
| danas:promena.ulazi | „Сонце влегува во Вага“ | „Сонцето влегува во Вага“ | isto: član uz Sunce/Mesečinu kad su subjekat |
| danas:tvojDanInfo.vladarNatalni, vladarTranzitni | „Месечина е владетел на твојот Асцендент…“ | „Месечината е владетел…“ (isto i „Сонцето“) | isto (vladar Raka je Mesečina, Lava Sunce) |
| onboarding:push.primerAspektTekst | `${tranzitna} е во…` bez člana | kroz `subjekat()` | isto, za slučaj da tranzitna planeta bude Sunce/Mesečina (sada je Venera) |
| nebo.ts (nov izvoz `subjekat`) | — | `subjekat(ime)` -> „Сонцето“ / „Месечината“ / ime | jedno mesto za pravilo člana; nije ključ rečnika, struktura `Recnik` je ista |
| profil:osobaUredi.napomena | „…картата нема асцендент ни куќи.“ | „…картата нема подзнак ни куќи.“ | srpski kaže „podznak“; natpis reda je „Подзнак“, a isti tekst u `onboarding.nalog.bezVremena` već kaže „подзнакот“ — bila su dva pojma za istu stvar |
| profil:rodjenjePolje.vremeNijeUneto | „…нема асцендент ни куќи.“ | „…нема подзнак ни куќи.“ | isto |
| profil:novaOsoba.vremePodnaslov | „Без време картата нема асцендент ни куќи.“ | „…нема подзнак ни куќи.“ | isto |
| profil:novaOsoba.bezVremena | „…асцендентот и куќите не можат…“ | „…подзнакот и куќите не можат…“ | isto (srpski: „podznak i kuće“) |
| profil:osoba.pitajAstrologa | „Прашај го астрологот“ | „Прашај астролог“ | isti pojam svuda: tab „Прашај астролог“, „Прашај астролог за овој транзит“ |

## PREDLOZI (nije primenjeno)

| fajl:ključ | sada | predlog | zašto |
|---|---|---|---|
| prica:znak.vladarNaslov | „Со Овен владее Марс“ | „Марс владее со Овен“ | gramatički je ispravno, ali obrnut red reči zvuči prevedeno; prirodan red je subjekat–glagol |
| prica:znak.redni / karta:natalnaInfo.vremeRodjenjaOpis | „…знак во зодијакот“ / „…првиот знак од зодијакот“ | oba „на зодијакот“ | dva različita predloga za isto; „на зодијакот“ je najprirodnije |
| prica:ponudi.upravoPravimo | „Ова ќе можеш штом тоа биде готово.“ | „Ова ќе може штом тоа ќе биде готово.“ | „можеш“ bez dopune („да…“) visi |
| prica:ponudi.pravimoOkoMinut | „Видеото го правиме околу една минута.“ | „За видеото ни треба околу една минута.“ | prirodnije |
| danas:tvojDanInfo.vladarNatalni | „денот се чувствува полично и посилно“ | „денот е поличен и посилен“ | „полично“ (prilog u komparativu) je neobično |
| datum:josGodinama / trajeGodinama | „уште со години“ / „Трае со години“ | „уште години“ / „Трае години“ | „со години“ je razgovorno i malo nespretno uz „трае“ |
| pitaj:novo.primerJa, primerOdnos, primerOsoba | „Пр. …“ | „На пр. …“ | standardna makedonska skraćenica za „на пример“ |
| onboarding:pretragaGrada.trazimDalje, karta:mesto.trazimDalje | „Барам понатаму…“ | „Барам уште…“ | doslovno od „tražim dalje“; „понатаму“ znači pre „u nastavku/kasnije“ |
| karta:luna.naslov | „Прва четвртина во Стрелец“ | „Прва четвртина на Месечината во Стрелец“ | srpski dodaje „Meseca“ uz četvrt; ovako se ne zna čija je četvrtina (Mlada/Polna već sadrže „Месечина“) |
| karta:mesec.saveti / danas:mesecDanas.nemaSaveta | „за ова подрачје“ / „за оваа област“ | jedan pojam, „област“ | ista poruka, dve reči |
| karta:nebo.bezPlacidusa | „Прикажани се куќите Whole Sign.“ | „Прикажани се куќите по целите знаци (Whole Sign).“ | latinica van dozvoljenog spiska; laik ne zna šta je „Whole Sign“ |
| onboarding:nalog.nalogOd | „Сметка од“ | „Сметка отворена“ | „Сметка од“ + datum može da se pročita kao „račun iz…“ |
| onboarding:nalog.obrisatiTekst | „Ова не може да се врати.“ | „Ова не може да се поништи.“ | „poništiti“ je preciznije od „vratiti“ |
| profil:osoba.tranzitiNeMoguTekst, novaOsoba.neMozemoKartuTekst | „според UTC“ | „по UTC“ | u ostalim porukama piše „по UTC“; ujednačiti |
| OTVORENO PITANJE: „Premium“ i „AI“ latinicom | „Отклучи Premium“, „Прашај AI“ | „Premium“ OSTAVITI (ime paketa u prodavnici, kao „Astro Shop“; bez padeža u mk ne smeta). „AI“ je ugrađeno u ćirilični tekst i bode oči; makedonski standard je „ВИ“ (вештачка интелигенција), ali je slabo poznat — preporuka „Прашај ВИ“ samo ako se želi čista ćirilica, inače ostaviti „AI“ | odluka vlasnika |

Opšta ocena: prevod je kvalitetan i prirodan — član, rod i množina su uglavnom tačni, rečnik pojmova se poštuje, a greške su bile sitne i sistemske (član uz Sunce/Mesečinu kao subjekat, dva pojma za podznak).

---

## Pregled engleskog prevoda (src/i18n/en/)

Provereno: svih 11 fajlova prema `src/i18n/sr/`, pojmovniku u `docs/PREVOD.md` i mestu prikaza (grep ključeva u `src/`).
Posle izmena: `npx tsc --noEmit -p .` prolazi, `npx tsx scripts/check-prevod.ts` prolazi.

## ISPRAVLJENO

| fajl:ključ | bilo | sada | zašto |
|---|---|---|---|
| pitaj:tab.josJedno | Questions are answered by astrologer ${ime}. | Astrologer ${ime} answers by voice message, in Serbian. | Nije rečeno da astrolog odgovara na srpskom (pravilo iz PREVOD.md); ovo je jedina rečenica na listi pitanja koja to ne kaže. |
| pitaj:novo.poslatoOpis | ${ime} answers usually within 2–3 business days. | ${ime} usually answers within 2–3 business days. | Srpski red reči ("odgovara obično za"); na engleskom prilog ide pre glagola. Konstanta `ROK` uklonjena, koristi se `ROK_KRATKO`. |
| pitaj:pitanje.ceka | ${ime} answers usually within 2–3 business days. … | ${ime} usually answers within 2–3 business days. … in Serbian. | Isto; "in Serbian" ostaje. |
| pitaj:pitanje.vraceno | This question was refunded, so … | Your payment for this question was refunded, so … | Vraća se novac, ne pitanje ("Novac za ovo pitanje je vraćen"). |
| pitaj:novo.poslatoNaslov | Your question is sent. | Your question has been sent. | Prirodan engleski perfekat. |
| pitaj:tab.krediti | You have one paid question. / N paid questions | You have one prepaid question. / N prepaid questions | "Paid question" se čita kao "pitanje koje je već poslato i plaćeno"; radi se o kreditu. Usklađeno sa `greske.nemaKredita` ("Your prepaid question…"). |
| pitaj:(komentar) | komentar na srpskom | komentar na engleskom | Doslednost fajla (nije tekst za korisnika). |
| prica:racun.imeTranzita | `${tranzitna} ${aspekt} ${natalna}` → "Mars conjunction Sun", "Moon opposition Venus" | "Mars conjunct Sun", "Moon opposite Venus" | Engleski astrolozi pišu "conjunct/opposite" između dve planete; `danas.tranzit.ime` to već radi, priča (naslov slike "Tvoj dan" i natpis "From the reading for …") nije. |
| karta:aspekt | "Sun conjunction Moon", "Sun opposition Saturn" | "Sun conjunct Moon", "Sun opposite Saturn" | Isto, za natalne aspekte (lista ispod točka, naslov tumačenja). |
| karta:nebo.datumA11y | Date: ${datum} Tap to choose a day. | Date: ${datum}. Tap to choose a day. | Fali tačka — čitač ekrana spaja datum i "Tap" u jednu rečenicu (isto i u srpskom). |
| prica:znak.doba | opens spring / mid-spring / end of spring | start of spring / mid-spring / end of spring | "opens spring" je doslovno ("otvara proleće") i ne zvuči kao engleski; sada je niz paralelan. |
| prica:znak.vladarRecenica | In your birth chart Mars is in Taurus. | In your birth chart, Mars is in Taurus. | Zarez posle uvodne priloške odredbe. |
| profil:premium.naslov | Open every reading | Unlock every reading | Doslovno "Otvori"; na paywallu je idiom "unlock" (i pojmovnik: Otključaj = Unlock). |
| profil:premium.obnavljanje | …cancel it in App Store settings. | …cancel it in your App Store settings. | Fali član/zamenica. |
| danas, karta, onboarding, prica, profil (sve) | prava apostrofa ' (u pitaj i karta već ’) | krivi apostrof ’ svuda | Dva stila apostrofa na istom ekranu; navodnici su svuda “ ”, pa i apostrof treba ’. Promenjeno samo slovo'slovo (minute `16° 05'` nisu dirane). |

## PREDLOZI (nije primenjeno)

| fajl:ključ | sada | predlog | zašto |
|---|---|---|---|
| prica:znak.znakUStvarima | The sign in things | Your sign's symbols (ili "Sign symbols") | Doslovno "Znak u stvarima" — na engleskom nema smisla. Utiče na trajanje slike (broj reči), pa nisam menjao bez tebe. |
| danas:oblasti.oznakaOcene[2] | Take care | Go carefully / Tread carefully | "Take care" se čita i kao pozdrav ("Čuvaj se, ćao"). |
| danas:tvojDan.zastoOvajTekst, tvojDanInfo.naslov | Why this text? | Why this reading? | U ostatku aplikacije "tumačenje" = "reading". |
| danas:tvojDanInfo.vladarTranzitni | …today it sets your Venus in motion. | …today it activates your Venus. | Astrološki uobičajenije. |
| profil:profil.pisiteNam | Write to us | Contact us | Standardan natpis u podešavanjima. |
| profil:zakljucano.red, tvojiLjudi.redOsobe, danas:pocetna.danUzPremium, ocene.zakljucana | "X. With Premium" | "X. Included with Premium" / "X. Premium only" | Čitač ekrana: "With Premium" sam po sebi zvuči nedovršeno. |
| onboarding:ime.podnaslov | That way your horoscope talks to you, not like a notice board. | That way your horoscope speaks to you directly, not like a notice board. | Nedostaje "directly" iz izvora; rečenica malo hramlje. |
| onboarding:push.podnaslov | …Nothing else. | …We don't send anything else. | Bliže izvoru ("Ništa drugo ti ne šaljemo"), jasnije obećanje. |
| profil:novaOsoba.datumUVreme, karta:prikaz.rodjenje, mesec.fazaU | "… at 14:30" | "… at 2:30 PM" (ako sat dolazi iz `Intl` za en) | Američki korisnik očekuje 12-časovni zapis; zavisi od toga kako se formatira sat, ne od rečnika. |
| nebo:fazeMeseca, karta:luna.faze | Waxing Crescent, First Quarter… (Title Case) | ostaviti ili "Waxing crescent" | Imena faza su u Title Case, a ostalo je sentence case; u astrologiji je Title Case uobičajen, pa je ovo pitanje ukusa. |
| karta:neboInfo.uvod | …how they stand toward each other. | …how they relate to each other. | Doslovno "kako stoje jedni prema drugima". |
| karta:luna.fazaPrivremeno.first | The first obstacle on the path of what you started calls for a decision and action. | The first obstacle to what you've started calls for a decision and action. | Doslovno; tekst je ionako privremen dok astrolog ne pošalje pravi. |
| danas:pocetna.nemaTema | Right now no slow planet is in aspect with your chart. | Right now, no slow planet… | Zarez posle uvodne odredbe (sitno). |
| prica:dnevna.najboljeTiIde / kartica.najboljeMiIde | Going best for you / for me | Your best area / My best area | "Going best for you" je gramatično, ali neobično. |
| pitaj:plejer.brzinaPoIPo | One and a half times speed | 1.5x speed | Kraće za čitač ekrana; oba su ispravna. |

Ukupna ocena: prevod je dobar i dosledan pojmovniku — pravih grešaka u značenju je malo (povraćaj novca, "paid" naspram "prepaid", jedna rečenica bez "in Serbian"), a najvidljivija sistemska greška je bila "conjunction/opposition" umesto "conjunct/opposite" u imenima aspekata na priči i natalnoj karti.
