/**
 * PRICA O ZNAKU (Ivan, 30.9.2026; pravilo 25 u CLAUDE.md) — cist racun: koje slike, koji tekst na
 * kojoj, koliko traje svaka. Bez React Native-a, da se testira u Node-u (`check:prica-znaka`).
 *
 * Devet slika, Ivanov izbor iz prototipa (C1, A1, B2+A3, B3, B4, B5, A2, A4, C6):
 * sazvezdje, naslovna sa gravirom, ukratko i vrednosti, u ljubavi, na poslu, kako te osvojiti,
 * osnove znaka, kamen/boja/biljka/hrana, vladar. Tekst je sa sajta (`znak-opis-podaci.ts`),
 * a element, kvalitet, doba godine, polaritet i srodni znaci se RACUNAJU iz mesta znaka u krugu.
 */
import { datum } from '@/lib/horoscope';
import type { NatalChart } from '@/lib/natal';
import { moonSignForUnknownTime } from '@/lib/natal-keys';
import { TRAJANJE_STALNO, trajanjeSlike } from '@/lib/prica';
import { ZNAK_OPIS, type ZnakOpis } from '@/lib/znak-opis-podaci';
import { SIGN_CASES, SIGNS, type Element, type ZodiacSign } from '@/lib/zodiac';

export type SlikaZnaka =
  | 'sazvezdje' | 'naslovna' | 'ukratko' | 'ljubav' | 'posao' | 'osvojiti' | 'osnove' | 'stvari' | 'vladar';

export const SLIKE_ZNAKA: readonly SlikaZnaka[] = [
  'sazvezdje', 'naslovna', 'ukratko', 'ljubav', 'posao', 'osvojiti', 'osnove', 'stvari', 'vladar',
];

/** Tamne slike (indigo): zaglavlje, traka napretka i statusna traka su beli. */
export function tamnaSlikaZnaka(k: SlikaZnaka): boolean {
  return k === 'sazvezdje' || k === 'osvojiti';
}

const REDNI = ['Prvi', 'Drugi', 'Treći', 'Četvrti', 'Peti', 'Šesti', 'Sedmi', 'Osmi', 'Deveti', 'Deseti', 'Jedanaesti', 'Dvanaesti'];
export const ELEMENT_IME: Record<Element, string> = { vatra: 'Vatra', zemlja: 'Zemlja', vazduh: 'Vazduh', voda: 'Voda' };
const ELEMENT_PRIDEV: Record<Element, string> = { vatra: 'vatreni', zemlja: 'zemljani', vazduh: 'vazdušni', voda: 'vodeni' };

export type Kvalitet = 'Kardinalan' | 'Fiksni' | 'Promenljiv';
const KVALITETI: readonly Kvalitet[] = ['Kardinalan', 'Fiksni', 'Promenljiv'];
const KVALITET_PRIDEV: Record<Kvalitet, string> = { Kardinalan: 'kardinalni', Fiksni: 'fiksni', Promenljiv: 'promenljivi' };
/** Doba godine: [akuzativ, genitiv] — "otvara proleće", "sredina proleća". Severna polulopta. */
const DOBA: readonly (readonly [string, string])[] = [['proleće', 'proleća'], ['leto', 'leta'], ['jesen', 'jeseni'], ['zimu', 'zime']];

/** Instrumental imena znaka: "Ovnom vlada Mars". (Nominativ, akuzativ i lokativ su u `zodiac.ts`.) */
export const INSTRUMENTAL: Record<string, string> = {
  aries: 'Ovnom', taurus: 'Bikom', gemini: 'Blizancima', cancer: 'Rakom', leo: 'Lavom', virgo: 'Devicom',
  libra: 'Vagom', scorpio: 'Škorpijom', sagittarius: 'Strelcem', capricorn: 'Jarcem', aquarius: 'Vodolijom', pisces: 'Ribama',
};
/**
 * Latinsko ime SAZVEZDJA (IAU) — natpis uz crtez na slici "Sazvezdje", kao u zvezdanom atlasu (Ivan,
 * 1.10.2026). Imena sazvezdja, ne znakova: Scorpius i Capricornus, ne Scorpio i Capricorn.
 */
