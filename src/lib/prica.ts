/**
 * DNEVNA PRICA — sta prica danas prikazuje, kojim redom i koliko koja slika traje
 * (Ivan, 30.9.2026; dizajn "C", prototip: https://claude.ai/artifact/FrEMTkZyviB4KmBCrp4wYW).
 *
 * Prica NE racuna nista novo: broj i ton tranzita su lista sa taba "Tranziti"
 * (`oblasti.poVaznosti`), glavni tranzit je "Tvoj dan" (`pickTvojDan`), ocene su
 * ocene oblasti, "Ide ti / Koči te" je "Danas ukratko" (`pickBrief`), Mesec je
 * `phaseDay` + `moonDay`. Ovde je samo izbor slika, trajanje i geometrija crteza.
 *
 * Tekst se nikad ne izmislja: slika kojoj fali tekst astrologa se preskace, a
 * naslovi su iz korpusa ili racunato ime tranzita.
 *
 * Cisto, bez RN uvoza (pravilo 6). Provere: `npm run check:prica`.
 */
import { mnozina, TRANZIT, type Oblici } from '@/lib/mnozina';
import type { Tone } from '@/lib/tone';

export type SlikaKljuc = 'naslovna' | 'tvojDan' | 'ocene' | 'ideKoci' | 'mesec' | 'savet';

/** Redosled slika. Prica nema zbirnu karticu (Ivan: "prenatrpano") — svaka slika deli sebe. */
export const REDOSLED: readonly SlikaKljuc[] = ['naslovna', 'tvojDan', 'ocene', 'ideKoci', 'mesec', 'savet'];

/** Sta danas postoji — slika bez sadrzaja se preskace, ne prikazuje se prazna. */
export type Sadrzaj = {
  /** Broj tranzita na listi dana (tab "Tranziti"). */
  tranzita: number;
  /** "Tvoj dan" izabran za danas. */
  tvojDan: boolean;
  /** Bar jedna ocena oblasti. */
  ocene: boolean;
  /** Bar jedna recenica "Ide ti" ili "Koči te" SA tekstom astrologa. */
  ideKoci: boolean;
  /** Savet iz teksta "Tvog dana". */
  savet: boolean;
};

export function slikeDana(s: Sadrzaj): SlikaKljuc[] {
  const ima: Record<SlikaKljuc, boolean> = {
    // Naslovna i Mesec postoje uvek: datum i Mesec se racunaju i bez ijednog tranzita.
    naslovna: true,
    tvojDan: s.tvojDan,
    ocene: s.ocene,
    ideKoci: s.ideKoci,
    mesec: true,
    savet: s.savet,
  };
  return REDOSLED.filter((k) => ima[k]);
}

/**
 * Trajanje slike: 2 s + 0,4 s po reci, najmanje 5 i najvise 12 s. NN/g racuna
 * ~3 reci u sekundi; ovde je sporije (2,5), jer je tekst astrologov i cita se, ne preleće.
 */
export const TRAJANJE = { osnova: 2000, poReci: 400, min: 5000, max: 12000 } as const;

export function trajanjeSlike(tekst: string): number {
  const reci = tekst.trim() ? tekst.trim().split(/\s+/).length : 0;
  return Math.min(TRAJANJE.max, Math.max(TRAJANJE.min, TRAJANJE.osnova + reci * TRAJANJE.poReci));
}

/**
 * Reci naslova za ispis rec po rec. Jednoslovna rec (u, i, a, o, s, k) se veze za
 * sledecu nelomljivim razmakom, kao u srpskom slogu — da ne ostane sama na kraju reda
 * i da "Biku" ne padne sam u drugi red ("Opadajući Mesec / u Biku").
 */
export const NELOMLJIV = '\u00A0';
export function reciZaPrelom(tekst: string): string[] {
  const reci = tekst.split(/[ \t\n\r]+/).filter(Boolean);
  const out: string[] = [];
  let veza = '';
  reci.forEach((r, i) => {
    const rec = veza + r;
    const kraj = r.length === 1 && i < reci.length - 1;
    if (kraj) veza = rec + NELOMLJIV;
    else { out.push(rec); veza = ''; }
  });
  return out;
}

/* ------------------------------------------------------------------------- *
 * Savet: velicina slova po duzini (Ivan, 30.9.2026 — dug savet je prelazio preko
 * zaglavlja i dugmeta). Kratak ostaje krupan, dug se smanji dok ne stane.
 * ------------------------------------------------------------------------- */

/**
 * Prosecna sirina znaka (sa razmakom) u em za Plus Jakarta Sans SemiBold, sa malom
 * rezervom. PODESENO NA SNIMCIMA: pri 44 i 354 pt sirine savet od 72 znaka ide u
 * 6 redova, a od 141 znaka u 12 — model daje tacno toliko (`check:prica`, deo 10).
 */
