/**
 * Prijevod `sr/ostalo.ts` (hrvatski) — tab "Ostalo" (Usporedni horoskop, nebo sada, Proizvodi).
 * Ijekavica; "trgovina" i "kupnja" kao u ostatku rječnika.
 */
import type { Recnik } from '../sr';

export const ostalo: Recnik['ostalo'] = {
  naslov: 'Ostalo',

  uporedni: {
    oznaka: 'Usporedni horoskop',
    naslov: 'Koliko se slažeš s nekim?',
    opis: 'Ljubav, prijateljstvo i posao. Dovoljan je znak, datum rođenja ne treba.',
    ti: (znak) => `Ti · ${znak}`,
    tiBezZnaka: 'Ti',
    izaberi: 'Odaberi znak',
    dugme: 'Usporedi znakove',
    znakA11y: (znak) => `Tvoj znak: ${znak}`,
  },

  nebo: {
    oznaka: 'Trenutno na nebu',
    naslov: 'Nebo sada',
    opis: 'Planeti, kuće i aspekti u ovom trenutku',
  },

  proizvodi: {
    oznaka: 'Trgovina',
    naslov: 'Proizvodi',
    napomena: 'Strelica s desne strane znači da se kupnja završava na astroshop.rs.',
    izlazA11y: 'Otvara web stranicu astroshop.rs',
    besplatno: 'Besplatno',
    godisnje: 'godišnje',
    uskoro: 'Stiže uskoro',
    stavke: {
      widget: { naziv: 'Widget', opis: 'Nebo sada na početnom zaslonu' },
      premium: { naziv: 'Premium', opis: 'Cijeli tekst dana, natalna karta, tvoji ljudi' },
      natalna: { naziv: 'Tumačenje natalne karte', opis: 'Svi planeti i aspekti, zauvijek' },
      sat: { naziv: 'Zodiac Wheel', opis: 'Krug neba na tvom Apple Watchu' },
      pitanje: { naziv: 'Astrološke konzultacije, 1 pitanje', opis: 'Odgovor astrologa glasom' },
      narukvica: { naziv: 'Astro Bracelet', opis: 'Narukvica prema rasporedu planeta' },
      konsultacije30: { naziv: 'Astrološke konzultacije, 30 min uživo', opis: 'Razgovor s astrologom uživo' },
      konsultacije90: { naziv: 'Astrološke konzultacije, 90 min uživo', opis: 'Detaljan razgovor uživo' },
    },
  },

  detalj: {
    sajt: 'Otvori astroshop.rs',
    sajtBelezka: 'Otvara se web stranica u pregledniku.',
    uskoroBelezka: 'Ovaj proizvod još nije u trgovini.',
    opisi: {
      sat: 'Krug neba na zapešću, isti kao widget.',
      narukvica: 'Personalizirana narukvica izrađena prema rasporedu planeta u tvom horoskopu.',
      konsultacije30: 'Razgovor od 30 minuta s astrologom u stvarnom vremenu, u kojem postavljaš izravna pitanja. Termin biraš na web stranici.',
      konsultacije90: 'Detaljan razgovor od 90 minuta s astrologom u stvarnom vremenu. Termin biraš na web stranici.',
    },
  },

  uporedniEkran: {
    naslov: 'Usporedni horoskop',
    tvojZnak: 'Tvoj znak',
    izaberi: 'Odaberi znak druge osobe',
    izabranA11y: (znak) => `Odabrano: ${znak}`,
    objasnjenje: 'Uspoređuje se samo znak Sunca, datum rođenja ne treba.',
    ocena: {
      povoljno: { naslov: 'Povoljno', opis: 'Odličan par' },
      manje: { naslov: 'Manje povoljno', opis: 'Dobro, ali treba raditi na vezi' },
      nepovoljno: { naslov: 'Nepovoljno', opis: 'Bit će teško' },
    },
    tekstoviNema: 'Tekstovi o ljubavi, prijateljstvu i poslu za ovaj par još nisu u aplikaciji.',
    bezTvogZnaka: 'Ne možemo odrediti tvoj znak: rođenje je na granici znaka, a vrijeme zone nije pouzdano. Provjeri podatke o rođenju na profilu.',
  },
};
