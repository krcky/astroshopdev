/**
 * TEME I GOTOVA PITANJA za "Pitaj astrologa" — PREDLOG, ceka astrologa (Ivan, 13.10.2026).
 *
 * Usmeravaju korisnika sta moze da pita: dok je polje prazno, ispod njega su teme i tri pitanja;
 * dodir pitanje UPISE u polje (ne salje), a korisnik ga prepravi u svoje. Polje ostaje slobodno.
 * Tu je i lista na sta astrolog ne odgovara (`app/pitanje-pravila.tsx`) i poruka za prekratko pitanje.
 *
 * SAMO SRPSKI, namerno van `Recnik` tipa (Ivan: "nemoj opet pet jezika"), kao `krug-recenice.ts`:
 * na drugim jezicima se nista od ovoga ne prikazuje (`imaTemePitanja` u `lib/pitanja.ts`) i ekran
 * je kakav je bio. Kad Boban potvrdi tekstove, prevod ide u recnike.
 *
 * PRAVILA ZA NOVA PITANJA: situacija u prvoj recenici, pa sta korisnika zanima; bez "kada cu" i
 * "da li ce" koji obecavaju ishod; BEZ teme Zdravlje (astrolog ne odgovara, App Store 1.4.1).
 * Rod je mesan — pol se ne pita. Pitanja o drugoj osobi i o odnosu su bez roda i bez vrste odnosa
 * (osoba moze biti partner, dete, prijatelj).
 */