export const LATINSKO_IME: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer', leo: 'Leo', virgo: 'Virgo',
  libra: 'Libra', scorpio: 'Scorpius', sagittarius: 'Sagittarius', capricorn: 'Capricornus', aquarius: 'Aquarius', pisces: 'Pisces',
};

/** Koliko sazvezdje zauzima od manje stranice prostora crteza (ostatak su pozadinske zvezde). */
export const POPUNA_SAZVEZDJA = 0.8;
/** Razmak natpisa ispod najnize zvezde i visina njegovog reda (pt, pre razmere slike). */
export const NATPIS_SAZVEZDJA = { razmak: 8, red: 16 } as const;

/**
 * Vrh natpisa sazvezdja (pt od vrha prostora crteza): `razmak` ispod najnize zvezde. Isti racun kao
 * `components/prica-znaka/sazvezdje.tsx`: sazvezdje je centrirano, veca stranica = 1, a zauzme
 * `popuna` manje stranice prostora; `najnize` je najveci y zvezda (od -0,5 do 0,5, y nadole).
 */
export function vrhNatpisaSazvezdja(najnize: number, sirina: number, visina: number, popuna: number, razmak: number): number {
  return visina / 2 + najnize * Math.min(sirina, visina) * popuna + razmak;
}

/** Znaci cije je ime u mnozini: "Blizanci vladaju", ne "vlada". */
const MNOZINA = new Set(['gemini', 'pisces']);

/** Recenica sa sajta ide na sliku samo ako nije duza od ovoga — duza bi potisnula naslov. */
export const NAJDUZA_RECENICA = 34;

const brojReci = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
const uz = (t: string) => t.replace(/[.!?…]+$/, '');

export type PricaZnaka = {
  znak: ZodiacSign;
  opis: ZnakOpis;
  /** Stepen Sunca u znaku (0—29); `null` bez tacnog vremena rodjenja — tada se ne prikazuje. */
  stepen: number | null;
  /** "Prvi znak zodijaka" */
  redni: string;
  /** Latinsko ime sazvezdja ("Aries", "Scorpius") — natpis uz crtez na slici "Sazvezdje". */
  latinsko: string;
  /** "21. mar – 19. apr" — iz `SIGNS[].dates` (aplikacija), ne sa sajta; bez "otprilike" (Ivan, 30.9.2026). */
  datumi: string;
  element: Element;
  elementIme: string;
  kvalitet: Kvalitet;
  /** "otvara proleće", "sredina leta", "kraj zime" */
  doba: string;
  polaritet: 'Pozitivan' | 'Negativan';
  polaritetOpis: string;
  /** "kao Lav i Strelac" */
  srodni: string;
  /** "Vatreni, kardinalni znak" */
  osnove: string;
  /** "Deo tela kojim Ovan vlada" */
  teloOznaka: string;
  /** "Ovnom vlada Mars" */
  vladarNaslov: string;
  vladar: { key: string; ime: string };
  /**
   * Recenica ispod naslova vladara (Ivan, 1.10.2026): "U tvojoj natalnoj karti Mars je u Biku." — iz
   * karte; Lavom vlada Sunce, koje je uvek u Lavu, pa tu ide ime iz mita ("Grci su ga zvali Helios.").
   * `null` kad znak vladara nije poznat.
   */
  vladarRecenica: string | null;
  /** Naslov poglavlja sa tackom na kraju: "Otvorenost i ishitrenost." */
  ukratko: string;
  /** Prve recenice poglavlja; `null` kad su preduge za sliku. */
  ukratkoRecenica: string | null;
  ljubavRecenica: string | null;
  posaoRecenica: string | null;
  /** Trajanje svake slike (ms), redom `SLIKE_ZNAKA`. */
  trajanja: number[];
};

function recenica(t: string): string | null {
  return brojReci(t) <= NAJDUZA_RECENICA ? t : null;
}

/** "21. mar – 19. apr" iz `SIGNS[].dates` ("21.3 — 19.4"); mesec kroz `datum()`, kao svuda. */
export function datumiZnaka(z: ZodiacSign): string {
  const [od, doo] = z.dates.split('—').map((d) => d.trim().split('.').map(Number));
  const dan = ([d, m]: number[]) => datum(new Date(Date.UTC(2001, m - 1, d)), { utc: true });
  return `${dan(od)} – ${dan(doo)}`;
}

