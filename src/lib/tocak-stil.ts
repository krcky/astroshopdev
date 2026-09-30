/**
 * Izgled natalnog tocka — CIST podatak (bez React Native-a): crtice, boje,
 * velicine, linije aspekata. Citaju ga tocak u aplikaciji
 * (`components/natal-wheel.tsx`) i tocak u panelu za astrologa
 * (`panel/src/tocak.tsx`), pa izgledaju isto. Poluprecnici su u `lib/wheel.ts`.
 */
import { brand } from '@/theme/tokens';

/**
 * Boje ikonica "Ide ti" (plus) i "Koci te" (minus) na pocetnoj — Ivanove.
 * Ton na tabu "Tranziti" koristi ISTE ikonice, pa je znacenje jedno; na tocku su
 * to boje skladnih i napetih aspekata. Izvoze se i iz `components/ton.tsx`.
 */
export const PLUS_BOJA = '#7ACCEA';
export const MINUS_BOJA = '#F8B3C3';

/*
 * Crtice za stepene, ka centru od `R.zodiacIn`.
 *
 * Bez stepena se crtaju samo 5° i 10°, tacno kao ranije — bledo, jer su tamo
 * samo orijentir. Sa stepenima se dodaje crtica na SVAKI stepen, 360 komada,
 * pa idu kao tri putanje umesto kao 360 `<Line>` cvorova (`degreeTickPaths`).
 *
 * Tada boje moraju da potamne. Prva verzija je crtala 1° sa sirinom 0.35 u
 * `faint` (#ECECEC) — na belom je to kontrast 1.1:1 i crtice se nisu videle
 * uopste. Druga je bila #E4E4E4 i na telefonu je i dalje bila presvetla:
 * crtica od 0.5 jedinice je na 359 tacaka 0.43 piksela, pa je antialiasing
 * pojede. Zato su crtice i tamnije I deblje. Lenjir ima smisla samo ako se
 * tri nivoa razlikuju: 1° jedva vidljivo, 5° jasno, 10° najjace.
 */
export const TICK = { d1: 2.5, d5: 5, d10: 8 };
export const TICK_STYLE = {
  /** Sa stepenima — tri nivoa koja se stvarno razlikuju. */
  fine: {
    d1: { color: '#D6D6D6', width: 0.6 },
    d5: { color: '#BABABA', width: 0.8 },
    d10: { color: '#9E9E9E', width: 1.1 },
  },
  /** Bez stepena — zatecen izgled, ne dirati. */
  plain: {
    d5: { color: '#ECECEC', width: 0.6 },
    d10: { color: '#ECECEC', width: 1 },
  },
};

/**
 * Ispod koje velicine prikaza se stepeni gase.
 *
 * ViewBox je sirok 420 jedinica, pa je jedna jedinica `size / 420` tacaka na
 * ekranu. Granica je postavljena kad se minut crtao sa 7 jedinica: na 340 tacaka
 * to je ~5.7 tacaka — donja granica citljivosti za indeks. Ispod toga brojevi
 * postaju sum. (Od 30.9.2026 minut je 7,8 jedinica, ~6,3 tacke na 340.)
 */
export const DEGREES_MIN_SIZE = 340;

/** Precnik ikonice znaka u prstenu zodijaka (prsten je sirok 30 jedinica). */
export const ZNAK_TOCAK = 22;

/**
 * Tacka planete na ivici polja aspekata — tu se sustizu njene linije aspekata.
 * Polje nema svoju liniju (Ivan, 30.9.2026), pa tacke pokazuju gde je ivica.
 */
export const TACKA_PLANETE = 2.2;

export const TOCAK_BOJE = {
  ink: '#141414',
  line: '#D8D8D8',
  faint: '#ECECEC',
  /** I brojevi kuca — od 30.9.2026 su oko malog kruga, daleko od brojeva stepena, pa ne moraju biti svetliji. */
  muted: '#8A8A8A',
  /** ASC i MC van kruga — indigo iz loga (Ivan, 28.9.2026; bila zlatna, a zlatna je samo za placeno). */
  ugao: brand.indigo,
  /** Napeti aspekti — kvadrat, opozicija. Roze kao "Koci te" (Ivan, 28.9.2026; bila crvena). */
  tense: MINUS_BOJA,
  /** Skladni aspekti — trigon, sekstil. Svetlo plava kao "Ide ti" (Ivan, 28.9.2026; bila tamno plava). */
  easy: PLUS_BOJA,
  /** Ispuna kruga — bela na svakoj pozadini, da tocak ne bude providan (Ivan, 28.9.2026). */
  disk: '#FFFFFF',
};

/** Centar tocka i prazan okvir oko njega, u jedinicama viewBox-a (natpisi ASC/MC izlaze van kruga). */
export const CENTAR = 180;
export const OKVIR = 30;
export const VIEW = 2 * (CENTAR + OKVIR);

/**
 * Kako se crta linija svakog aspekta. Isto citaju legenda "Šta je natalna karta"
 * (`components/info-list.tsx`) i tocak u panelu za astrologa — ne mogu da se raziđu.
 */
export const ASPECT_STYLE: Record<string, { color: string; width: number; dash?: string }> = {
  // Svetle boje su deblje nego nekad tamne, inace se na belom disku izgube.
  // 30.9.2026 jos 1,45 puta deblje, i crtice duze u istoj meri (Ivan: "podebljaj linije aspekata").
  conjunction: { color: TOCAK_BOJE.muted, width: 1.45, dash: '4.4 4.4' },
  sextile: { color: TOCAK_BOJE.easy, width: 1.6, dash: '5.8 4.4' },
  trine: { color: TOCAK_BOJE.easy, width: 2.2 },
  square: { color: TOCAK_BOJE.tense, width: 2.2 },
  opposition: { color: TOCAK_BOJE.tense, width: 2.5 },
};