export const pitajTeme = {
  /** Oznaka (verzal) iznad tema i pitanja. */
  naslov: 'Primeri pitanja',
  /** Red ispod polja kad polje VEC IMA tekst (npr. sacuvan nacrt): otvara i zatvara teme i pitanja. */
  otvori: 'Teme i primeri pitanja',
  sakrij: 'Sakrij primere',
  /** Dodir na gotovo pitanje dok u polju vec nesto pise — pita pre nego sto zameni. */
  zameni: {
    naslov: 'Zameniti ono što piše u polju?',
    opis: 'Tekst koji si napisao biće obrisan.',
    da: 'Zameni',
  },
  /** Citac ekrana: sta radi dodir na gotovo pitanje. */
  upisiOpis: 'Upisuje pitanje u polje. Možeš da ga izmeniš.',

  /** Polje dok su predlozi ispod njega — kratko, primeri su vec na ekranu. */
  polje: {
    ja: 'Napiši šta ti se dešava i šta te zanima.',
    osoba: 'Napiši šta se dešava i šta te zanima.',
    odnos: 'Napiši šta se dešava između vas i šta te zanima.',
  },

  /** Teme redom kojim se nude. Kljuc je samo za kod. */
  teme: [
    {
      key: 'ljubav', naziv: 'Ljubav', pitanja: [
        'Godinu dana sam sama posle duge veze. Šta moja karta kaže o tome kakav odnos mi sada treba?',
        'Stalno biram slične partnere i završi se isto. Šta u mojoj karti stoji iza toga?',
        'U vezi smo tri godine i sve češće se svađamo oko istih stvari. Odakle to dolazi kod mene?',
      ],
    },
    {
      key: 'posao', naziv: 'Posao', pitanja: [
        'Razmišljam da promenim posao ove jeseni. Šta moja karta kaže o tom periodu?',
        'Deset godina radim isti posao i više me ne ispunjava. U kom pravcu su moje jače strane?',
        'Hoću da pokrenem nešto svoje uz stalni posao. Da li je naredna godina dobar trenutak da krenem?',
      ],
    },
    {
      key: 'novac', naziv: 'Novac', pitanja: [
        'Dobro zarađujem, a ništa mi ne ostaje. Kakav je moj odnos prema novcu po karti?',
        'Planiram veću kupovinu u narednih pola godine. Koji deo tog perioda mi više ide na ruku?',
        'Teško mi je da tražim veću platu. Šta u karti govori o tome kako vrednujem svoj rad?',
      ],
    },
    {
      key: 'porodica', naziv: 'Porodica', pitanja: [
        'Sa majkom se teško razumem otkad sam se odselila. Šta moja karta kaže o tom odnosu?',
        'Brinem o roditeljima i nemam vremena za sebe. Kako da nađem meru u ovom periodu?',
        'Sa bratom ne pričam već godinu dana. Šta u mojoj karti stoji iza tog odnosa?',
      ],
    },
    {
      key: 'odluka', naziv: 'Važna odluka', pitanja: [
        'Biram između ostanka u Beogradu i selidbe u inostranstvo. Šta moja karta kaže o svakom od ta dva puta?',
        'Odlažem jednu odluku već mesecima. Šta me po karti koči i kada mi bude lakše da presečem?',
        'Hoću da upišem master sledeće godine. Da li je to dobar period za učenje i nov početak?',
      ],
    },
    {
      key: 'period', naziv: 'Ovaj period', pitanja: [
        'Poslednjih meseci mi sve ide teže nego inače. Šta se trenutno dešava u mojoj karti i dokle traje?',
        'Ove godine punim 30 i osećam da se sve menja. Šta mi ovaj period donosi?',
        'Osećam da mi se otvara nešto novo, a ne znam šta. Na šta da usmerim pažnju do kraja godine?',
      ],
    },
    {
      key: 'ja', naziv: 'Ja', pitanja: [
        'Brzo planem pa se kajem. Odakle to dolazi u mojoj karti i kako da radim na tome?',
        'U čemu sam po karti najjači, a to ne koristim dovoljno?',
        'Teško se opuštam i stalno mislim da moram više. Šta moja karta kaže o tome?',
      ],
    },
  ],

  /** Bez izabrane teme: po jedno iz tri teme (posao, ljubav, period). */
  mesano: [
    'Razmišljam da promenim posao ove jeseni. Šta moja karta kaže o tom periodu?',
    'Stalno biram slične partnere i završi se isto. Šta u mojoj karti stoji iza toga?',
    'Poslednjih meseci mi sve ide teže nego inače. Šta se trenutno dešava u mojoj karti i dokle traje?',
  ],

  /** Pitanje o drugoj osobi. "Osoba" je zenskog roda, pa recenica ne zavisi od pola. */
  oOsobi: [
    'Kako da budem podrška ovoj osobi u periodu kroz koji prolazi?',
    'Šta se trenutno dešava u karti ove osobe i dokle traje?',
    'U čemu je ova osoba po karti najjača i kako da je u tome podržim?',
  ],

  /** Pitanje "o nama dvoma". */
  oOdnosu: [
    'Kako da se bolje razumemo kad se ne slažemo?',
    'Jedno od nas hoće sve da isplanira, drugo voli da pusti. Gde se naše karte dopunjuju, a gde sudaraju?',
    'Često se sporečkamo oko istih stvari. Odakle to dolazi u našim kartama?',
  ],

  /** List "Na šta astrolog ne odgovara" — red na ekranu za pisanje i sam list. */
  pravila: {
    naslov: (ime: string) => `Na šta ${ime} ne odgovara`,
    stavke: [
      { naslov: 'Smrt, bolest i dijagnoze', opis: 'Za zdravlje je lekar.' },
      { naslov: 'Brojevi za loto, klađenje i ulaganja', opis: null },
      {
        naslov: 'Šta druga osoba misli, krije ili radi iza tvojih leđa',
        opis: (ime: string) => `${ime} može da ti kaže kako se vas dvoje slažete i šta ti u tom odnosu treba.`,
      },
      { naslov: 'Pravne stvari: sporovi, ugovori, starateljstvo', opis: null },
      { naslov: '„Da ili ne“ bez priče', opis: 'Napiši šta se dešava i dobićeš odgovor koji nešto znači.' },
    ] as { naslov: string; opis: string | null | ((ime: string) => string) }[],
    zakljucak: 'Najbolje pitanje ima jednu temu, tvoju situaciju u rečenici ili dve i ono što te zaista zanima.',
  },

  /** Pitanje krace od `PITANJE_KRATKO` znakova — jednom, pred placanje. Ne blokira. */
  kratko: {
    poruka: 'Kratko je. Dodaj rečenicu o svojoj situaciji i odgovor će biti konkretniji.',
    dopuni: 'Dopuni',
    posalji: 'Pošalji ovako',
  },
};