export function kvalitetZnaka(i: number): Kvalitet {
  return KVALITETI[i % 3];
}

/** Doba godine koje znak otvara, sredina ili kraj — kardinalni znaci otvaraju doba (severna polulopta). */
export function dobaZnaka(i: number): string {
  const [akuzativ, genitiv] = DOBA[Math.floor(i / 3)];
  return [`otvara ${akuzativ}`, `sredina ${genitiv}`, `kraj ${genitiv}`][i % 3];
}

/** Ostala dva znaka istog elementa, redom u krugu. */
export function srodniZnaci(z: ZodiacSign): ZodiacSign[] {
  return SIGNS.filter((s) => s.key !== z.key && s.element === z.element);
}

/** Za Lava (vladar Sunce, uvek u Lavu) umesto znaka vladara: grcko ime Sunca (Ivan, 1.10.2026). */
const VLADAR_MIT: Record<string, string> = { sun: 'Grci su ga zvali Helios.' };

/**
 * "U tvojoj natalnoj karti Mars je u Biku." Dva znaka (Mesec bez vremena rodjenja) -> "u Blizancima ili Raku",
 * kao trojka na tabu "Ti" — radije priznati nego pogadjati (pravilo 4).
 */
export function recenicaVladara(vladarKey: string, vladarIme: string, znaci: readonly string[] | null): string | null {
  if (VLADAR_MIT[vladarKey]) return VLADAR_MIT[vladarKey];
  if (!znaci?.length) return null;
  return `U tvojoj natalnoj karti ${vladarIme} je u ${znaci.map((z) => SIGN_CASES[z].loc).join(' ili ')}.`;
}

/**
 * @param vladarZnaci znak (ili dva, kad nije siguran) u kom je vladar znaka u natalnoj karti; `pricaZaKartu`.
 */
export function pricaZnaka(znakKey: string, stepen: number | null, vladarZnaci: readonly string[] | null = null): PricaZnaka {
  const i = SIGNS.findIndex((s) => s.key === znakKey);
  if (i < 0) throw new Error(`nepoznat znak ${znakKey}`);
  const znak = SIGNS[i];
  const opis = ZNAK_OPIS[znak.key];
  const kvalitet = kvalitetZnaka(i);
  const pridev = ELEMENT_PRIDEV[znak.element];
  const osnove = `${pridev[0].toUpperCase()}${pridev.slice(1)}, ${KVALITET_PRIDEV[kvalitet]} znak`;
  const polaritet = i % 2 === 0 ? 'Pozitivan' : 'Negativan';
  const vladarNaslov = `${INSTRUMENTAL[znak.key]} vlada ${znak.ruler}`;
  const ukratko = `${uz(opis.ukratko)}.`;
  const p: Omit<PricaZnaka, 'trajanja'> = {
    znak,
    opis,
    stepen,
    redni: `${REDNI[i]} znak zodijaka`,
    latinsko: LATINSKO_IME[znak.key],
    datumi: datumiZnaka(znak),
    element: znak.element,
    elementIme: ELEMENT_IME[znak.element],
    kvalitet,
    doba: dobaZnaka(i),
    polaritet,
    polaritetOpis: polaritet === 'Pozitivan' ? 'kao svi vatreni i vazdušni znaci' : 'kao svi zemljani i vodeni znaci',
    srodni: `kao ${srodniZnaci(znak).map((s) => s.name).join(' i ')}`,
    osnove,
    teloOznaka: `Deo tela kojim ${znak.name} ${MNOZINA.has(znak.key) ? 'vladaju' : 'vlada'}`,
    vladarNaslov,
    vladar: { key: znak.rulerKey, ime: znak.ruler },
    vladarRecenica: recenicaVladara(znak.rulerKey, znak.ruler, vladarZnaci),
    ukratko,
    ukratkoRecenica: recenica(opis.ukratkoRecenica),
    ljubavRecenica: recenica(opis.ljubavRecenica),
    posaoRecenica: recenica(opis.posaoRecenica),
  };
  // Trajanje po recima koje stoje na slici, isto pravilo kao dnevna prica; sazvezdje i naslovna kao njena naslovna.
  const tekst: Record<SlikaZnaka, string | null> = {
    sazvezdje: null,
    naslovna: null,
    ukratko: [ukratko, p.ukratkoRecenica ?? '', ...opis.vrednosti].join(' '),
    ljubav: [opis.ljubav, p.ljubavRecenica ?? ''].join(' '),
    posao: [opis.posao, p.posaoRecenica ?? ''].join(' '),
    osvojiti: opis.osvojiti,
    osnove: [osnove, p.elementIme, kvalitet, opis.pol, polaritet, opis.izgled, opis.telo].join(' '),
    stvari: ['Kamen, boja, biljka i hrana', opis.kamen, opis.boja, opis.biljka, opis.hrana, opis.zivotinja].join(' '),
    vladar: [vladarNaslov, p.vladarRecenica ?? ''].join(' '),
  };
  const trajanja = SLIKE_ZNAKA.map((k) => (tekst[k] === null ? TRAJANJE_STALNO.naslovna : trajanjeSlike(tekst[k]!)));
  return { ...p, trajanja };
}

