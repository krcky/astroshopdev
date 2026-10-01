/**
 * Birth chart (tab "You"), Sky, Moon and the sheets around them — translation of `sr/karta.ts`.
 * One sub-object per screen or component. A WHOLE sentence is one function, because word order
 * differs between languages; sign names come from `nebo` (`uZnaku` = "in Leo", `uZnak` = "into Leo").
 */
import type { Recnik } from '../sr';
import { gramatika } from './gramatika';
import { nebo } from './nebo';

/** "2.3°" — decimal point, one decimal. */
const stepenDecimalno = (x: number) => `${x.toFixed(1)}°`;

/** 1 -> "1st", 2 -> "2nd", 11 -> "11th", 12 -> "12th". */
const redni = (n: number) => {
  const s = n % 100;
  if (s >= 11 && s <= 13) return `${n}th`;
  const kraj: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  return `${n}${kraj[n % 10] ?? 'th'}`;
};

/** Full month names (January = 0). English always capitalizes them. */
const MESECI_PUNO = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const karta: Recnik['karta'] = {
  /* --- shared by "You", Sky and readings ---------------------------------- */

  /** Name of the chart angle (list, reading, chart snapshot for the astrologer). */
  ascendent: 'Ascendant',
  /** Same angle in the Big Three and the list on "You" — short label. */
  podznak: 'Rising',
  /** Medium Coeli — abbreviation, in the list and on the wheel. */
  mc: 'MC',
  /** Ascendant label on the wheel (abbreviation). */
  asc: 'ASC',
  /** Retrograde marker — one letter, next to the degree and on the wheel. */
  retro: 'R',
  stepenDecimalno,
  /** "5th house" */
  kuca: (n) => `${redni(n)} house`,
  /** "in the 5th house" */
  uKuci: (n) => `in the ${redni(n)} house`,
  /** "Sun in Leo", "Ascendant in Pisces" */
  uZnaku: (ime, z) => `${ime} ${nebo.uZnaku(z)}`,
  /** "Sun square Mars" — two bodies and the aspect name. */
  aspekt: (a, aspekt, b) => `${a} ${aspekt} ${b}`,
  /** Aspects card title, uppercase comes from the style: "Aspects  ·  12". */
  aspektiNaslov: (n) => `Aspects  ·  ${n}`,
  /** Sign elements (Moon screen, "What is a birth chart?" sheet). */
  elementi: { vatra: 'Fire', zemlja: 'Earth', vazduh: 'Air', voda: 'Water' },

  /** `app/(tabs)/chart/index.tsx` — tab "You". */
  ti: {
    naslov: 'Birth chart',
  },

  /** `components/natalna-karta-prikaz.tsx` — whole birth chart ("You" and a person's page). */
  prikaz: {
    infoA11y: 'What is a birth chart?',
    nemozeNaslov: 'The chart can’t be calculated',
    nemozeOpis: (grad) =>
      `We can’t reliably tell what time it was in UTC in ${grad} on that date. An error of one hour moves the Ascendant by half a sign, so we’d rather show nothing than wrong numbers.`,
    javiNam: (zona) => `Let us know — time zone: ${zona}`,
    /** "Jul 10, 1990 at 14:05 · Belgrade"; without a birth time, no " at …". */
    rodjenje: (datum, vreme, grad) => `${datum}${vreme ? ` at ${vreme}` : ''} · ${grad}`,
    /** Bubble around the Sun in the Big Three — opens "Your sign's story". */
    tvojZnak: 'Your sign',
    /** Moon without a birth time: "Gemini or Cancer". */
    znakIli: (a, b) => `${a} or ${b}`,
    /** Same in the planet row: "in Gemini or Cancer". */
    uZnakuIli: (a, b) => `in ${nebo.znaci[a].lokativ} or ${nebo.znaci[b].lokativ}`,
    bezVremena:
      'No birth time was entered, so the Ascendant and houses are only an estimate. The planet positions are accurate — except the Moon, which can move up to 7° in 12 hours.',
    /** Screen reader, planet row: "Mars, Taurus, 2nd house"; `znak` null = not certain. */
    planetaA11y: (ime, znak, kuca) =>
      `${ime}, ${znak ?? 'sign not certain'}${kuca !== null ? `, ${redni(kuca)} house` : ''}`,
    /** Screen reader, expanded row: "in Cancer: <title>. Locked. Reading". */
    podRedA11y: (tekst, naslov, zakljucan) =>
      `${tekst}${naslov ? `: ${naslov}` : ''}${zakljucan ? '. Locked' : ''}. Reading`,
    /** Screen reader, Ascendant row: "Rising in Pisces. Reading". */
    ugaoA11y: (ime, z) => `${ime} ${nebo.uZnaku(z)}. Reading`,
  },

  /** `components/karta-lista.tsx` — rows under the wheel ("You" and Sky). */
  lista: {
    /** Screen reader, a point row on Sky. */
    tackaA11y: (ime, deg, min, znak, retro, kuca) =>
      `${ime}, ${deg}° ${min}' in ${znak}${retro ? ', retrograde' : ''}${kuca ? `, ${redni(kuca)} house` : ''}`,
    /** Sign that isn't known (Big Three). */
    nepoznat: 'Unknown',
    /** Screen reader, Big Three tile: "Sun: Leo. Your sign" / "Moon: Cancer. Reading". */
    trojkaA11y: (oznaka, tekst, prica, tumacenje) =>
      `${oznaka}: ${tekst}${prica ? `. ${prica}` : tumacenje ? '. Reading' : ''}`,
    /** Screen reader, aspect without a reading: "Sun square Mars, orb 1.4°". */
    aspektOrbisA11y: (ime, orbis) => `${ime}, orb ${orbis}`,
    /** Screen reader, aspect with a reading. */
    aspektA11y: (naslov, ime, zakljucan) =>
      `${naslov ? `${naslov}. ` : ''}${ime}${zakljucan ? '. Locked' : ''}. Reading`,
  },

  /** `app/(tabs)/sky/index.tsx` — "The sky right now". */
  nebo: {
    naslov: 'The sky right now',
    /** When time is shifted the title no longer claims "right now". */
    naslovPomereno: 'Sky',
    infoA11y: 'What is the sky right now?',
    datumA11y: (datum) => `Date: ${datum} Tap to choose a day.`,
    mestoA11y: (grad) => `Viewing location: ${grad}. Tap to change.`,
    /** Labels on the arrow buttons (lowercase). */
    dan: 'day',
    sat: 'hour',
    trenutno: 'Now',
    danNazad: 'Day back',
    satNazad: 'Hour back',
    satNapred: 'Hour forward',
    danNapred: 'Day forward',
    trenutnoA11y: 'Go back to the present moment',
    nijeSadasnje: 'This is not the sky right now.',
    vratiNaSada: 'Back to now',
    bezPlacidusa: (grad) =>
      `At the latitude of ${grad}, Placidus houses don’t exist — the points of the ecliptic that define them never rise above the horizon. Whole Sign houses are shown.`,
  },

  /** `app/sky-place.tsx` — where the sky is viewed from. */
  mesto: {
    naslov: 'Where you’re looking from',
    opis: 'Houses and the Ascendant depend on the place — the sky over Belgrade and over Sydney at the same moment is not the same.',
    trazi: 'Search for a city',
    gradIzProfila: 'City from your profile',
    trazimDalje: 'Searching further…',
    nemaGrada: 'No city by that name. Try without accents or type a bigger city nearby.',
    vratiNa: (grad) => `Back to ${grad}`,
    napomena:
      'This only changes the “The sky right now” screen. Your birth chart stays calculated for your place of birth — you can change that in your profile.',
  },

  /** `app/sky-datum.tsx` — calendar for Sky. */
  datumNeba: {
    naslov: 'Choose a day',
    opis: (grad, sat) => `The sky over ${grad} on that day at ${sat}.`,
  },

  /** `app/natal.tsx` — reading from the birth chart. */
  tumacenje: {
    osobaObrisana: 'This person is no longer on your list.',
    nijeDeoKarte: 'This reading isn’t part of your chart.',
    nijeDeoOveKarte: 'This reading isn’t part of this chart.',
    tacnostAspekta: 'Aspect precision',
    /** "orb 2.3° of 6°" */
    orbisOd: (orbis, max) => `orb ${orbis} of ${max}°`,
    /** "Position in Leo" — bar showing the position within the sign. */
    polozajUZnaku: (z) => `Position ${nebo.uZnaku(z)}`,
    /** "16° 05' of 30°" */
    stepenOd30: (deg, min) => `${deg}° ${min}' of 30°`,
    /** Moon without a birth time moved from one sign to another — own chart. */
    mesecPresao: (od, u) =>
      `On the day you were born, the Moon was ${nebo.uZnaku(od)}, then moved ${nebo.uZnak(u)}. Without a birth time we don’t know which sign it was in at the moment you were born, so we don’t show the reading.`,
    /** Same, another person's chart. */
    mesecPresaoOsoba: (od, u) =>
      `On the day of birth, the Moon was ${nebo.uZnaku(od)}, then moved ${nebo.uZnak(u)}. Without a birth time we don’t know which sign it was in at the moment of birth, so we don’t show the reading.`,
    dodajVreme: 'Add birth time',
    kucaBezVremena: 'Which house a planet is in depends on the exact birth time. Once you add it, the house reading will be here too.',
    premiumNaslov: 'Your whole chart',
    premiumNaslovOsoba: 'This person’s whole chart',
    premiumOpis: 'The Sun, Moon and rising sign are already open. The other planets in signs and houses, and all aspects, come with Premium.',
    premiumDugme: 'Unlock the whole chart',
    nijeUcitano: 'The reading can’t load right now. Check your internet connection.',
    /** "Conjunction – Struggle", as in the astrologer's text. */
    simbolikaAspekta: (aspekt, tema) => `${gramatika.veliko(aspekt)} – ${tema}`,
  },

  /** `components/info-list.tsx` + both "i" sheets — shared parts. */
  info: {
    retro: 'R next to a planet means it is retrograde: seen from Earth, it appears to move backward through the zodiac.',
    krug: 'Wheel',
    aspekti: 'Aspects',
    aspektiUvod: 'Harmonious ones are blue, tense ones pink, and the conjunction is gray.',
    /** Aspect label in the legend: "90° · Square – Challenge". */
    aspektOznaka: (ugao, aspekt, tema) => `${ugao}° · ${gramatika.veliko(aspekt)}${tema ? ` – ${tema}` : ''}`,
    /** Screen reader, same row: "90 degrees, Square – Challenge. <description>". */
    aspektA11y: (ugao, aspekt, sim) =>
      `${ugao} degrees, ${gramatika.veliko(aspekt)}${sim ? ` – ${sim.tema}. ${sim.opis}` : ''}`,
  },

  /** `app/natalna-karta-info.tsx` — "What is a birth chart?". */
  natalnaInfo: {
    naslov: 'What is a birth chart?',
    uvod: 'A birth chart is a picture of the sky at the moment you were born: where the Sun, Moon and planets were, in which signs and in which houses. That’s why everyone’s chart is different, like a celestial ID card.',
    kakoSeCita: 'How to read it',
    planete: 'Planets — what',
    planeteOpis: 'Each planet is one kind of energy that drives you.',
    znakovi: 'Signs — how',
    znakoviOpis: 'The sign shows how that energy is expressed. The same planet works differently in each of the 12 signs.',
    kuce: 'Houses — where',
    kuceOpis: 'The wheel is divided into 12 houses, and each one is an area of life. The house shows where a planet acts.',
    aspekti: 'Aspects — how they get along',
    aspektiOpis: 'The angles between planets show whether their energies complement each other or clash.',
    krunica: 'Crown — your ruler',
    krunicaOpis: 'The planet with a crown rules your rising sign. A transit it takes part in carries more weight.',
    krug: 'The outer ring is the 12 signs, and the color of the circle around a sign is its element. The numbers from 1 to 12 are the houses, the symbols are the planets. On the left is the Ascendant, or rising sign: the sign that was rising in the east at the moment you were born. At the top is the MC, the highest point of the sky at that moment. The colored lines in the middle are the aspects.',
    elementi: 'Elements',
    elementiUvod: 'Every sign belongs to one of the four elements.',
    /** Screen reader: "Fire: Aries, Leo, Sagittarius". */
    elementA11y: (element, znaci) => `${element}: ${znaci.join(', ')}`,
    vremeRodjenja: 'Birth time',
    vremeRodjenjaOpis: 'The rising sign and houses depend on the exact birth time. In one hour the Earth turns so far that the rising sign moves by half a sign. When no birth time is entered, the wheel has no houses, no Ascendant and no MC, and Aries, the first sign of the zodiac, is on the left.',
  },

  /** `app/nebo-info.tsx` — "What is the sky right now?". */
  neboInfo: {
    naslov: 'What is the sky right now?',
    uvod: 'The sky at this moment, seen from the chosen place: which sign the Sun, Moon and planets are in now and how they stand toward each other. The planets’ positions are the same for everyone, wherever you are. The houses, the 12 sections of the wheel, depend on the place, and they shift from minute to minute.',
    strelice: 'Use the arrows to move the hour and the day, and tap the date to choose any day.',
    krug: 'The outer ring is the 12 signs. The numbers from 1 to 12 are the houses, the symbols are the planets. On the left is the Ascendant: the sign rising in the east right now. At the top is the MC, the highest point of the sky at this moment. The colored lines in the middle are the aspects, and the gray symbols are points.',
    tacke: 'Points',
    tackeUvod: 'The Node, Lilith and the Part of Fortune are not celestial bodies but calculated points. Aspect lines are not drawn for them.',
    /** Description of each point — facts, no interpretation. Keys as in `lib/points.ts`. */
    opisTacke: {
      northNode:
        'The place where the Moon’s path crosses the apparent path of the Sun, heading north. It moves backward and takes about a year and a half to pass through one sign, which is why it almost always has an R next to it. The true node is shown, not the mean one.',
      lilith:
        'Also called the Black Moon: the point of the Moon’s orbit farthest from Earth. It moves forward and goes around the whole zodiac in about nine years. The mean Lilith is shown, because the true one can be off by as much as 30°.',
      fortune:
        'It can’t be seen in the sky; it is calculated from the Ascendant, the Sun and the Moon. That’s why it moves as fast as the Ascendant and goes around the whole wheel in a day. It is calculated with a different formula by day and by night.',
    },
  },

  /** `lib/moon.ts` — Moon labels (database keys are NOT translated). */
  luna: {
    /** Main phases and waxing/waning — keys as in `PhaseKey`. */
    faze: {
      new: 'New Moon', first: 'First Quarter', full: 'Full Moon', last: 'Last Quarter',
      waxing: 'Waxing Moon', waning: 'Waning Moon',
    },
    /** Plant part by element (biodynamic calendar). */
    biljka: { vatra: 'Fruit', zemlja: 'Root', vazduh: 'Flower', voda: 'Leaf' },
    /** Lunar calendar areas — keys as in `LunarArea` (part of the database key). */
    oblasti: { ljubav: 'Love', zdravlje: 'Health', karijera: 'Career', kuca: 'Home', basta: 'Garden' },
    /** TEMPORARY: one sentence per phase until the astrologer sends real ones. */
    fazaPrivremeno: {
      new: 'The start of a new lunar cycle, a good moment to set an intention.',
      first: 'The first obstacle on the path of what you started calls for a decision and action.',
      full: 'The peak of the cycle: feelings are stronger, and things come to light.',
      last: 'Time to finish, tidy up and let go of what you no longer need.',
      waxing: 'Energy is growing, so it’s easier to build and begin.',
      waning: 'Energy is fading, so it’s time to wrap things up and rest.',
    },
    /** House themes for the "For you" row (waiting for the astrologer). */
    temeKuca: {
      1: 'you and your body', 2: 'money and values', 3: 'communication and surroundings',
      4: 'home and family', 5: 'love, creativity and children', 6: 'work and health',
      7: 'partnerships', 8: 'shared money and change', 9: 'travel and learning',
      10: 'career and reputation', 11: 'friends and plans', 12: 'rest and inner world',
    } as Record<number, string>,
    /**
     * Moon screen title and the Moon slide in the story: phase always with the word "Moon",
     * then the sign — "Full Moon in Taurus", "First Quarter Moon in Sagittarius".
     */
    naslov: (faza, lokativ) => `${faza.includes('Moon') ? faza : `${faza} Moon`} in ${lokativ}`,
  },

  /** `app/moon.tsx` — Moon screen and lunar calendar. */
  mesec: {
    /** The Moon changes sign that day: after the change / before the change. */
    odSata: (sat, z) => `From ${sat}, before that ${nebo.uZnaku(z)}`,
    doSata: (sat, z) => `Until ${sat}, then ${nebo.uZnaku(z)}`,
    lunarniKalendar: 'Lunar calendar',
    otvoriKalendarA11y: (datum) => `${datum}. Open calendar`,
    danas: 'Today',
    nazadNaDanas: 'Back to today',
    /** "98% lit · lunar day 14" */
    osvetljen: (procenat, lunarniDan) => `${procenat} lit · lunar day ${lunarniDan}`,
    biljka: 'Plant',
    element: 'Element',
    saveti: 'Tips for this area haven’t arrived yet.',
    savetiBezVeze: 'Tips will appear once you’re back online.',
    zaTebeDanas: 'For you today',
    zaTebeDan: (dan) => `For you · ${dan}`,
    tacanU: (sat) => `Exact at ${sat}`,
    danRanije: 'Day before',
    danKasnije: 'Day after',
    prethodniMesec: 'Previous month',
    sledeciMesec: 'Next month',
    ceoMesec: 'Whole month',
    /** "Oct 14 at 22:05" — day of a main phase in the list under the calendar. */
    fazaU: (dan, sat) => `${dan} at ${sat}`,
    /** Screen reader, calendar cell: "Oct 14, Full Moon". */
    celijaA11y: (datum, faza) => `${datum}${faza ? `, ${faza}` : ''}`,
  },

  /** `lib/lunarni-kalendar.ts` — month grid (week starts on Monday). */
  kalendar: {
    meseciPuno: MESECI_PUNO,
    /** "October 2026" — title of the whole calendar. */
    naslov: (mesec, godina) => `${gramatika.veliko(MESECI_PUNO[mesec])} ${godina}`,
    /** Column headers, MONDAY FIRST — one letter each. */
    daniUNedelji: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  },
};
