import type { Recnik } from '../sr';
import { mnozina } from './gramatika';

/**
 * Translation of `sr/pitaj.ts` — Ask an astrologer (CLAUDE.md, rule 21).
 *
 * The astrologer answers BY VOICE, IN SERBIAN. Never promise an English answer: the intro
 * (`uvod.glasovno`) and the waiting text (`pitanje.ceka`) say so.
 */

/** Rough timeframe — text only, no deadline and no promise (there is NO deadline, rule 21). */
const ROK_KRATKO = '2–3 business days';

export const pitaj: Recnik['pitaj'] = {
  /** The name is not translated; Serbian case forms all become plain "Boban". */
  astrolog: {
    ime: 'Boban Vujović',
    kratko: 'Boban',
    zvanje: 'Astrologer',
    genitiv: 'Boban',
    dativ: 'Boban',
  },

  /** Status in "My questions" and on the question sheet. */
  status: {
    noviOdgovor: 'New answer',
    nijePoslato: 'Not sent',
    cekaOdgovor: 'Awaiting answer',
    odgovoreno: 'Answered',
    novacVracen: 'Refunded',
  },

  /** A question about a relationship, in the list. */
  jaI: (ime) => `Me and ${ime}`,

  /** Server or network error -> sentence for the user. */
  greske: {
    prazno: 'Your question is empty. Write what you want to know.',
    predugo: (max) => `Your question is longer than ${max} characters. Shorten it, then send.`,
    nemaKredita: 'Your prepaid question has already been used, for example on another phone. You can pay for this one.',
    nemaNacrta: 'This question has already been sent.',
    nemaOsobe: 'This person is no longer on your list. Choose who the question is about, then send.',
    nemaNaloga: 'Your sign-in has expired. Close the app and open it again.',
    mreza: 'Can’t reach the server. Your question is saved on your phone — try again when you’re back online.',
    nepoznato: 'Your question wasn’t saved. Try again in a minute.',
  },

  /** The "Ask" tab. */
  tab: {
    naslov: 'Ask an astrologer',
    covek: 'Ask a human',
    ai: 'Ask AI',
    uskoro: 'soon',
    /** Paid questions not yet written (credits). */
    krediti: (n) => (n === 1
      ? 'You have one prepaid question.'
      : `You have ${n} ${mnozina(n, 'prepaid question', 'prepaid questions')}.`),
    pitaj: 'Ask',
    /** Above "Ask a question" once there are questions. */
    josJednoNaslov: 'Have a new question?',
    josJedno: (ime: string) => `Astrologer ${ime} answers by voice message, in Serbian.`,
    postavi: 'Ask a question',
    mojaPitanja: 'My questions',
    /** Draft in the list — right side, next to the arrow. */
    zavrsi: 'Finish',
    /** "Ana · Awaiting answer · Sep 24" — about whom (or null), status, date. */
    redOpis: (oKome, status, datum) =>
      `${oKome ? `${oKome} · ` : ''}${status} · ${datum}`,
    aiOpis: 'For shorter questions, an answer right away — built from the astrologer’s readings you already see in the app. We’re working on it.',
  },

  /** Intro: astrologer, title, three lines of conditions. */
  uvod: {
    naslov: 'A real astrologer answers, not AI',
    opis: (ime) => `Write what you want to know, and ${ime} looks at your birth chart and answers you personally.`,
    /** Must say the answer is in Serbian. */
    glasovno: `You get the answer as a voice message, in Serbian, within ${ROK_KRATKO}.`,
    nijeSavet: 'An astrological reading is not medical, legal or financial advice.',
    placanje: 'One-time payment per question',
  },

  /** Writing a question. */
  novo: {
    /** After a purchase that didn’t finish. The question is saved either way. */
    posleKupovine: {
      odustao: 'Your question is saved. You can send it later.',
      ceka: (dativ) => `Payment is awaiting approval. Your question goes to ${dativ} as soon as it’s confirmed.`,
      greska: 'Payment didn’t go through. Your question is saved — try again.',
      nedostupno: 'In-app payment isn’t turned on yet. Your question is saved and waiting here.',
    },
    poslatoNaslov: 'Your question has been sent.',
    poslatoOpis: (ime) => `${ime} usually answers within ${ROK_KRATKO}. The answer will show up in “My questions”.`,
    napisi: 'Write a question',
    bezInterneta: 'You need an internet connection to send a question.',
    vecPlaceno: 'This question is already paid for. Once sent, it can’t be changed.',
    /** `cena` from the store, or null when no price is shown. */
    placanje: (cena) =>
      `${cena ? `${cena} · one-time payment. ` : ''}Once paid, the question can’t be changed.`,
    naslov: (genitiv) => `A question for ${genitiv}`,
    vidiTvoju: (ime) => `${ime} sees your chart, so you don’t need to write your birth date or place.`,
    vidiObe: (ime) => `${ime} sees both charts, so you don’t need to write any birth details.`,
    vidiOsobe: (ime) => `${ime} sees the chart of the person you’re asking about, so you don’t need to write their details.`,
    oKome: 'Who is the question about',
    /** The "about me" choice. */
    ja: 'Me',
    oNamaDvoma: 'The question is about the two of us — send my chart too',
    primerJa: 'E.g. I’m thinking of changing jobs this fall. What does my chart say about that period?',
    primerOdnos: 'E.g. How can we understand each other better when we disagree?',
    primerOsoba: 'E.g. What should I pay attention to this fall? What does this person’s chart say?',
    poljeOpis: 'Your question',
    /** "123 / 500" — character count. */
    brojac: (n, max) => `${n} / ${max}`,
    posalji: 'Send question',
    naPlacanje: 'Continue to payment',
  },

  /** One question and its answer. */
  pitanje: {
    nijeUcitano: 'The question didn’t load. Check your connection and open it again.',
    nePostoji: 'This question no longer exists.',
    /** "Awaiting answer · Sep 24" */
    oznaka: (status, datum) => `${status} · ${datum}`,
    tvojePitanje: 'Your question',
    odgovor: 'Answer',
    glasovnaPoruka: 'Voice message',
    /** Must say the answer is in Serbian. */
    ceka: (ime) => `${ime} usually answers within ${ROK_KRATKO}. The answer will show up here as a voice message, in Serbian.`,
    nijePoslato: 'This question hasn’t been sent yet.',
    vraceno: (ime) => `Your payment for this question was refunded, so ${ime} won’t receive it.`,
  },

  /** Voice answer player. */
  plejer: {
    pauziraj: 'Pause answer',
    pusti: 'Play answer',
    napredak: 'Answer progress',
    /** Screen reader: "0:35 of 1:20". */
    vremeOd: (sada, ukupno) => `${sada} of ${ukupno}`,
    brzinaNormalna: 'Normal speed',
    brzinaPoIPo: 'One and a half times speed',
    /** Speed button label. */
    brzina1: '1x',
    brzina15: '1.5x',
    nijeStigao: 'The recording didn’t arrive. Check your connection and open the question again.',
    neMozeDaSePusti: 'The recording can’t be played. Close the question and open it again.',
  },
};
