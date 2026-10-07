/**
 * Podnaslovi astrologa za besplatna natalna tumacenja (Sunce, Mesec, Ascendent u znaku) — GENERISANO,
 * ne menjati rucno: `python3 scripts/korpus/natal-podnaslovi.py`. Samo fraze, bez tela teksta (pravilo 7).
 */
export type TackaPodnaslova = 'sun' | 'moon' | 'ascendant';

export const NATAL_PODNASLOVI: Record<string, Record<TackaPodnaslova, Record<string, string>>> = {
  "sr": {
    "sun": {
      "aries": "Probojna dinamičnost",
      "taurus": "Tradicionalne vrednosti",
      "gemini": "Fleksibilna komunikacija",
      "cancer": "Spomenar Zodijaka",
      "leo": "Kralj Zodijaka",
      "virgo": "Dominantan perfekcionizam",
      "libra": "Odmereni sudija",
      "scorpio": "Efekat Feniksa",
      "sagittarius": "Slobodni mislilac",
      "capricorn": "Dominantan status",
      "aquarius": "Jedinstveni humanista",
      "pisces": "Bezvremenski humanista"
    },
    "moon": {
      "aries": "Impulsivna hrabrost",
      "taurus": "Materijalna sigurnost",
      "gemini": "Verbalna angažovanost",
      "cancer": "Zaštitnička nastrojenost",
      "leo": "Preduzetnički instinkt",
      "virgo": "Razumevanje detalja",
      "libra": "Suptilni mirotvorac",
      "scorpio": "Emotivna ljubomora",
      "sagittarius": "Filozof sa dušom",
      "capricorn": "Javno priznanje",
      "aquarius": "Neobična duša",
      "pisces": "Bogat valer osećanja"
    },
    "ascendant": {
      "aries": "Brzina kao vrlina",
      "taurus": "Utvrđene vrednosti",
      "gemini": "Večito u pokretu",
      "cancer": "Emocionalna stabilnost",
      "leo": "Kraljevsko visočanstvo",
      "virgo": "Marljivi radnik",
      "libra": "Milosrdni posrednik",
      "scorpio": "Bitka za sve ili ništa",
      "sagittarius": "Sa tobom nikada nije dosadno",
      "capricorn": "Postati neko i postići nešto",
      "aquarius": "Druželjubivi vizionar",
      "pisces": "Maštoviti sanjar"
    }
  },
  "hr": {
    "sun": {
      "aries": "Prodorna dinamičnost",
      "taurus": "Tradicionalne vrijednosti",
      "gemini": "Fleksibilna komunikacija",
      "cancer": "Spomenar zodijaka",
      "leo": "Kralj zodijaka",
      "virgo": "Dominantan perfekcionizam",
      "libra": "Odmjereni sudac",
      "scorpio": "Efekt Feniksa",
      "sagittarius": "Slobodni mislilac",
      "capricorn": "Dominantan status",
      "aquarius": "Jedinstveni humanist",
      "pisces": "Bezvremenski humanist"
    },
    "moon": {
      "aries": "Impulzivna hrabrost",
      "taurus": "Materijalna sigurnost",
      "gemini": "Verbalna angažiranost",
      "cancer": "Zaštitnička narav",
      "leo": "Poduzetnički instinkt",
      "virgo": "Razumijevanje detalja",
      "libra": "Suptilni mirotvorac",
      "scorpio": "Emotivna ljubomora",
      "sagittarius": "Filozof s dušom",
      "capricorn": "Javno priznanje",
      "aquarius": "Neobična duša",
      "pisces": "Bogat valer osjećaja"
    },
    "ascendant": {
      "aries": "Brzina kao vrlina",
      "taurus": "Utvrđene vrijednosti",
      "gemini": "Vječito u pokretu",
      "cancer": "Emocionalna stabilnost",
      "leo": "Kraljevsko visočanstvo",
      "virgo": "Marljivi radnik",
      "libra": "Milosrdni posrednik",
      "scorpio": "Bitka za sve ili ništa",
      "sagittarius": "S tobom nikada nije dosadno",
      "capricorn": "Postati netko i postići nešto",
      "aquarius": "Druželjubivi vizionar",
      "pisces": "Maštoviti sanjar"
    }
  },
  "bs": {
    "sun": {
      "aries": "Probojna dinamičnost",
      "taurus": "Tradicionalne vrijednosti",
      "gemini": "Fleksibilna komunikacija",
      "cancer": "Spomenar zodijaka",
      "leo": "Kralj zodijaka",
      "virgo": "Dominantan perfekcionizam",
      "libra": "Odmjereni sudija",
      "scorpio": "Efekat Feniksa",
      "sagittarius": "Slobodni mislilac",
      "capricorn": "Dominantan status",
      "aquarius": "Jedinstveni humanista",
      "pisces": "Bezvremenski humanista"
    },
    "moon": {
      "aries": "Impulsivna hrabrost",
      "taurus": "Materijalna sigurnost",
      "gemini": "Verbalna angažovanost",
      "cancer": "Zaštitnička nastrojenost",
      "leo": "Poduzetnički instinkt",
      "virgo": "Razumijevanje detalja",
      "libra": "Suptilni mirotvorac",
      "scorpio": "Emotivna ljubomora",
      "sagittarius": "Filozof s dušom",
      "capricorn": "Javno priznanje",
      "aquarius": "Neobična duša",
      "pisces": "Bogat valer osjećanja"
    },
    "ascendant": {
      "aries": "Brzina kao vrlina",
      "taurus": "Utvrđene vrijednosti",
      "gemini": "Vječito u pokretu",
      "cancer": "Emocionalna stabilnost",
      "leo": "Kraljevsko visočanstvo",
      "virgo": "Marljivi radnik",
      "libra": "Milosrdni posrednik",
      "scorpio": "Bitka za sve ili ništa",
      "sagittarius": "S tobom nikada nije dosadno",
      "capricorn": "Postati neko i postići nešto",
      "aquarius": "Druželjubivi vizionar",
      "pisces": "Maštoviti sanjar"
    }
  },
  "en": {
    "sun": {
      "aries": "Trailblazing dynamism",
      "taurus": "Traditional values",
      "gemini": "Flexible communication",
      "cancer": "The memory book of the zodiac",
      "leo": "The king of the zodiac",
      "virgo": "Dominant perfectionism",
      "libra": "The measured judge",
      "scorpio": "The Phoenix effect",
      "sagittarius": "The free thinker",
      "capricorn": "Dominant status",
      "aquarius": "The unique humanitarian",
      "pisces": "The timeless humanitarian"
    },
    "moon": {
      "aries": "Impulsive courage",
      "taurus": "Material security",
      "gemini": "Verbal engagement",
      "cancer": "A protective nature",
      "leo": "An entrepreneurial instinct",
      "virgo": "An understanding of detail",
      "libra": "The subtle peacemaker",
      "scorpio": "Emotional jealousy",
      "sagittarius": "A philosopher with soul",
      "capricorn": "Public recognition",
      "aquarius": "An unusual soul",
      "pisces": "A rich palette of feelings"
    },
    "ascendant": {
      "aries": "Speed as a virtue",
      "taurus": "Established values",
      "gemini": "Forever on the move",
      "cancer": "Emotional stability",
      "leo": "Royal Highness",
      "virgo": "The diligent worker",
      "libra": "The compassionate mediator",
      "scorpio": "An all-or-nothing battle",
      "sagittarius": "Never a dull moment with you",
      "capricorn": "Becoming someone and achieving something",
      "aquarius": "The sociable visionary",
      "pisces": "The imaginative dreamer"
    }
  }
};
