import type { Recnik } from '../sr';

/**
 * Tabs, home ("Today"), the "Transits" tab, the transit reading and what they share:
 * life areas, tone, duration, "Your day", "Moon today", "Changes in the sky". See `sr/danas.ts`.
 */

/** "1st", "2nd", "3rd", "4th" … "11th", "12th" — house ordinals. */
const redni = (n: number): string => {
  const s = n % 100;
  if (s >= 11 && s <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

/**
 * Aspect noun (from `nebo.aspekti`) -> the form English astrologers write between two planets:
 * "Venus conjunct natal Moon", "Sun opposite natal Jupiter", "Mars square natal Saturn".
 */
const aspektIzmedju = (aspekt: string): string =>
  ({ conjunction: 'conjunct', opposition: 'opposite' } as Record<string, string>)[aspekt.toLowerCase()] ?? aspekt;

export const danas: Recnik['danas'] = {
  /** Tab bar labels; also the titles of the tab screens. */
  tabovi: {
    danas: 'Today',
    tranziti: 'Transits',
    pitaj: 'Ask',
    /** The user's birth chart. */
    ti: 'You',
    nebo: 'Sky',
  },

  /** Home screen. */
  pocetna: {
    /** Glass capsule tabs under the header — keep short. */
    tabTvojDan: 'Your day',
    tabMesec: 'Moon',
    tabPromene: 'Changes',
    tabTeme: 'Themes',
    danasUkratko: 'Today at a glance',
    /** Same title when another day is shown. */
    ukratko: 'At a glance',
    ideTi: 'Going your way',
    kociTe: 'Holding you back',
    nemaTranzitaDana: 'No strong transits for this day.',
    promeneNadnaslov: 'What lies ahead',
    promeneNaslov: 'Changes in the sky',
    nemaPromena: 'No planet changes sign or direction soon.',
    temeNadnaslov: 'Transits that last for weeks and months',
    temeNaslov: 'Themes of the period',
    nemaTema: 'Right now no slow planet is in aspect with your chart.',
    /** "4 more in Transits" — link to the Transits tab. */
    josUTranzitima: (n: number) => `${n} more in Transits`,
    profil: 'Profile',
    /** Day menu: iOS menu title. */
    dan: 'Day',
    promeniDan: 'Change day',
    drugiDaniUzPremium: 'Other days with Premium',
    /** Screen reader: "Selected day: Yesterday. Change day". */
    izabranDan: (dan: string, opis: string) => `Selected day: ${dan}. ${opis}`,
    /** Screen reader for a locked day. */
    danUzPremium: (dan: string) => `${dan}. With Premium`,
    zatvoriMeni: 'Close menu',
    /** Days around today, -2 to +2 (index = offset + 2). */
    relativniDani: ['2 days ago', 'Yesterday', 'Today', 'Tomorrow', 'In 2 days'],
  },

  /** Transit names — list, home, reading, "Your day". */
  tranzit: {
    /** "Sun conjunct Jupiter" — transiting planet, aspect, natal point. */
    ime: (tranzitna: string, aspekt: string, natalna: string) => `${tranzitna} ${aspektIzmedju(aspekt)} ${natalna}`,
    /** "Sun conjunct natal Jupiter" — when only the name is shown, without text. */
    imeNatalni: (tranzitna: string, aspekt: string, natalna: string) =>
      `${tranzitna} ${aspektIzmedju(aspekt)} natal ${natalna}`,
    /** Ascendant and MC as natal targets of a transit. */
    ascendent: 'Ascendant',
    mc: 'MC',
    /** Duration of a Moon transit. */
    samoDanas: 'Today only',
    /** "In your 5th house". */
    uTvojojKuci: (kuca: number) => `In your ${redni(kuca)} house`,
    /** New/Full Moon in a house: larger "New beginning: love…", smaller "New Moon in your 5th house". */
    lunacijaVeci: (naslov: string, tema: string) => `${naslov}: ${tema}`,
    lunacijaManji: (faza: string, kuca: number) => `${faza} in your ${redni(kuca)} house`,
  },

  /** Life areas and day ratings. */
  oblasti: {
    imena: {
      ljubav: 'Love',
      zdravlje: 'Health and beauty',
      karijera: 'Career and money',
      kuca: 'Home and garden',
    },
    /** Short label next to the 1–5 rating. */
    oznakaOcene: { 5: 'Great day', 4: 'Good day', 3: 'Calm day', 2: 'Take care', 1: 'Hard day' } as Record<number, string>,
    /** Row title for a New and Full Moon in a natal house. */
    lunacijaMlad: 'New beginning',
    lunacijaPun: 'Peak',
  },

  /** Screen reader for area ratings. */
  ocene: {
    otvorena: (oblast: string, ocena: number, oznaka: string) => `${oblast}, rated ${ocena} out of 5, ${oznaka}`,
    zakljucana: (oblast: string) => `${oblast}, with Premium`,
    otvaraPremium: 'Opens Premium',
    otvaraTranzite: 'Opens transits',
  },

  /** Tone of a transit. */
  ton: {
    povoljno: 'Favorable',
    izazovno: 'Challenging',
    mesovito: 'Mixed',
    /** Screen reader: "Tone: Favorable". */
    oznaka: (ton: string) => `Tone: ${ton}`,
  },

  /** "Transits" tab and transit card. */
  tranziti: {
    nemaNaKarti: 'No transits to this chart today.',
    nemaTvojih: 'No transits for you today.',
    /** "5 more transits today" — `tranzita` is the word for the number (`gramatika.tranzita`). */
    josDanas: (n: number, tranzita: string) => `${n} more ${tranzita} today`,
    zakljucaniOpis: 'The strongest are open at the top of the list. The others shape your day too, and each has its own full reading.',
    otkljucajSve: 'Unlock all transits',
    otvaraCeoTekst: 'Opens the full transit reading',
  },

  /** Duration bar. */
  trajanje: {
    /** "Since Sep 13" */
    od: (dan: string) => `Since ${dan}`,
    duzeOdTriGodine: 'Lasts more than three years',
  },

  /** "Your day" card. */
  tvojDan: {
    /** Uppercase label above the title, next to the date. */
    oznaka: 'Your day',
    zastoOvajTekst: 'Why this text?',
    saznajVise: 'Learn more',
    /** Labels of the three items from the text. */
    efekat: 'Positive effect',
    pazi: 'Challenge',
    savet: 'Tip',
  },

  /** Sheet "Why this text?". */
  tvojDanInfo: {
    naslov: 'Why this text?',
    uvod: 'The text is written for the transit that matters most in your birth chart today.',
    tranzitDana: 'Transit of the day',
    /** Aspect angle in degrees. */
    objasnjenje: (ugao: number) => `A planet in today's sky and the ${ugao}° angle it makes with a point in your birth chart.`,
    tranzitVladara: 'Transit of your ruler',
    nijeDeoKarte: 'This transit is not part of your chart.',
    /** The ruler is the natal point. `uZnaku` = "in Pisces". */
    vladarNatalni: (planeta: string, uZnaku: string) =>
      `${planeta} is the ruler of your Ascendant ${uZnaku}. When a transit touches it, the day feels more personal and stronger, so this transit comes first today.`,
    /** The ruler is the transiting planet; `koga` comes from `tvojAkuzativ`. */
    vladarTranzitni: (planeta: string, uZnaku: string, koga: string) =>
      `${planeta} is the ruler of your Ascendant ${uZnaku}, and today it sets ${koga} in motion. That is why this transit comes first today.`,
    /** "your Venus" — English has no case, same form for every planet. */
    tvojAkuzativ: {
      sun: 'your Sun', moon: 'your Moon', mercury: 'your Mercury', venus: 'your Venus',
      mars: 'your Mars', jupiter: 'your Jupiter', saturn: 'your Saturn', uranus: 'your Uranus',
      neptune: 'your Neptune', pluto: 'your Pluto', ascendant: 'your Ascendant', midheaven: 'your MC',
    } as Record<string, string>,
  },

  /** Full transit reading. */
  tumacenje: {
    osobaViseNije: 'This person is no longer on your list.',
    /** Title while the text has none of its own. */
    tranzit: 'Transit',
    nijeNapisano: 'The reading for this transit has not been written yet.',
    stizeKadVeza: 'The full text will appear when you are back online.',
    procitajDoKraja: 'Read to the end',
    viseOTranzitu: 'More about this transit',
    pitajNaslov: 'Ask an astrologer about this transit',
    pitajOpis: (astrolog, oOsobi) =>
      `${astrolog} sees ${oOsobi ? "this person's chart" : 'your chart'} and answers with a voice message, in Serbian, usually within 2–3 business days.`,
    postaviPitanje: 'Ask a question',
    kratkaVerzija: 'This is the short version. The full one covers the areas of life the transit touches, its long-term effects and practical tips.',
    otkljucajCeo: 'Unlock the full text',
  },

  /** "Moon" tab on home. */
  mesecDanas: {
    /** "MOON TODAY · 91% illuminated" — uppercase label. */
    oznaka: 'Moon today',
    osvetljen: (pct: number) => `${pct}% illuminated`,
    /** "Waxing Moon in Leo" — `uZnaku` = "in Leo". */
    naslov: (faza: string, uZnaku: string) => `${faza} ${uZnaku}`,
    /** Screen reader for the Moon image. */
    slika: (naslov: string, pct: number, raste: boolean) => `${naslov}, ${pct} percent illuminated, ${raste ? 'waxing' : 'waning'}`,
    saznajVise: 'Learn more',
    nemaSaveta: 'Tips for this area have not arrived yet.',
    saveteKadVeza: 'Tips will appear when you are back online.',
    zaTebe: 'For you',
    /** Lunar calendar area capsules. */
    tabovi: {
      ljubav: 'Love',
      zdravlje: 'Health and beauty',
      karijera: 'Career and money',
      kuca: 'Home',
      basta: 'Garden',
    },
  },

  /** "Changes in the sky" card. */
  promena: {
    /** "Mars moves into Leo" — `uZnak` = "into Leo". */
    ulazi: (planeta: string, uZnak: string) => `${planeta} moves ${uZnak}`,
    /** "Venus retrograde in Scorpio" — no gender in English. */
    retrogradna: (_kljuc: string, planeta: string, uZnaku: string) => `${planeta} retrograde ${uZnaku}`,
    /** "Mars direct again in Leo". */
    direktna: (_kljuc: string, planeta: string, uZnaku: string) => `${planeta} direct again ${uZnaku}`,
    /** "Lasts until Nov 14" / "Lasts for years to come". */
    traje: (doKad: string) => `Lasts ${doKad}`,
  },

  /** Short sky summary (`skyline`). */
  horoskop: {
    /** "Moon in Leo · Waxing Gibbous · retrograde: Mercury, Saturn" */
    nebo: (znak: string, faza: string, retrogradni: string[]) =>
      `Moon in ${znak} · ${faza}` + (retrogradni.length ? ` · retrograde: ${retrogradni.join(', ')}` : ''),
  },

  /** Shared UI parts. */
  ui: {
    /** Screen reader while text is loading. */
    ucitavam: 'Loading',
    /** Wheel picker field labels on web. */
    poljeDan: 'day',
    poljeMesec: 'month',
    poljeGodina: 'year',
    poljeSat: 'hour',
    poljeMinut: 'minute',
  },
};
