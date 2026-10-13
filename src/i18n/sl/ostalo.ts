/**
 * Prevod `sr/ostalo.ts` (slovenski) — zavihek "Drugo" (Primerjava horoskopov, nebo zdaj, Izdelki).
 */
import type { Recnik } from '../sr';

export const ostalo: Recnik['ostalo'] = {
  naslov: 'Astro izdelki',

  uporedni: {
    oznaka: 'Primerjava horoskopov',
    naslov: 'Kako se ujemaš z nekom?',
    opis: 'Ljubezen, prijateljstvo in služba. Dovolj je znamenje, datum rojstva ni potreben.',
    ti: (znak) => `Ti · ${znak}`,
    tiBezZnaka: 'Ti',
    izaberi: 'Izberi znamenje',
    dugme: 'Primerjaj znamenja',
    znakA11y: (znak) => `Tvoje znamenje: ${znak}`,
  },

  nebo: {
    oznaka: 'Trenutno na nebu',
    naslov: 'Nebo zdaj',
    opis: 'Planeti, hiše in aspekti v tem trenutku',
  },

  proizvodi: {
    oznaka: 'Trgovina',
    naslov: 'Za nakup',
    napomena: 'Puščica na desni pomeni, da se nakup konča na astroshop.rs.',
    izlazA11y: 'Odpre spletno stran astroshop.rs',
    besplatno: 'Brezplačno',
    godisnje: 'letno',
    uskoro: 'Kmalu',
    stavke: {
      widget: { naziv: 'Pripomoček', opis: 'Nebo zdaj na začetnem zaslonu' },
      premium: { naziv: 'Premium', opis: 'Celotno besedilo dneva, natalna karta, tvoji ljudje' },
      natalna: { naziv: 'Razlaga natalne karte', opis: 'Vsi planeti in aspekti, za vedno' },
      sat: { naziv: 'Zodiac Wheel', opis: 'Krog neba na tvojem Apple Watchu' },
      pitanje: { naziv: 'Astrološko svetovanje, 1 vprašanje', opis: 'Odgovor astrologa z glasom' },
      narukvica: { naziv: 'Astro Bracelet', opis: 'Zapestnica po razporedu planetov' },
      konsultacije30: { naziv: 'Astrološko svetovanje, 30 min v živo', opis: 'Pogovor z astrologom v živo' },
      konsultacije90: { naziv: 'Astrološko svetovanje, 90 min v živo', opis: 'Podroben pogovor v živo' },
    },
  },

  detalj: {
    sajt: 'Odpri astroshop.rs',
    sajtBelezka: 'Spletna stran se odpre v brskalniku.',
    uskoroBelezka: 'Ta izdelek še ni v trgovini.',
    opisi: {
      sat: 'Krog neba na zapestju, enak kot pripomoček.',
      narukvica: 'Personalizirana zapestnica, narejena po razporedu planetov v tvojem horoskopu.',
      konsultacije30: 'Pogovor z astrologom v realnem času, dolg 30 minut, v katerem postavljaš neposredna vprašanja. Termin izbereš na spletni strani.',
      konsultacije90: 'Podroben 90-minutni pogovor z astrologom v realnem času. Termin izbereš na spletni strani.',
    },
  },

  uporedniEkran: {
    naslov: 'Primerjava horoskopov',
    tvojZnak: 'Tvoje znamenje',
    izaberi: 'Izberi znamenje druge osebe',
    izabranA11y: (znak) => `Izbrano: ${znak}`,
    objasnjenje: 'Primerja se samo sončno znamenje, datum rojstva ni potreben.',
    ocena: {
      povoljno: { naslov: 'Ugodno', opis: 'Odličen par' },
      manje: { naslov: 'Manj ugodno', opis: 'Dobro, a na zvezi je treba delati' },
      nepovoljno: { naslov: 'Neugodno', opis: 'Bo težko' },
    },
    oblasti: { ljubav: 'Ljubezen', prijateljstvo: 'Prijateljstvo', posao: 'Delo' },
    tekstoviNema: 'Za ta par še ni besedil.',
    /** Dok tekstovi nisu prevedeni (`uporedni_texts` ima samo srpski), jedna recenica ispod ocene. */
    naSrpskom: 'Besedila so v srbščini.',
    bezTvogZnaka: 'Tvojega znamenja ne moremo določiti: rojstvo je na meji znamenja, časovni pas pa ni zanesljiv. Preveri podatke o rojstvu v profilu.',
  },
};
