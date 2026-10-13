/**
 * Translation of `sr/ostalo.ts` — the "More" tab (Compatibility, the sky now, Products).
 */
import type { Recnik } from '../sr';

export const ostalo: Recnik['ostalo'] = {
  naslov: 'Astro products',

  uporedni: {
    oznaka: 'Compatibility',
    naslov: 'How well do you match with someone?',
    opis: 'Love, friendship and work. A sign is enough, no birth date needed.',
    ti: (znak) => `You · ${znak}`,
    tiBezZnaka: 'You',
    izaberi: 'Pick a sign',
    dugme: 'Compare signs',
    znakA11y: (znak) => `Your sign: ${znak}`,
  },

  nebo: {
    oznaka: 'The sky right now',
    naslov: 'The sky now',
    opis: 'Planets, houses and aspects at this moment',
  },

  proizvodi: {
    oznaka: 'Shop',
    naslov: 'To buy',
    napomena: 'An arrow on the right means the purchase is completed on astroshop.rs.',
    izlazA11y: 'Opens the astroshop.rs website',
    besplatno: 'Free',
    godisnje: 'per year',
    uskoro: 'Coming soon',
    stavke: {
      widget: { naziv: 'Widget', opis: 'The sky now on your home screen' },
      premium: { naziv: 'Premium', opis: 'Full daily text, natal chart, your people' },
      natalna: { naziv: 'Natal chart reading', opis: 'All planets and aspects, forever' },
      sat: { naziv: 'Zodiac Wheel', opis: 'The sky wheel on your Apple Watch' },
      pitanje: { naziv: 'Astrologer consultation, 1 question', opis: 'The astrologer answers by voice' },
      narukvica: { naziv: 'Astro Bracelet', opis: 'A bracelet made from your planet positions' },
      konsultacije30: { naziv: 'Astrologer consultation, 30 min live', opis: 'A live conversation with an astrologer' },
      konsultacije90: { naziv: 'Astrologer consultation, 90 min live', opis: 'A detailed live conversation' },
    },
  },

  detalj: {
    sajt: 'Open astroshop.rs',
    sajtBelezka: 'Opens the website in your browser.',
    uskoroBelezka: 'This product is not in the store yet.',
    opisi: {
      sat: 'The sky wheel on your wrist, the same as the widget.',
      narukvica: 'A personalised bracelet made from the arrangement of planets in your horoscope.',
      konsultacije30: 'A 30-minute conversation with an astrologer in real time, where you ask direct questions. You pick the time on the website.',
      konsultacije90: 'A detailed 90-minute conversation with an astrologer in real time. You pick the time on the website.',
    },
  },

  uporedniEkran: {
    naslov: 'Compatibility',
    tvojZnak: 'Your sign',
    izaberi: "Pick the other person's sign",
    izabranA11y: (znak) => `Selected: ${znak}`,
    objasnjenje: 'Only the Sun sign is compared, no birth date needed.',
    ocena: {
      povoljno: { naslov: 'Favourable', opis: 'An excellent pair' },
      manje: { naslov: 'Less favourable', opis: 'Good, but the relationship takes work' },
      nepovoljno: { naslov: 'Unfavourable', opis: 'It will be hard' },
    },
    oblasti: { ljubav: 'Love', prijateljstvo: 'Friendship', posao: 'Work' },
    tekstoviNema: 'There are no texts for this pair yet.',
    /** Dok tekstovi nisu prevedeni (`uporedni_texts` ima samo srpski), jedna recenica ispod ocene. */
    naSrpskom: 'The texts are in Serbian.',
    bezTvogZnaka: 'We cannot determine your sign: you were born on the edge of a sign and the time zone is not reliable. Check your birth data in your profile.',
  },
};
