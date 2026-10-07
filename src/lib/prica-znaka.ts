/**
 * PRICA O ZNAKU (Ivan, 30.9.2026; pravilo 25 u CLAUDE.md) — cist racun: koje slike, koji tekst na
 * kojoj, koliko traje svaka. Bez React Native-a, da se testira u Node-u (`check:prica-znaka`).
 *
 * Devet slika, Ivanov izbor iz prototipa (C1, A1, B2+A3, B3, B4, B5, A2, A4, C6):
 * sazvezdje, naslovna sa gravirom, ukratko i vrednosti, u ljubavi, na poslu, kako te osvojiti,
 * osnove znaka, kamen/boja/biljka/hrana, vladar. Tekst je sa sajta (`znak-opis-podaci.ts`),
 * a element, kvalitet, doba godine, polaritet i srodni znaci se RACUNAJU iz mesta znaka u krugu.
 */
import { tr } from '@/i18n/jezik';
import { datum } from '@/lib/horoscope';
import type { NatalChart } from '@/lib/natal';
import { moonSignForUnknownTime } from '@/lib/natal-keys';
import { TRAJANJE_STALNO, trajanjeSlike } from '@/lib/prica';
import type { PricaDana } from '@/lib/use-prica';
import { ZNAK_OPIS, type ZnakOpis } from '@/lib/znak-opis-podaci';
import { SIGNS, type Element, type ZodiacSign } from '@/lib/zodiac';

export type SlikaZnaka =
  | 'sazvezdje' | 'naslovna' | 'ukratko' | 'ljubav' | 'posao' | 'osvojiti' | 'osnove' | 'stvari' | 'vladar'
  | 'danas';

export const SLIKE_ZNAKA: readonly SlikaZnaka[] = [
  'sazvezdje', 'naslovna', 'ukratko', 'ljubav', 'posao', 'osvojiti', 'osnove', 'stvari', 'vladar',
];

/**
 * PRICA U ONBOARDINGU (Ivan, 2.10.2026): kraca od price iz taba "Ti" — bez "osnova znaka" i "kamen, boja,
 * biljka…" (ostaju u tabu "Ti"), a na kraju jedna slika "A sta je danas?": danasnji tekst "Tvog dana" u kratkoj
 * verziji, da poslednji utisak pred paywall bude ono sto se placa, ne gravira. Slika `danas` ima podatke
 * samo kad ih ima (`danasUPrici`); bez njih prica ide bez nje. Nema deljenja ni videa, pa nema ni kartice.
 */
export const SLIKE_ZNAKA_UVOD: readonly SlikaZnaka[] = [
  'sazvezdje', 'naslovna', 'ukratko', 'ljubav', 'posao', 'osvojiti', 'vladar', 'danas',
];

/** Trajanje svake slike redom `slike` (ms): iz `p.trajanja` za slike znaka, `danas` iz sopstvenog trajanja. */
export function trajanjaSlika(p: Pick<PricaZnaka, 'trajanja'>, slike: readonly SlikaZnaka[], danas: { trajanje: number } | null): number[] {
  return slike.map((k) => (k === 'danas' ? danas?.trajanje ?? TRAJANJE_STALNO.savet : p.trajanja[SLIKE_ZNAKA.indexOf(k)]));
}

/** Sadrzaj slike "A sta je danas?" (samo onboarding): naslov teksta, tri reda iz kratke verzije, ocena Ljubavi. */
export type DanasUPrici = {
  naslov: string;
  /** Pozitivni efekat, izazov, savet — red bez teksta se ne prikazuje. */
  redovi: { oznaka: string; tekst: string }[];
  ljubav: { ime: string; ocena: number } | null;
  trajanje: number;
};

/**
 * Slika "A sta je danas?" iz podataka dnevne price (`usePricaDana`) — iste izbore kao pocetna.
 * `null` kad nema ni jednog reda teksta: naslov bez teksta bi bila slika bez vrednosti, a radije
 * ide prica bez nje nego sa praznom.
 */
export function danasUPrici(dan: PricaDana | null): DanasUPrici | null {
  if (!dan?.tvojDan) return null;
  const t = tr().danas.tvojDan;
  const redovi = [
    { oznaka: t.efekat, tekst: dan.tvojDan.efekat },
    { oznaka: t.pazi, tekst: dan.tvojDan.izazov },
    { oznaka: t.savet, tekst: dan.savet?.tekst ?? '' },
  ].filter((r) => r.tekst.trim());
  if (redovi.length === 0) return null;
  const ljubav = dan.ocene?.redovi.find((r) => r.key === 'ljubav');
  return {
    naslov: dan.tvojDan.naslov,
    redovi,
    ljubav: ljubav ? { ime: ljubav.name, ocena: ljubav.ocena } : null,
    trajanje: trajanjeSlike([dan.tvojDan.naslov, ...redovi.map((r) => r.tekst)].join(' ')),
  };
}

/** Tamne slike (indigo): zaglavlje, traka napretka i statusna traka su beli. */
export function tamnaSlikaZnaka(k: SlikaZnaka): boolean {
  return k === 'sazvezdje' || k === 'osvojiti';
}

