/**
 * Oblik snimka karte koji ide uz pitanje astrologu (`pitanja.karta` u bazi).
 *
 * Samo tipovi, BEZ IJEDNOG UVOZA: isti fajl cita i panel za astrologa
 * (`panel/`), koji ne sme da povuce kod aplikacije. Pravi ga `snimakKarte`
 * u `lib/pitanja.ts`.
 *
 * Polja se ne brisu i ne preimenuju — stara pitanja ostaju u bazi u starom
 * obliku. Nova polja dobijaju novu `verzija`.
 */

export type SnimakPolozaj = { znak: string; stepen: string };

export type SnimakKarte = {
  verzija: 1;
  /** Ime iz profila u trenutku slanja. */
  ime: string;
  rodjenje: {
    /** "1990-07-10" */
    datum: string;
    /** "14:30" ili null kad korisnik ne zna vreme rodjenja. */
    vreme: string | null;
    mesto: string;
    zemlja: string;
    sirina: number;
    duzina: number;
    /** IANA zona, npr. "Europe/Belgrade". */
    zona: string;
    /** Trenutak rodjenja u UTC (ISO). */
    utc: string;
  };
  /**
   * Pomeraj zone za taj datum nije pouzdan — karta se tada NE racuna (pravilo 4)
   * i sva polja ispod su prazna. Astrolog ima podatke o rodjenju i racuna sam.
   */
  zonaNepouzdana: boolean;
  /** Bez vremena rodjenja nema ascendenta ni kuca, a Mesec je nesiguran. */
  vremeNepoznato: boolean;
  sistemKuca: 'placidus' | 'whole-sign' | null;
  planete: {
    kljuc: string;
    ime: string;
    znak: string;
    /** "12° 34' Bik" */
    stepen: string;
    kuca: number | null;
    retro: boolean;
  }[];
  ascendent: SnimakPolozaj | null;
  mc: SnimakPolozaj | null;
  /** Kuspide 1—12, redom. */
  kuce: SnimakPolozaj[] | null;
  aspekti: { a: string; aspekt: string; b: string; orbis: string }[];
};
