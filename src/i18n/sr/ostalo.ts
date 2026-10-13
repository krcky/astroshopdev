/**
 * Tab "Ostalo" (Ivan, 14.10.2026): `app/(tabs)/ostalo/index.tsx`, `app/uporedni.tsx`, `app/proizvod.tsx`.
 * Uporedni horoskop, Nebo (`app/nebo.tsx`) i "Proizvodi" — ista lista za ono sto se kupuje u aplikaciji i ono sto
 * vodi na sajt (`lib/proizvodi.ts`). Cene NISU ovde: u aplikaciji dolaze iz prodavnice, a sa sajta su u katalogu.
 */
export const ostalo = {
  /** Natpis taba ima `danas.tabovi.ostalo`; ovo je naslov strane. */
  naslov: 'Ostalo',

  /** Velika kartica "Uporedni horoskop" na vrhu taba. */
  uporedni: {
    oznaka: 'Uporedni horoskop',
    naslov: 'Koliko se slažeš sa nekim?',
    opis: 'Ljubav, prijateljstvo i posao. Dovoljan je znak, datum rođenja ne treba.',
    ti: (znak: string) => `Ti · ${znak}`,
    tiBezZnaka: 'Ti',
    izaberi: 'Izaberi znak',
    dugme: 'Uporedi znakove',
    znakA11y: (znak: string) => `Tvoj znak: ${znak}`,
  },

  /** Kartica koja vodi na ekran "Trenutno na nebu" (`app/nebo.tsx`, do 14.10.2026 tab "Nebo"). */
  nebo: {
    oznaka: 'Trenutno na nebu',
    naslov: 'Nebo sada',
    opis: 'Planete, kuće i aspekti u ovom trenutku',
  },

  /** Lista "Proizvodi". */
  proizvodi: {
    oznaka: 'Prodavnica',
    naslov: 'Proizvodi',
    napomena: 'Strelica sa desne strane znači da se kupovina završava na astroshop.rs.',
    /** Dodaje se uz ime za citac ekrana kad red vodi na sajt. */
    izlazA11y: 'Otvara sajt astroshop.rs',
    besplatno: 'Besplatno',
    godisnje: 'godišnje',
    uskoro: 'Stiže uskoro',
    stavke: {
      widget: { naziv: 'Widget', opis: 'Nebo sada na početnom ekranu' },
      premium: { naziv: 'Premium', opis: 'Ceo tekst dana, natalna karta, tvoji ljudi' },
      natalna: { naziv: 'Tumačenje natalne karte', opis: 'Sve planete i aspekti, zauvek' },
      sat: { naziv: 'Zodiac Wheel', opis: 'Krug neba na tvom Apple Watch-u' },
      pitanje: { naziv: 'Astrološke konsultacije, 1 pitanje', opis: 'Odgovor astrologa glasom' },
      narukvica: { naziv: 'Astro Bracelet', opis: 'Narukvica po rasporedu planeta' },
      konsultacije30: { naziv: 'Astrološke konsultacije, 30 min uživo', opis: 'Razgovor sa astrologom uživo' },
      konsultacije90: { naziv: 'Astrološke konsultacije, 90 min uživo', opis: 'Detaljan razgovor uživo' },
    },
  },

  /** `app/proizvod.tsx` — list sa jednim proizvodom (sajt i sat; ostalo vodi pravo u svoj tok). */
  detalj: {
    sajt: 'Otvori astroshop.rs',
    sajtBelezka: 'Otvara se sajt u pregledaču.',
    uskoroBelezka: 'Ovaj proizvod još nije u prodavnici.',
    opisi: {
      sat: 'Krug neba na zglobu, isti kao widget.',
      narukvica: 'Personalizovana narukvica urađena po rasporedu planeta u tvom horoskopu.',
      konsultacije30: 'Razgovor od 30 minuta sa astrologom u realnom vremenu, gde postavljaš direktna pitanja. Termin biraš na sajtu.',
      konsultacije90: 'Detaljan razgovor od 90 minuta sa astrologom u realnom vremenu. Termin biraš na sajtu.',
    },
  },

  /** `app/uporedni.tsx` — izbor znaka druge osobe i ocena para. */
  uporedniEkran: {
    naslov: 'Uporedni horoskop',
    tvojZnak: 'Tvoj znak',
    izaberi: 'Izaberi znak druge osobe',
    izabranA11y: (znak: string) => `Izabrano: ${znak}`,
    objasnjenje: 'Poredi se samo znak Sunca, datum rođenja ne treba.',
    ocena: {
      povoljno: { naslov: 'Povoljno', opis: 'Odličan par' },
      manje: { naslov: 'Manje povoljno', opis: 'Dobro, ali treba raditi na vezi' },
      nepovoljno: { naslov: 'Nepovoljno', opis: 'Biće teško' },
    },
    oblasti: { ljubav: 'Ljubav', prijateljstvo: 'Prijateljstvo', posao: 'Posao' },
    tekstoviNema: 'Za ovaj par još nema tekstova.',
    /** Dok tekstovi nisu prevedeni (`uporedni_texts` ima samo srpski), jedna recenica ispod ocene. */
    naSrpskom: 'Tekstovi su na srpskom.',
    bezTvogZnaka: 'Ne možemo da odredimo tvoj znak: rođenje je na granici znaka, a vreme zone nije pouzdano. Proveri podatke o rođenju na profilu.',
  },
};