/**
 * Prica o znaku za SVOJU kartu: Suncev znak, stepen Sunca (samo uz tacno vreme rodjenja — bez njega je
 * ±0,5°) i znak vladara. Bez pouzdane zone nema price (pravilo 4). Mesec (vladar Raka) bez vremena
 * rodjenja moze biti u dva znaka — `moonSignForUnknownTime`, isto kao trojka na tabu "Ti".
 */
export function pricaZaKartu(r: { chart: NatalChart; timeUnknown: boolean; zoneUnreliable: boolean; utc: Date }): PricaZnaka | null {
  if (r.zoneUnreliable) return null;
  const sunce = r.chart.planets.find((x) => x.key === 'sun');
  if (!sunce) return null;
  const znak = sunce.position.sign;
  let vladarZnaci: string[] | null = null;
  if (znak.rulerKey === 'moon' && r.timeUnknown) {
    const m = moonSignForUnknownTime(r.utc);
    vladarZnaci = m.certain ? [m.sign.key] : [m.from.key, m.to.key];
  } else {
    const v = r.chart.planets.find((x) => x.key === znak.rulerKey);
    vladarZnaci = v ? [v.position.sign.key] : null;
  }
  return pricaZnaka(znak.key, r.timeUnknown ? null : sunce.position.deg, vladarZnaci);
}

/**
 * Natpisi koji zavise od toga ko gleda: u prici "ti", na slici za deljenje prvo lice — sliku
 * objavljuje korisnik (kao "Moj dan" u dnevnoj prici).
 */
export const NATPISI = {
  sazvezdjeOznaka: { ti: 'Tvoje sazvežđe', ja: 'Moje sazvežđe' },
  sazvezdjeNaslov: { ti: 'Po ovim zvezdama je tvoj znak dobio ime.', ja: 'Po ovim zvezdama je moj znak dobio ime.' },
  osvojitiOznaka: { ti: 'Kako te osvojiti', ja: 'Kako da me osvojiš' },
} as const;

/** Ime fajla slike za deljenje: "Astro Shop Ovan" (bez nastavka). */
export function imeSlikeZnaka(z: ZodiacSign): string {
  return `Astro Shop ${z.name}`;
}

/** Lokativ imena znaka za dugme "Pročitaj: Sunce u Ovnu". */
export function sunceU(z: ZodiacSign): string {
  return `Sunce u ${SIGN_CASES[z.key].loc}`;
}

/**
 * Najveca velicina slova (pt) pri kojoj tekst staje u `redova` redova sirine `sirina` —
 * oprezan model sirine slova (0,55 em), isti princip kao `velicinaSaveta`: radije manje nego preko ivice.
 */
export function velicinaNaslova(tekst: string, sirina: number, max: number, min: number, redova: number): number {
  const reci = tekst.split(/\s+/).filter(Boolean);
  for (let s = max; s > min; s--) {
    const poRedu = Math.floor(sirina / (s * 0.55));
    let r = 1;
    let duz = 0;
    for (const w of reci) {
      if (duz && duz + 1 + w.length > poRedu) { r++; duz = w.length; } else duz += (duz ? 1 : 0) + w.length;
    }
    if (r <= redova) return s;
  }
  return min;
}
