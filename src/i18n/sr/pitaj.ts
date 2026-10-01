/**
 * Pitaj astrologa (CLAUDE.md, pravilo 21): tab "Pitaj", pisanje pitanja, odgovor.
 *
 * Ime astrologa NIJE prevod, ali stoji ovde (`astrolog`) uz padeze koje trazi srpska
 * recenica i zvanje. Recenica sa imenom prima oblik imena koji joj treba kao parametar.
 *
 * Snimak karte za astrologa (`snimakKarte`) NE cita ovaj recnik — panel ostaje srpski.
 */
import { mnozina } from './gramatika';

/** Okviran rok — samo tekst, bez racuna i obecanja (ROKA NEMA, pravilo 21). */
const ROK = 'obično za 2–3 radna dana';
const ROK_KRATKO = '2–3 radna dana';

export const pitaj = {
  /**
   * Astrolog (`ASTROLOG` u `lib/pitanja.ts` su getteri na ovo). Ime i kratko ime NISU prevod —
   * drugi jezik ih ne navodi, pa ostaju ovi; menja samo zvanje i padeze.
   */
  astrolog: {
    ime: 'Boban Vujović',
    kratko: 'Boban',
    zvanje: 'Astrolog',
    /** "Pitanje za Bobana" */
    genitiv: 'Bobana',
    /** "stiže Bobanu" */
    dativ: 'Bobanu',
  },

  /** `lib/pitanja.ts` `natpisStatusa` — stanje u listi "Moja pitanja" i na listu pitanja. */
  status: {
    noviOdgovor: 'Novi odgovor',
    nijePoslato: 'Nije poslato',
    cekaOdgovor: 'Čeka odgovor',
    odgovoreno: 'Odgovoreno',
    novacVracen: 'Novac je vraćen',
  },

  /** `lib/pitanja.ts` `oKome` — pitanje o odnosu u listi; ime se ne sklanja. */
  jaI: (ime: string) => `Ja i ${ime}`,

  /** `lib/pitanja.ts` `porukaGreske` — greska servera ili mreze -> recenica za korisnika. */
  greske: {
    prazno: 'Pitanje je prazno. Napiši šta te zanima.',
    predugo: (max: number) => `Pitanje je duže od ${max} znakova. Skrati ga pa pošalji.`,
    nemaKredita: 'Plaćeno pitanje je već iskorišćeno. Osveži stranu pa probaj ponovo.',
    nemaNacrta: 'Ovo pitanje je već poslato.',
    nemaOsobe: 'Ova osoba više nije na tvojoj listi. Izaberi o kome je pitanje pa pošalji.',
    nemaNaloga: 'Prijava je istekla. Zatvori aplikaciju i otvori je ponovo.',
    mreza: 'Nema veze sa serverom. Pitanje je sačuvano na telefonu — probaj kad se internet vrati.',
    nepoznato: 'Pitanje nije sačuvano. Probaj ponovo za minut.',
  },

  /** `app/(tabs)/ask/index.tsx` — tab "Pitaj". */
  tab: {
    naslov: 'Pitaj astrologa',
    covek: 'Pitaj čoveka',
    ai: 'Pitaj AI',
    uskoro: 'uskoro',
    /** Broj placenih pitanja koja jos nisu napisana (krediti). */
    krediti: (n: number) => (n === 1
      ? 'Imaš jedno plaćeno pitanje.'
      : `Imaš ${n} ${mnozina(n, ['plaćeno pitanje', 'plaćena pitanja', 'plaćenih pitanja'])}.`),
    pitaj: 'Pitaj',
    postavi: 'Postavi pitanje',
    mojaPitanja: 'Moja pitanja',
    /** Nacrt u listi — desno, uz strelicu. */
    zavrsi: 'Završi',
    /** "Ana · Čeka odgovor · 24. sep" — o kome (ili null), stanje, datum. */
    redOpis: (oKome: string | null, status: string, datum: string) =>
      `${oKome ? `${oKome} · ` : ''}${status} · ${datum}`,
    aiOpis: 'Za kraća pitanja, odgovor odmah — sastavljen iz tekstova astrologa koje već čitaš u aplikaciji. Radimo na tome.',
  },

  /** `components/pitaj-uvod.tsx` — uvod: astrolog, naslov, tri reda uslova. */
  uvod: {
    naslov: 'Odgovara pravi astrolog, ne AI',
    opis: (ime: string) => `Napiši šta te zanima, a ${ime} pogleda tvoju natalnu kartu i odgovori ti lično.`,
    glasovno: `Odgovor ti stiže glasovnom porukom u roku od ${ROK_KRATKO}.`,
    nijeSavet: 'Astrološko tumačenje nije medicinski, pravni ni finansijski savet.',
    placanje: 'Jednokratno plaćanje po pitanju',
  },

  /** `app/pitanje-novo.tsx` — pisanje pitanja. */
  novo: {
    /** Posle kupovine koja nije zavrsena. Pitanje je u svakom slucaju sacuvano. */
    posleKupovine: {
      odustao: 'Pitanje je sačuvano. Možeš da ga pošalješ kasnije.',
      ceka: (dativ: string) => `Plaćanje čeka odobrenje. Pitanje stiže ${dativ} čim se potvrdi.`,
      greska: 'Plaćanje nije završeno. Pitanje je sačuvano — pokušaj ponovo.',
      nedostupno: 'Plaćanje u aplikaciji još nije uključeno. Pitanje je sačuvano i čeka ovde.',
    },
    poslatoNaslov: 'Pitanje je poslato.',
    poslatoOpis: (ime: string) => `${ime} odgovara ${ROK}. Odgovor će se pojaviti u „Mojim pitanjima“.`,
    napisi: 'Napiši pitanje',
    bezInterneta: 'Za slanje pitanja potreban je internet.',
    vecPlaceno: 'Ovo pitanje je već plaćeno. Posle slanja ne može da se menja.',
    /** `cena` iz prodavnice, ili null kad se cena ne prikazuje. */
    placanje: (cena: string | null) =>
      `${cena ? `${cena} · jednokratno plaćanje. ` : ''}Posle plaćanja pitanje ne može da se menja.`,
    naslov: (genitiv: string) => `Pitanje za ${genitiv}`,
    vidiTvoju: (ime: string) => `${ime} vidi tvoju kartu, pa ne moraš da pišeš datum ni mesto rođenja.`,
    vidiObe: (ime: string) => `${ime} vidi obe karte, pa ne moraš da pišeš podatke o rođenju.`,
    vidiOsobe: (ime: string) => `${ime} vidi kartu osobe o kojoj pitaš, pa ne moraš da pišeš podatke te osobe.`,
    oKome: 'O kome je pitanje',
    /** Izbor "o sebi" u redu "O kome je pitanje". */
    ja: 'Ja',
    oNamaDvoma: 'Pitanje je o nama dvoma — pošalji i moju kartu',
    primerJa: 'Npr. Razmišljam da promenim posao ove jeseni. Šta moja karta kaže o tom periodu?',
    primerOdnos: 'Npr. Kako da se bolje razumemo kad se ne slažemo?',
    primerOsoba: 'Npr. Na šta da obratim pažnju ove jeseni? Šta kaže karta ove osobe?',
    poljeOpis: 'Tvoje pitanje',
    /** "123 / 500" — broj znakova. */
    brojac: (n: number, max: number) => `${n} / ${max}`,
    posalji: 'Pošalji pitanje',
    naPlacanje: 'Nastavi na plaćanje',
  },

  /** `app/pitanje.tsx` — jedno pitanje i odgovor. */
  pitanje: {
    nijeUcitano: 'Pitanje nije učitano. Proveri internet pa ga otvori ponovo.',
    nePostoji: 'Ovo pitanje više ne postoji.',
    /** "Čeka odgovor · 24. sep" */
    oznaka: (status: string, datum: string) => `${status} · ${datum}`,
    tvojePitanje: 'Tvoje pitanje',
    odgovor: 'Odgovor',
    glasovnaPoruka: 'Glasovna poruka',
    ceka: (ime: string) => `${ime} odgovara ${ROK}. Odgovor će se pojaviti ovde, kao glasovna poruka.`,
    nijePoslato: 'Pitanje još nije poslato.',
    vraceno: (ime: string) => `Novac za ovo pitanje je vraćen, pa ga ${ime} neće dobiti.`,
  },

  /** `components/glasovna-poruka.tsx` — plejer glasovnog odgovora. */
  plejer: {
    pauziraj: 'Pauziraj odgovor',
    pusti: 'Pusti odgovor',
    napredak: 'Napredak odgovora',
    /** Citac ekrana: "0:35 od 1:20". */
    vremeOd: (sada: string, ukupno: string) => `${sada} od ${ukupno}`,
    brzinaNormalna: 'Brzina normalna',
    brzinaPoIPo: 'Brzina jedan i po puta',
    /** Natpis na dugmetu brzine. */
    brzina1: '1x',
    brzina15: '1,5x',
    nijeStigao: 'Snimak nije stigao. Proveri internet pa otvori pitanje ponovo.',
    neMozeDaSePusti: 'Snimak ne može da se pusti. Zatvori pitanje pa ga otvori ponovo.',
  },
};