export const ZNAK_EM = 0.53;
/** Prored u odnosu na velicinu (48 / 44). */
export const PRORED = 1.09;
/** Velicine za sliku price, od najvece; prva je ona koju savet ima kad staje. */
export const VELICINE_SAVETA = [44, 40, 36, 33, 30, 27, 24, 22, 20] as const;
/** Isto za karticu za deljenje (360 × 640). */
export const VELICINE_SAVETA_KARTICA = [39, 36, 33, 30, 27, 24, 22, 20, 18] as const;

/** Koliko redova tekst zauzme kad se lomi rec po rec (kao `Reci`), sa `uRedu` znakova po redu. */
export function redovaTeksta(tekst: string, uRedu: number): number {
  const u = Math.max(1, uRedu);
  let redova = 0;
  let duzina = 0; // znakova u tekucem redu
  for (const rec of reciZaPrelom(tekst)) {
    const d = rec.length;
    if (duzina > 0 && duzina + 1 + d <= u) { duzina += 1 + d; continue; }
    // Nov red; rec duza od reda zauzme vise redova.
    redova += Math.ceil(d / u);
    duzina = d % u || u;
  }
  return redova;
}

/** Visina sitnog natpisa ("Iz tumačenja tranzita …", 13/18) u `sirina` pt — jedan ili vise redova. */
export function visinaNatpisa(tekst: string, sirina: number, velicina = 13, prored = 18): number {
  return redovaTeksta(tekst, Math.floor(sirina / (velicina * ZNAK_EM))) * prored;
}

/** Najveca velicina iz `velicine` pri kojoj tekst staje u `sirina` × `visina` pt; inace najmanja. */
export function velicinaSaveta(
  tekst: string,
  sirina: number,
  visina: number,
  velicine: readonly number[] = VELICINE_SAVETA,
): { velicina: number; prored: number; redova: number } {
  const za = (v: number) => {
    const prored = Math.round(v * PRORED);
    return { velicina: v, prored, redova: redovaTeksta(tekst, Math.floor(sirina / (v * ZNAK_EM))) };
  };
  for (const v of velicine) {
    const r = za(v);
    if (r.redova * r.prored <= visina) return r;
  }
  return za(velicine[velicine.length - 1]);
}

/* ------------------------------------------------------------------------- *
 * Naslovna: ton tranzita
 * ------------------------------------------------------------------------- */

export const SKLADAN: Oblici = ['skladan', 'skladna', 'skladnih'];
export const MESOVIT: Oblici = ['mešovit', 'mešovita', 'mešovitih'];
export const NAPET: Oblici = ['napet', 'napeta', 'napetih'];

export type BrojTonova = { povoljno: number; mesovito: number; izazovno: number };

export function brojTonova(tonovi: readonly Tone[]): BrojTonova {
  const b: BrojTonova = { povoljno: 0, mesovito: 0, izazovno: 0 };
  for (const t of tonovi) b[t]++;
  return b;
}

/** "7 skladnih · 2 mešovita · 1 napet"; ton kog nema se ne pise. */
export function legendaTonova(b: BrojTonova): string {
  return ([
    [b.povoljno, SKLADAN],
    [b.mesovito, MESOVIT],
    [b.izazovno, NAPET],
  ] as const)
    .filter(([n]) => n > 0)
    .map(([n, o]) => `${n} ${mnozina(n, o)}`)
    .join(' · ');
}

/** "10 tranzita", "1 tranzit", "3 tranzita". */
export const brojTranzita = (n: number) => `${n} ${mnozina(n, TRANZIT)}`;

/* ------------------------------------------------------------------------- *
 * Naslovna: dvostruki tocak (tranzitna planeta spolja -> natalna tacka unutra)
 * ------------------------------------------------------------------------- */

/**
 * Tacka longitude `lon` na krugu poluprecnika `r` oko (`c`, `c`), u SVG koordinatama
 * (y nadole). Kao na natalnom tocku: `levo` (Ascendent) je na 9 sati, a zodijak
 * raste suprotno kazaljci. Bez vremena rodjenja `levo` je 0° (Ovan levo).
 */
export function tackaNaTocku(lon: number, levo: number, c: number, r: number): { x: number; y: number } {
  const f = ((180 + lon - levo) * Math.PI) / 180;
  return { x: c + Math.cos(f) * r, y: c - Math.sin(f) * r };
}

/* ------------------------------------------------------------------------- *
 * Tvoj dan: crtez ugla aspekta
 * ------------------------------------------------------------------------- */

