/**
 * Uvodna animacija pri pokretanju (`components/uvod.tsx`) — sav racun, bez
 * React Native-a, da bi se proveravao u Node-u (`npm run check:uvod`).
 *
 * Tok (Ivan, 28.9.2026, varijanta "Krug se otvori", po uzoru na Luma):
 *
 *   sistemski splash   siva pozadina + miran krug loga, isti kao prvi kadar uvoda
 *   vrtenje            krug se zavrti brzo, pa uspori i vrti se polako DOK SE CEKA
 *                      (logo-krug-uvod.json); na vrhu se pojavi preliv — isti kao
 *                      na pocetnoj
 *   zalet              kad je aplikacija spremna: krug se malo skupi
 *   otvaranje          krug loga se pretopi, a iz sredine se siri krug-prozor
 *                      BEZ OBODA, kroz koji je vec aplikacija
 *
 * Istog dana odbaceno (Ivan), ne vracati:
 *   - ljubicasti sjaj IZA kruga — preliv ide gore, kao na pocetnoj;
 *   - dvostruki prsten loga kao ivica prozora koji se siri — prozor je bez oboda;
 *   - talas znakova oko kruga dok se ceka (pokret iz loadera sa sajta) — dok se
 *     ceka, krug se samo vrti.
 *
 * Funkcije koje se zovu iz animacije nose 'worklet' — izvrsavaju se na niti za
 * pokret, svaki kadar.
 */

/**
 * Precnik kruga u uvodu, u pt. MORA biti isti kao `imageWidth` sistemskog
 * splash-a u `app.json` — splash se skloni u trenutku kad se uvod iscrta, pa bi
 * razlika bila skok na prvom kadru. Drzi ih `check:uvod`.
 */
export const UVOD_KRUG = 180; // Ivan, 28.9.2026: 1,5x veci (bilo 120)

/** Trajanja, u ms. Ukupno bez cekanja: vrtenje + zalet + otvaranje = 1,27 s (Luma ~1,2 s). */
export const UVOD_MS = {
  /** Najkrace vrtenje pre zaleta — i kad je aplikacija spremna odmah. Preliv se za to vreme pojavi. */
  vrtenje: 700,
  /** Krug se skupi pre otvaranja. */
  zalet: 150,
  /** Prozor se rasiri preko ekrana. */
  otvaranje: 420,
  /**
   * Posle "spremno" (pismo, sesija, profil): da odredisni ekran stigne da se
   * iscrta pre nego sto se prozor otvori, inace bi se kroz krug video prazan ekran.
   */
  smirenje: 150,
  /**
   * Android sklanja sistemski splash PRETAPANJEM (iOS trenutno), a sistemska ikonica
   * na Androidu 12+ nije nuzno iste velicine kao krug. Pretapanje je zato kratko:
   * krug u prvih 150 ms tek krece da se vrti, pa se dve kopije ne vide.
   */
  androidSplash: 150,
  /**
   * Rezerva ako Lottie nikad ne javi da je ucitan — uvod ne sme da zavisi od toga.
   * Posle ovoliko od prvog rasporeda splash se sklanja i uvod krece.
   */
  lottieRezerva: 500,
} as const;

/** Skala kruga na kraju zaleta. */
export const ZALET = 0.9;

/**
 * Vrtenje u `logo-krug-uvod.json` (pravi ga `scripts/logo/build-krug-uvod.py`, isti
 * brojevi): ubrzanje za `ubrzanje` kadrova do jednog kruga na `brzoS` sekundi, brzo
 * do kadra `brzoDo`, pa usporavanje za `usporavanje` kadrova do jednog kruga na
 * `sporoS` sekundi, i tako do kraja kompozicije (60 s). Ivan, 29.9.2026: "malo nek
 * se vrti brzo pa nek uspori" — bilo je stalno brzo.
 *
 * Ceo okret je u JSON-u, ne u petlji iz JS-a, jer je JS zauzet crtanjem aplikacije
 * bas dok se ceka. `check:uvod` cita JSON i poredi ga sa ovim.
 */
export const LOTTIE_VRTENJE = { fps: 25, ubrzanje: 12, brzoS: 1, brzoDo: 30, usporavanje: 25, sporoS: 6 } as const;

/** Pomeraj sadrzaja aplikacije: pocinje malo uvecan i "sleze" dok se prozor otvara (kao Luma). */
export const ZUM_SADRZAJA = 1.05;

/**
 * Krug loga pri otvaranju: pretopi se dok malo raste (od `ZALET` do ovoliko) — ne
 * zumira se preko ekrana, jer ima dvostruki obod koji tada izgleda kao ivica prozora.
 */
export const KRUG_NESTAJE = { rast: 1.35, udeo: 0.35 } as const;

/**
 * Preliv na vrhu uvoda (isti kao na pocetnoj) pocinje da bledi na ovom udelu
 * otvaranja: tada prozor stize do njega, a ispod je preliv same aplikacije — da
 * se dva ne saberu u jaci.
 */
export const PRELIV_GASENJE = 0.45;

/** Do kog poluprecnika se prozor siri: dok ne pokrije ceo ekran, ukljucujuci uglove. */
export function krajRupe(sirina: number, visina: number): number {
  return Math.hypot(sirina / 2, visina / 2) + 2;
}

/**
 * Poluprecnik prozora ka aplikaciji na udelu otvaranja `o` (0..1).
 *
 * U prvoj petini raste iz nule do velicine kruga loga (dok se krug pretapa, pa
 * rupa ne iskoci naglo), a dalje ubrzava do `kraj` — prozor "izleti" van ekrana.
 */
export function rupaPoluprecnik(o: number, krug: number, kraj: number): number {
  'worklet';
  if (o <= 0) return 0;
  const k = Math.min(1, o);
  const ulaz = Math.min(1, k / 0.2);
  const pocetak = krug * 0.8;
  return ulaz * (pocetak + (kraj - pocetak) * k * k);
}
