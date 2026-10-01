import type { Recnik } from '../sr';
import { nebo } from './nebo';

/**
 * STORIES (rules 23 and 25): story of the day, your sign’s story, share cards, video.
 *
 * TWO VOICES, ON PURPOSE: a slide in the story speaks to the user ("Your day", "Going your way", "For you");
 * the SHARE CARD and the VIDEO are FIRST PERSON ("My day", "Going my way", "For me") — the user posts them.
 * They are separate entries (`dnevna` vs `kartica`, `ti` vs `ja`).
 *
 * WORD COUNT SETS SLIDE DURATION (0.25 s per word) — a longer translation = a longer slide.
 */

type ZnakKljuc = keyof Recnik['nebo']['znaci'];

/** Position of the sign in the zodiac, from Aries. */
const REDNI = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
const ELEMENT_PRIDEV = { vatra: 'fire', zemlja: 'earth', vazduh: 'air', voda: 'water' } as const;
const KVALITET_PRIDEV = { kardinalan: 'Cardinal', fiksni: 'Fixed', promenljiv: 'Mutable' } as const;
/** Seasons (Northern Hemisphere), from spring. */
const DOBA = ['spring', 'summer', 'fall', 'winter'];
/** Aspect between two planets, as astrologers write it: "Mars conjunct Sun", "Moon opposite Venus". */
const IZMEDJU: Record<string, string> = { conjunction: 'conjunct', opposition: 'opposite' };