/**
 * Dve tacke na krugu razmaknute tacno za ugao aspekta, simetricno oko vrha:
 * tranzitna levo, natalna desno (0° = obe na vrhu, 180° = levo i desno od sredine).
 * Uglovi su u stepenima, matematicki (0 = desno, 90 = gore).
 */
export function ugloviCrteza(ugaoAspekta: number): { tranzitna: number; natalna: number } {
  return { tranzitna: 90 + ugaoAspekta / 2, natalna: 90 - ugaoAspekta / 2 };
}

/** Tacka na krugu za ugao u stepenima (matematicki), u SVG koordinatama. */
export function tackaNaKrugu(ugao: number, cx: number, cy: number, r: number): { x: number; y: number } {
  const f = (ugao * Math.PI) / 180;
  return { x: cx + Math.cos(f) * r, y: cy - Math.sin(f) * r };
}

/* ------------------------------------------------------------------------- *
 * Ocene i Mesec
 * ------------------------------------------------------------------------- */

/** Najbolja ocena; pri istoj pobedjuje prva po redosledu oblasti. `null` za praznu listu. */
export function najbolja<T extends { ocena: number }>(ocene: readonly T[]): T | null {
  let b: T | null = null;
  for (const o of ocene) if (!b || o.ocena > b.ocena) b = o;
  return b;
}

/** Bolje nego juce — samo kad je jucerasnja ocena poznata. */
export const boljeNegoJuce = (danas: number, juce: number | null | undefined) =>
  typeof juce === 'number' && danas > juce;

/** Faza kao jedna od osam slicica: 0 mlad, 2 prva cetvrt, 4 pun, 6 poslednja cetvrt. */
export function fazaOsmina(ugao: number): number {
  const u = ((ugao % 360) + 360) % 360;
  return Math.round(u / 45) % 8;
}

/** Natpis trenutka "Tvog dana" uz "Najvažnije danas"; `null` kad tranzit samo traje. */
export const MOMENAT_NATPIS: Record<'egzaktan' | 'pocinje' | 'zavrsava' | 'traje', string | null> = {
  egzaktan: 'tačan danas',
  pocinje: 'počinje danas',
  zavrsava: 'poslednji dan',
  traje: null,
};

/* ------------------------------------------------------------------------- *
 * Putanje crteza (SVG `d`), da komponente samo crtaju
 * ------------------------------------------------------------------------- */

const f1 = (n: number) => n.toFixed(1);

/**
 * Podeoci zodijaka na tocku: svakih 5° longitude, duzi na 30° — granice znakova
 * stoje tamo gde zaista jesu u odnosu na Ascendent (`levo`).
 */
export function podeociTocka(levo: number, c: number, r: number): string {
  let d = '';
  for (let lon = 0; lon < 360; lon += 5) {
    const dug = lon % 30 === 0 ? 14 : 6;
    const a = tackaNaTocku(lon, levo, c, r);
    const b = tackaNaTocku(lon, levo, c, r - dug);
    d += `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;
  }
  return d;
}

/** Podeoci na krugu crteza ugla: lenjir od 5°, duzi na 30° (orijentacija je shematska, razmak je pravi). */
export function podeociKruga(cx: number, cy: number, r: number): string {
  let d = '';
  for (let u = 0; u < 360; u += 5) {
    const dug = u % 30 === 0 ? 10 : 4;
    const a = tackaNaKrugu(u, cx, cy, r);
    const b = tackaNaKrugu(u, cx, cy, r - dug);
    d += `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;
  }
  return d;
}

/** Luk od ugla `od` do ugla `do` (stepeni, matematicki), u smeru kazaljke kad je `od` > `do`. */
export function luk(cx: number, cy: number, r: number, od: number, doUgla: number): string {
  const a = tackaNaKrugu(od, cx, cy, r);
  const b = tackaNaKrugu(doUgla, cx, cy, r);
  const razlika = Math.abs(od - doUgla);
  if (razlika < 0.01) return '';
  const veliki = razlika > 180 ? 1 : 0;
  // SVG: y nadole, pa je smer kazaljke sweep = 1 kad ugao opada.
  const sweep = od > doUgla ? 1 : 0;
  return `M${f1(a.x)} ${f1(a.y)}A${r} ${r} 0 ${veliki} ${sweep} ${f1(b.x)} ${f1(b.y)}`;
}

