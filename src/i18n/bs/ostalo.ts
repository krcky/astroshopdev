/**
 * Prijevod `sr/ostalo.ts` (bosanski) — tab "Ostalo" (Uporedni horoskop, nebo sada, Proizvodi).
 * Ijekavica; "prodavnica" i "kupovina" kao u ostatku rječnika.
 */
import type { Recnik } from '../sr';

export const ostalo: Recnik['ostalo'] = {
  naslov: 'Astro proizvodi',

  uporedni: {
    oznaka: 'Uporedni horoskop',
    naslov: 'Koliko se slažeš sa nekim?',
    opis: 'Ljubav, prijateljstvo i posao. Dovoljan je znak, datum rođenja ne treba.',
    ti: (znak) => `Ti · ${znak}`,
    tiBezZnaka: 'Ti',
    izaberi: 'Odaberi znak',
    dugme: 'Uporedi znakove',
    znakA11y: (znak) => `Tvoj znak: ${znak}`,
  },

  nebo: {
    oznaka: 'Trenutno na nebu',
    naslov: 'Nebo sada',
    opis: 'Planete, kuće i aspekti u ovom trenutku',
  },

  proizvodi: {
    oznaka: 'Prodavnica',
    naslov: 'Za kupovinu',
    napomena: 'Strelica sa desne strane znači da se kupovina završava na astroshop.rs.',
    izlazA11y: 'Otvara web stranicu astroshop.rs',
    besplatno: 'Besplatno',
    godisnje: 'godišnje',
    uskoro: 'Stiže uskoro',
    stavke: {
      widget: { naziv: 'Widget', opis: 'Nebo sada na početnom ekranu' },
      premium: { naziv: 'Premium', opis: 'Cijeli tekst dana, natalna karta, tvoji ljudi' },
      natalna: { naziv: 'Tumačenje natalne karte', opis: 'Sve planete i aspekti, zauvijek' },
      sat: { naziv: 'Zodiac Wheel', opis: 'Krug neba na tvom Apple Watchu' },
      pitanje: { naziv: 'Astrološke konsultacije, 1 pitanje', opis: 'Odgovor astrologa glasom' },
      narukvica: { naziv: 'Astro Bracelet', opis: 'Narukvica po rasporedu planeta' },
      konsultacije30: { naziv: 'Astrološke konsultacije, 30 min uživo', opis: 'Razgovor sa astrologom uživo' },
      konsultacije90: { naziv: 'Astrološke konsultacije, 90 min uživo', opis: 'Detaljan razgovor uživo' },
    },
  },

  detalj: {
    sajt: 'Otvori astroshop.rs',
    sajtBelezka: 'Otvara se web stranica u pregledniku.',
    uskoroBelezka: 'Ovaj proizvod još nije u prodavnici.',
    opisi: {
      sat: 'Krug neba na zapešću, isti kao widget.',
      narukvica: 'Personalizovana narukvica urađena po rasporedu planeta u tvom horoskopu.',
      konsultacije30: 'Razgovor od 30 minuta sa astrologom u stvarnom vremenu, u kojem postavljaš direktna pitanja. Termin biraš na web stranici.',
      konsultacije90: 'Detaljan razgovor od 90 minuta sa astrologom u stvarnom vremenu. Termin biraš na web stranici.',
    },
  },

  uporedniEkran: {
    naslov: 'Uporedni horoskop',
    tvojZnak: 'Tvoj znak',
    izaberi: 'Odaberi znak druge osobe',
    izabranA11y: (znak) => `Odabrano: ${znak}`,
    objasnjenje: 'Poredi se samo znak Sunca, datum rođenja ne treba.',
    ocena: {
      povoljno: { naslov: 'Povoljno', opis: 'Odličan par' },
      manje: { naslov: 'Manje povoljno', opis: 'Dobro, ali treba raditi na vezi' },
      nepovoljno: { naslov: 'Nepovoljno', opis: 'Bit će teško' },
    },
    oblasti: { ljubav: 'Ljubav', prijateljstvo: 'Prijateljstvo', posao: 'Posao' },
    tekstoviNema: 'Za ovaj par još nema tekstova.',
    /** Dok tekstovi nisu prevedeni (`uporedni_texts` ima samo srpski), jedna recenica ispod ocene. */
    naSrpskom: 'Tekstovi su na srpskom.',
    bezTvogZnaka: 'Ne možemo odrediti tvoj znak: rođenje je na granici znaka, a vrijeme zone nije pouzdano. Provjeri podatke o rođenju na profilu.',
  },
};