/** Kvalitet znaka — kljuc; ime je u recniku (`prica.znak.kvalitet`). */
export type KvalitetKljuc = 'kardinalan' | 'fiksni' | 'promenljiv';
const KVALITETI: readonly KvalitetKljuc[] = ['kardinalan', 'fiksni', 'promenljiv'];
export type PolaritetKljuc = 'pozitivan' | 'negativan';

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
  kvalitetKljuc: KvalitetKljuc;
  /** Ime kvaliteta: "Kardinalan" (recnik). */
  kvalitet: string;
  /** "otvara proleće", "sredina leta", "kraj zime" */
  doba: string;
  polaritetKljuc: PolaritetKljuc;
  /** "Pozitivan" / "Negativan" (recnik). */
  polaritet: string;
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
  /** Ista recenica u prvom licu, za karticu i video ("U mojoj natalnoj karti…", Ivan 1.10.2026). */
  vladarRecenicaJa: string | null;
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
  return tr().datum.opseg(dan(od), dan(doo));
}

export function kvalitetZnaka(i: number): KvalitetKljuc {
  return KVALITETI[i % 3];
}

/** Doba godine koje znak otvara, sredina ili kraj — kardinalni znaci otvaraju doba (severna polulopta). */
export function dobaZnaka(i: number): string {
  return tr().prica.znak.doba(Math.floor(i / 3), i % 3);
}

/** Ostala dva znaka istog elementa, redom u krugu. */
export function srodniZnaci(z: ZodiacSign): ZodiacSign[] {
  return SIGNS.filter((s) => s.key !== z.key && s.element === z.element);
}

/**
 * "U tvojoj natalnoj karti Mars je u Biku." Dva znaka (Mesec bez vremena rodjenja) -> "u Blizancima ili Raku",
 * kao trojka na tabu "Ti" — radije priznati nego pogadjati (pravilo 4).
 */
export function recenicaVladara(vladarKey: string, vladarIme: string, znaci: readonly string[] | null, lice: 'ti' | 'ja' = 'ti'): string | null {
  const t = tr();
  // Za Lava (vladar Sunce, uvek u Lavu) umesto znaka vladara: grcko ime Sunca (Ivan, 1.10.2026).
  const mit = t.prica.znak.vladarMit[vladarKey];
  if (mit) return mit;
  if (!znaci?.length) return null;
  return t.prica.znak.vladarRecenica(vladarIme, znaci.map((z) => t.nebo.znaci[z as keyof typeof t.nebo.znaci].lokativ), lice);
}

/**
 * @param vladarZnaci znak (ili dva, kad nije siguran) u kom je vladar znaka u natalnoj karti; `pricaZaKartu`.
 */
export function pricaZnaka(znakKey: string, stepen: number | null, vladarZnaci: readonly string[] | null = null): PricaZnaka {
  const i = SIGNS.findIndex((s) => s.key === znakKey);
  if (i < 0) throw new Error(`nepoznat znak ${znakKey}`);
  const znak = SIGNS[i];
  const opis = ZNAK_OPIS[znak.key];
  const t = tr().prica.znak;
  const kvalitetKljuc = kvalitetZnaka(i);
  const kvalitet = t.kvalitet[kvalitetKljuc];
  const osnove = t.osnove(znak.element, kvalitetKljuc);
  const polaritetKljuc: PolaritetKljuc = i % 2 === 0 ? 'pozitivan' : 'negativan';
  const polaritet = t.polaritet[polaritetKljuc];
  const vladarNaslov = t.vladarNaslov(znak.key, znak.ruler);
  const ukratko = `${uz(opis.ukratko)}.`;
  const p: Omit<PricaZnaka, 'trajanja'> = {
    znak,
    opis,
    stepen,
    redni: t.redni(i),
    latinsko: LATINSKO_IME[znak.key],
    datumi: datumiZnaka(znak),
    element: znak.element,
    elementIme: t.element[znak.element],
    kvalitetKljuc,
    kvalitet,
    doba: dobaZnaka(i),
    polaritetKljuc,
    polaritet,
    polaritetOpis: t.polaritetOpis[polaritetKljuc],
    srodni: t.srodni(srodniZnaci(znak).map((s) => s.name)),
    osnove,
    teloOznaka: t.teloOznaka(znak.key, znak.name),
    vladarNaslov,
    vladar: { key: znak.rulerKey, ime: znak.ruler },
    vladarRecenica: recenicaVladara(znak.rulerKey, znak.ruler, vladarZnaci),
    vladarRecenicaJa: recenicaVladara(znak.rulerKey, znak.ruler, vladarZnaci, 'ja'),
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
    stvari: [t.stvariNaslov, opis.kamen, opis.boja, opis.biljka, opis.hrana, opis.zivotinja].join(' '),
    vladar: [vladarNaslov, p.vladarRecenica ?? ''].join(' '),
    danas: null, // samo u onboardingu, trajanje po tekstu (`danasUPrici`); ne ulazi u `trajanja` ove price
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
 * objavljuje korisnik (kao "Moj dan" u dnevnoj prici). Iz recnika, u trenutku citanja.
 */
export const NATPISI = {
  get sazvezdjeOznaka() { return tr().prica.znak.sazvezdjeOznaka; },
  get sazvezdjeNaslov() { return tr().prica.znak.sazvezdjeNaslov; },
  get osvojitiOznaka() { return tr().prica.znak.osvojitiOznaka; },
};

/** Ime fajla slike za deljenje: "Astro Shop Ovan" (bez nastavka). */
export function imeSlikeZnaka(z: ZodiacSign): string {
  return tr().prica.imeFajla(z.name);
}

/** Tema za dugme "Pročitaj: Sunce u Ovnu". */
export function sunceU(z: ZodiacSign): string {
  const t = tr();
  return t.prica.znak.sunceU(t.nebo.uZnaku(z.key as keyof typeof t.nebo.znaci));
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