/** Zraci iz loga: `n` linija oko sredine, naizmenicno kraci i duzi pocetak (kao gravira sunca). */
export function zraciPutanja(c: number, kratki: number, dugi: number, kraj: number, n = 48): string {
  let d = '';
  for (let k = 0; k < n; k++) {
    const u = (k * 360) / n;
    const a = tackaNaKrugu(u, c, c, k % 2 ? dugi : kratki);
    const b = tackaNaKrugu(u, c, c, kraj);
    d += `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;
  }
  return d;
}

/** Ukupna duzina zraka (za crtanje potezom — svi zraci jedan za drugim). */
export function zraciDuzina(kratki: number, dugi: number, kraj: number, n = 48): number {
  return Math.ceil(n / 2) * (kraj - kratki) + Math.floor(n / 2) * (kraj - dugi);
}

/* ------------------------------------------------------------------------- *
 * VIDEO PRICE (Ivan, 30.9.2026): cela prica kao MP4, kadar po kadar.
 * Crta ga `components/prica/video-radionica.tsx` — ovde je samo raspored.
 * ------------------------------------------------------------------------- */

export const VIDEO = {
  fps: 30,
  sirina: 1080,
  visina: 1920,
  /** H.264 oko 5 Mb/s: Instagram preporucuje 3,5—5 za 1080p pricu, a vise ionako preracuna. */
  bitrate: 5_000_000,
  /** Prelaz krugom, isti kao kad prica sama ide dalje (`Otkrivanje` u `app/prica.tsx`). */
  prelaz: 750,
  /** Instagram prica prima najvise 60 s u jednom komadu; 2 s rezerve. */
  najduze: 58_000,
  /** Kad se prica skracuje, nijedna slika ne pada ispod ovoga. */
  najkrace: 3500,
  /** Zavrsni kadar (logo i sajt, Ivan 30.9.2026) — sa prelazom krugom; ne skracuje se. */
  zavrsni: 2200,
  /** Odakle se krug siri (udeo sirine i visine) — kao kad prica sama ide dalje. */
  krugX: 0.85,
  krugY: 0.55,
} as const;

export type RasporedVidea = {
  /** Pocetak svake slike u videu (ms). */
  pocetak: number[];
  /** Trajanje svake slike u videu (ms). */
  trajanje: number[];
  ukupno: number;
  kadrova: number;
};

/**
 * Slike idu istim redom i istim trajanjem kao u prici (`trajanjeSlike`); ako je zbir
 * duzi od `najduze`, sve se skrate srazmerno, ali nijedna ispod `najkrace`.
 * `zavrsni` (ms) je poslednji kadar posle slika (logo); njegovo vreme se oduzme od
 * `najduze` unapred i ne skracuje se.
 */
export function rasporedVidea(trajanja: readonly number[], zavrsni = 0): RasporedVidea {
  const najduze = VIDEO.najduze - zavrsni;
  let trajanje = trajanja.map((d) => Math.max(VIDEO.najkrace, d));
  for (let krug = 0; krug < 4; krug++) {
    const zbir = trajanje.reduce((a, b) => a + b, 0);
    if (zbir <= najduze) break;
    // Skracuju se samo one koje jos mogu; najkrace stoje.
    const mogu = trajanje.filter((d) => d > VIDEO.najkrace).reduce((a, b) => a + b, 0);
    const vec = zbir - mogu;
    const k = (najduze - vec) / mogu;
    trajanje = trajanje.map((d) => (d > VIDEO.najkrace ? Math.max(VIDEO.najkrace, Math.floor(d * k)) : d));
  }
  if (zavrsni > 0) trajanje = [...trajanje, zavrsni];
  const pocetak: number[] = [];
  let t = 0;
  for (const d of trajanje) { pocetak.push(t); t += d; }
  return { pocetak, trajanje, ukupno: t, kadrova: Math.ceil((t * VIDEO.fps) / 1000) };
}

export type KadarVidea = {
  /** Slika na vrhu i njen sat (ms od njenog pocetka). */
  gore: { i: number; sat: number };
  /** Prethodna slika, dok se gornja otkriva krugom; inace `null`. */
  dole: { i: number; sat: number } | null;
  /** Koliko je prelaza proslo, 0—1 (bez ublazavanja); 1 = gornja slika je cela. */
  prelaz: number;
};

/** Sta je na kadru `redni`: gornja slika, ispod nje prethodna dok traje prelaz, i koliko je prelaza proslo. */
export function kadarVidea(r: RasporedVidea, redni: number): KadarVidea {
  const t = (redni * 1000) / VIDEO.fps;
  let i = 0;
  while (i + 1 < r.pocetak.length && r.pocetak[i + 1] <= t) i++;
  const sat = t - r.pocetak[i];
  if (i > 0 && sat < VIDEO.prelaz) {
    return { gore: { i, sat }, dole: { i: i - 1, sat: t - r.pocetak[i - 1] }, prelaz: sat / VIDEO.prelaz };
  }
  return { gore: { i, sat }, dole: null, prelaz: 1 };
}

/** Poluprecnik kruga iz (x, y) koji pokrije ceo pravougaonik w × h (+2, bez ivice od zaokruzivanja). */
export function poluprecnikKruga(w: number, h: number, x: number, y: number): number {
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 2;
}
