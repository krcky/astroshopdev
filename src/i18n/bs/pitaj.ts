import type { Recnik } from '../sr';
import { mnozina } from './gramatika';

/**
 * Prijevod `sr/pitaj.ts` (bosanski) — Pitaj astrologa (CLAUDE.md, pravilo 21).
 *
 * Astrolog odgovara glasom NA SRPSKOM; za bosanski se to ne napominje (razumiju srpski).
 */

/** Okviran rok — samo tekst, bez obećanja (ROKA NEMA, pravilo 21). */
const ROK = 'obično za 2–3 radna dana';
const ROK_KRATKO = '2–3 radna dana';

export const pitaj: Recnik['pitaj'] = {
  /** Ime nije prijevod; padeži su isti kao u srpskom. */
  astrolog: {
    ime: 'Boban Vujović',
    kratko: 'Boban',
    zvanje: 'Astrolog',
    genitiv: 'Bobana',
    dativ: 'Bobanu',
  },

  status: {
    noviOdgovor: 'Novi odgovor',
    nijePoslato: 'Nije poslano',
    cekaOdgovor: 'Čeka odgovor',
    odgovoreno: 'Odgovoreno',
    novacVracen: 'Novac je vraćen',
  },

  jaI: (ime) => `Ja i ${ime}`,

  greske: {
    prazno: 'Pitanje je prazno. Napiši šta te zanima.',
    predugo: (max) => `Pitanje je duže od ${max} znakova. Skrati ga pa pošalji.`,
    nemaKredita: 'Plaćeno pitanje je već iskorišteno, na primjer sa drugog telefona. Ovo pitanje možeš platiti.',
    nemaNacrta: 'Ovo pitanje je već poslano.',
    nemaOsobe: 'Ova osoba više nije na tvojoj listi. Izaberi o kome je pitanje pa pošalji.',
    nemaNaloga: 'Prijava je istekla. Zatvori aplikaciju i otvori je ponovo.',
    mreza: 'Nema veze sa serverom. Pitanje je sačuvano na telefonu — probaj kad se internet vrati.',
    nepoznato: 'Pitanje nije sačuvano. Probaj ponovo za minut.',
  },

  tab: {
    naslov: 'Pitaj astrologa',
    covek: 'Pitaj čovjeka',
    ai: 'Pitaj AI',
    uskoro: 'uskoro',
    krediti: (n) => (n === 1
      ? 'Imaš jedno plaćeno pitanje.'
      : `Imaš ${n} ${mnozina(n, ['plaćeno pitanje', 'plaćena pitanja', 'plaćenih pitanja'])}.`),
    pitaj: 'Pitaj',
    /** Iznad "Postavi pitanje" kad vec ima pitanja (Ivan, 1.10.2026). */
    josJednoNaslov: 'Imaš novo pitanje?',
    josJedno: (ime: string) => `Na pitanja odgovara astrolog ${ime}.`,
    postavi: 'Postavi pitanje',
    mojaPitanja: 'Moja pitanja',
    zavrsi: 'Završi',
    redOpis: (oKome, status, datum) =>
      `${oKome ? `${oKome} · ` : ''}${status} · ${datum}`,
    aiOpis: 'Za kraća pitanja, odgovor odmah — sastavljen iz tekstova astrologa koje već čitaš u aplikaciji. Radimo na tome.',
  },

  uvod: {
    naslov: 'Odgovara pravi astrolog, ne AI',
    opis: (ime) => `Napiši šta te zanima, a ${ime} pogleda tvoju natalnu kartu i odgovori ti lično.`,
    glasovno: `Odgovor ti stiže glasovnom porukom u roku od ${ROK_KRATKO}.`,
    nijeSavet: 'Astrološko tumačenje nije medicinski, pravni ni finansijski savjet.',
    placanje: 'Jednokratno plaćanje po pitanju',
  },

  novo: {
    posleKupovine: {
      odustao: 'Pitanje je sačuvano. Možeš ga poslati kasnije.',
      ceka: (dativ) => `Plaćanje čeka odobrenje. Pitanje stiže ${dativ} čim se potvrdi.`,
      greska: 'Plaćanje nije završeno. Pitanje je sačuvano — pokušaj ponovo.',
      nedostupno: 'Plaćanje u aplikaciji još nije uključeno. Pitanje je sačuvano i čeka ovdje.',
    },
    poslatoNaslov: 'Pitanje je poslano.',
    poslatoOpis: (ime) => `${ime} odgovara ${ROK}. Odgovor će se pojaviti u „Mojim pitanjima“.`,
    napisi: 'Napiši pitanje',
    bezInterneta: 'Za slanje pitanja potreban je internet.',
    vecPlaceno: 'Ovo pitanje je već plaćeno. Poslije slanja ne može se mijenjati.',
    placanje: (cena) =>
      `${cena ? `${cena} · jednokratno plaćanje. ` : ''}Poslije plaćanja pitanje se ne može mijenjati.`,
    naslov: (genitiv) => `Pitanje za ${genitiv}`,
    vidiTvoju: (ime) => `${ime} vidi tvoju kartu, pa ne moraš pisati datum ni mjesto rođenja.`,
    vidiObe: (ime) => `${ime} vidi obje karte, pa ne moraš pisati podatke o rođenju.`,
    vidiOsobe: (ime) => `${ime} vidi kartu osobe o kojoj pitaš, pa ne moraš pisati podatke te osobe.`,
    oKome: 'O kome je pitanje',
    ja: 'Ja',
    oNamaDvoma: 'Pitanje je o nama dvoma — pošalji i moju kartu',
    primerJa: 'Npr. Razmišljam da promijenim posao ove jeseni. Šta moja karta kaže o tom periodu?',
    primerOdnos: 'Npr. Kako da se bolje razumijemo kad se ne slažemo?',
    primerOsoba: 'Npr. Na šta da obratim pažnju ove jeseni? Šta kaže karta ove osobe?',
    poljeOpis: 'Tvoje pitanje',
    brojac: (n, max) => `${n} / ${max}`,
    posalji: 'Pošalji pitanje',
    naPlacanje: 'Nastavi na plaćanje',
  },

  pitanje: {
    nijeUcitano: 'Pitanje nije učitano. Provjeri internet pa ga otvori ponovo.',
    nePostoji: 'Ovo pitanje više ne postoji.',
    oznaka: (status, datum) => `${status} · ${datum}`,
    tvojePitanje: 'Tvoje pitanje',
    odgovor: 'Odgovor',
    glasovnaPoruka: 'Glasovna poruka',
    ceka: (ime) => `${ime} odgovara ${ROK}. Odgovor će se pojaviti ovdje, kao glasovna poruka.`,
    nijePoslato: 'Pitanje još nije poslano.',
    vraceno: (ime) => `Novac za ovo pitanje je vraćen, pa ga ${ime} neće dobiti.`,
  },

  plejer: {
    pauziraj: 'Pauziraj odgovor',
    pusti: 'Pusti odgovor',
    napredak: 'Napredak odgovora',
    vremeOd: (sada, ukupno) => `${sada} od ${ukupno}`,
    brzinaNormalna: 'Normalna brzina',
    brzinaPoIPo: 'Brzina jedan i po puta',
    brzina1: '1x',
    brzina15: '1,5x',
    nijeStigao: 'Snimak nije stigao. Provjeri internet pa otvori pitanje ponovo.',
    neMozeDaSePusti: 'Snimak se ne može pustiti. Zatvori pitanje pa ga otvori ponovo.',
  },
};