export const prica: Recnik['prica'] = {
  /** Domain — not translated. */
  sajt: 'astroshop.rs',
  /** Share card header: "Wed, Sep 30, 2026 · astroshop.rs", "Aries · astroshop.rs". */
  uzSajt: (ispred) => `${ispred} · astroshop.rs`,
  /** File name the user sees (share sheet, Files, AirDrop), no extension: "Astro Shop 2026-10-01", "Astro Shop Cancer". */
  imeFajla: (sta) => `Astro Shop ${sta}`,
  /** Percent: "42%" (English: no space). */
  procenat: (n) => `${n}%`,

  plejer: {
    zatvori: 'Close story',
    podeliVideoSePravi: (procenat) => `Share. Making the video, ${procenat}`,
    /** Under "Continue" on the last slide of the onboarding story. */
    novaPricaStize: 'A new story arrives every day, on the home screen.',
    prethodnaSlika: 'Previous slide',
    sledecaSlika: (redni, od) => `Next slide, ${redni} of ${od}`,
  },

  ulaz: {
    /** Bubble label (short, one line) and button name. */
    pricaDana: 'Story of the day',
    hint: 'Opens a short story about your day',
  },

  /** Story slide — SECOND PERSON. Entries without a person are also used by the share card. */
  dnevna: {
    tvojDan: 'Your day',
    nemaAspekata: 'Today no planet makes an aspect to your chart.',
    /** "Most important today · exact today" (all caps). */
    najvaznijeDanas: (momenat) => `Most important today · ${momenat}`,
    najboljeTiIde: 'Going best for you',
    /** All caps, under the area name. */
    boljeNegoJuce: '↑ better than yesterday',
    /** VoiceOver for a rating row: "Love, 4 of 5, good, better than yesterday". */
    ocenaA11y: (oblast, ocena, oznaka, bolje) =>
      `${oblast}, ${ocena} of 5, ${oznaka}${bolje ? ', better than yesterday' : ''}`,
    ideTi: 'Going your way',
    kociTe: 'Holding you back',
    /** "Moon today · Next: Last quarter, Sat, Oct 3" (all caps). */
    mesecDanas: (sledeca) => `Moon today · ${sledeca}`,
    zaTebe: 'For you',
    /** Caption under the advice: "From the reading for Mars square Sun." */
    izTumacenja: (tranzit) => `From the reading for ${tranzit}.`,
    savetDana: "Today’s advice",
    /** Button on the last slide, and the share sheet title. */
    podeliSvojDan: 'Share your day',
    procitajCeo: 'Read the full text',
  },

  /** SHARE CARD and VIDEO frame of the story of the day — FIRST PERSON. */
  kartica: {
    mojDan: 'My day',
    najboljeMiIde: 'Going best for me',
    ideMi: 'Going my way',
    kociMe: 'Holding me back',
    zaMene: 'For me',
  },

  racun: {
    /** Transit tone legend: "7 harmonious", "2 mixed", "1 tense"; joined with " · ". */
    ton: {
      povoljno: (n) => `${n} harmonious`,
      mesovito: (n) => `${n} mixed`,
      izazovno: (n) => `${n} tense`,
    },
    /** Moment of "Your day" next to "Most important today" (lower case). */
    momenat: {
      egzaktan: 'exact today',
      pocinje: 'starts today',
      zavrsava: 'last day',
    },
    /** Transit name: "Mars square Sun" (transiting planet, aspect, natal point). */
    imeTranzita: (tranzitna, aspekt, natalna) => `${tranzitna} ${IZMEDJU[aspekt] ?? aspekt} ${natalna}`,
    /** Next main Moon phase: "Next: Last quarter, Sat, Oct 3". */
    sledi: (faza, datum) => `Next: ${faza}, ${datum}`,
  },

  /** YOUR SIGN’S STORY. */
  znak: {
    /** After "Astro Shop" in the story header, and the video title on the bar. */
    podnaslov: 'Your sign',
    /** "First sign of the zodiac"; `i` = position from Aries (0–11). */
    redni: (i) => `${REDNI[i]} sign of the zodiac`,
    element: { vatra: 'Fire', zemlja: 'Earth', vazduh: 'Air', voda: 'Water' },
    kvalitet: { kardinalan: 'Cardinal', fiksni: 'Fixed', promenljiv: 'Mutable' },
    polaritet: { pozitivan: 'Positive', negativan: 'Negative' },
    polaritetOpis: {
      pozitivan: 'like all fire and air signs',
      negativan: 'like all earth and water signs',
    },
    /** Title of the "Sign basics" slide: "Cardinal fire sign". */
    osnove: (element, kvalitet) => `${KVALITET_PRIDEV[kvalitet]} ${ELEMENT_PRIDEV[element]} sign`,
    /** Season: `doba` 0 spring … 3 winter, `deo` 0 opens, 1 middle, 2 end. */
    doba: (doba, deo) => {
      const d = DOBA[doba];
      return [`start of ${d}`, `mid-${d}`, `end of ${d}`][deo];
    },
    /** Related signs of the same element: "like Leo and Sagittarius". */
    srodni: (imena) => `like ${imena.join(' and ')}`,
    /** "Body part ruled by Aries" (same form for Gemini and Pisces). */
    teloOznaka: (_znakKljuc, ime) => `Body part ruled by ${ime}`,
    /** "Aries is ruled by Mars" (Gemini and Pisces too: "Gemini is ruled by Mercury"). */
    vladarNaslov: (znakKljuc, vladar) => `${nebo.znaci[znakKljuc as ZnakKljuc]?.ime ?? ''} is ruled by ${vladar}`.trim(),
    /** Instead of the ruler’s sign, when the ruler is always in the same sign (Sun in Leo). */
    vladarMit: { sun: 'The Greeks called it Helios.' },
    /** "In your birth chart Mars is in Taurus." — two signs when birth time is unknown ("in Gemini or Cancer"). */
    vladarRecenica: (vladar, lokativi, lice = 'ti') => `In ${lice === 'ja' ? 'my' : 'your'} birth chart, ${vladar} is in ${lokativi.join(' or ')}.`,
    /** Reading topic for the button: "Sun in Aries" (`uZnaku` = "in Aries"). */
    sunceU: (uZnaku) => `Sun ${uZnaku}`,
    /** Button on the last slide: "Read: Sun in Aries". */
    procitaj: (tema) => `Read: ${tema}`,
    /** Chip on the title slide: "Sun at 14°". */
    sunceNa: (stepen) => `Sun at ${stepen}°`,

    /** Slide 1 — label and title: `ti` in the story, `ja` on the share card and in the video (FIRST PERSON). */
    sazvezdjeOznaka: { ti: 'Your constellation', ja: 'My constellation' },
    sazvezdjeNaslov: { ti: 'Your sign was named after these stars.', ja: 'My sign was named after these stars.' },
    /** Slide 3: "Aries at a glance" (all caps). */
    ukratko: (ime) => `${ime} at a glance`,
    najveceVrednosti: 'Core values',
    uLjubavi: 'In love',
    naPoslu: 'At work',
    /** Slide 6: `ti` in the story, `ja` on the card and in the video (FIRST PERSON). */
    osvojitiOznaka: { ti: 'How to win you over', ja: 'How to win me over' },
    /** Slide 7. */
    osnoveZnaka: 'Sign basics',
    oznakaElement: 'Element',
    oznakaKvalitet: 'Quality',
    /** Masculine / feminine sign (value comes from the website text). */
    oznakaPol: 'Gender',
    oznakaPolaritet: 'Polarity',
    oznakaIzgled: 'Appearance',
    /** Slide 8. The title counts toward slide duration (word count). */
    znakUStvarima: 'The sign in things',
    stvariNaslov: 'Stone, color, plant and food',
    dragiKamen: 'Gemstone',
    boja: 'Color',
    biljka: 'Plant',
    hrana: 'Food',
    zivotinja: 'Animal',
    /** Slide 9. */
    vladarZnaka: 'Ruling planet',
    /** Button on the last slide, and the share sheet title. */
    podeliSvojZnak: 'Share your sign',
  },

  /** Story VIDEO: job and notification. */
  posao: {
    /** Video title for the story of the day (bar above the tabs). */
    naslovDana: 'Story of the day',
    /** Notification text: "Story of the day, Wed, Oct 1, 2026." */
    opisDana: (datum) => `Story of the day, ${datum}.`,
    /** "Your sign’s story, Aries." */
    opisZnaka: (znak) => `Your sign’s story, ${znak}.`,
    /** Local notification when the video is done. */
    obavestenjeNaslov: 'Your video is ready',
    obavestenjeTekst: (opis) => `${opis} Tap to share it.`,
    /** Android: notification channel name in system settings. */
    kanal: 'Story videos',
  },

  /** "Share" in the story: image or video. */
  ponudi: {
    upravoPravimo: (drugi) => `We’re making a video right now: ${drugi}. You can make this one as soon as that one is done.`,
    sePravi: (procenat) => `Making the video · ${procenat}. We’ll let you know when it’s done.`,
    spreman: 'The video of the whole story is ready.',
    pravimoOkoMinut: "The video takes about a minute. Keep using the app meanwhile — we’ll let you know when it’s done.",
    ovaSlika: 'This image',
    pogledajVideo: 'Watch video',
    celaPrica: 'Whole story, video',
    /** Disabled button in the iOS menu while the video is being made. */
    sePraviDugme: (procenat) => `Making the video · ${procenat}`,
    cekaDrugi: 'Video — waiting for the other video',
  },

  /** Bar above the tabs. */
  traka: {
    pravimo: 'Making your video',
    spreman: 'Your video is ready',
    nijeUspeo: "The video didn’t work",
    pokusajIzPrice: 'Try again from the story.',
    /** "Story of the day · 42%" */
    uToku: (naslov, procenat) => `${naslov} · ${procenat}`,
    /** VoiceOver: bar title and subtitle as one sentence. */
    a11y: (naslov, podnaslov) => `${naslov}. ${podnaslov}`,
    podeliVideo: 'Share video',
    skloni: 'Hide bar',
  },

  /** "Your video" sheet. `ios`: iOS calls the photo library "Photos", Android "Gallery". */
  video: {
    naslov: 'Your video',
    pricaDana: 'Story of the day',
    pricaOZnaku: "Your sign’s story",
    podeliVideo: 'Share video',
    doKrajaDana: 'It stays in the app until the end of the day.',
    doKrajaDanaGalerija: (ios) => `It stays in the app until the end of the day, and in ${ios ? 'Photos' : 'Gallery'} for good.`,
    dokNeNapravisNov: 'It stays in the app until you make a new one.',
    dokNeNapravisNovGalerija: (ios) => `It stays in the app until you make a new one, and in ${ios ? 'Photos' : 'Gallery'} for good.`,
    /** "Making your video · 42%" */
    pravimo: (procenat) => `Making your video · ${procenat}`,
    zaToVreme: 'Keep using the app meanwhile. If you leave it, the video starts over when you come back.',
    nijeUspeo: (dnevni) =>
      `The video didn’t work. Open ${dnevni ? 'the story of the day' : "your sign’s story"} and try again: “Share”, then “Whole story, video”.`,
    nemaDanas: 'No video yet today. Make one from the story of the day: “Share”, then “Whole story, video”.',
    nemaZnaka: "Your sign’s video hasn’t been made yet. Make it from your sign’s story (the “You” tab): “Share”, then “Whole story, video”.",
    bezDozvole: (ios) => `Astro Shop isn’t allowed to add to ${ios ? 'Photos' : 'Gallery'}.`,
    otvoriPodesavanja: 'Open Settings',
    sacuvano: (ios) => `Saved to ${ios ? 'Photos' : 'Gallery'}`,
    sacuvaj: (ios) => `Save to ${ios ? 'Photos' : 'Gallery'}`,
    nijeSacuvan: "The video wasn’t saved. Try again.",
    /** VoiceOver for the video preview (same for both stories). */
    a11yPregled: 'Story video',
  },
};
