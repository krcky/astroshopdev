/**
 * Katalog "Proizvoda" na tabu "Ostalo" (Ivan, 14.10.2026): ISTA lista za ono sto se kupuje u aplikaciji i ono sto
 * vodi na sajt. Ovde je samo STRUKTURA (id, vrsta, adresa, cena sa sajta); imena i opisi su u recniku
 * (`i18n/<jezik>/ostalo.ts`, pravilo 26), a cene u aplikaciji dolaze iz prodavnice (`lib/kupovina.ts`, pravilo 8 —
 * u kod se ne upisuju).
 *
 * VRSTE: `sajt` = kupovina se zavrsava na astroshop.rs (fizicki proizvod, razgovor uzivo — Apple 3.1.3(d) i (e)
 * dozvoljavaju placanje mimo App Store-a); `aplikacija` = tok u aplikaciji (Premium, natalna karta, pitanje,
 * widget, sat). DIGITALNI proizvodi sa sajta (PDF natalna karta, art print) NAMERNO nisu ovde: digitalni sadrzaj
 * mora kroz kupovinu u aplikaciji (3.1.1), a PDF natalne karte ionako pokriva "Tumacenje natalne karte".
 *
 * Cene sa sajta su u RSD i kopirane su sa astroshop.rs (13.10.2026) — menjaju se ovde kad se promene na sajtu.
 */

export type ProizvodId =
  | 'widget' | 'premium' | 'natalna' | 'sat' | 'pitanje'
  | 'narukvica' | 'konsultacije30' | 'konsultacije90';

export type Proizvod = {
  id: ProizvodId;
  /** `sajt`: kupovina se zavrsava na astroshop.rs (strelica u redu); `aplikacija`: tok u aplikaciji. */
  vrsta: 'aplikacija' | 'sajt';
  /** Strana proizvoda na sajtu (samo `sajt`). */
  url?: string;
  /** Cena sa sajta, RSD; `stara` je precrtana. */
  cenaSajta?: { cena: string; stara?: string };
  /** Jos nije u prodavnici: ekran proizvoda kaze "stize uskoro" i nema dugmeta za kupovinu. */
  uskoro?: boolean;
};

/** Redosled je redosled u listi: prvo ono u aplikaciji, pa ono sto vodi na sajt (Ivan, 14.10.2026). */
export const PROIZVODI: readonly Proizvod[] = [
  { id: 'widget', vrsta: 'aplikacija' },
  { id: 'premium', vrsta: 'aplikacija' },
  { id: 'natalna', vrsta: 'aplikacija' },
  { id: 'sat', vrsta: 'aplikacija', uskoro: true },
  { id: 'pitanje', vrsta: 'aplikacija' },
  {
    id: 'narukvica', vrsta: 'sajt', url: 'https://astroshop.rs/proizvod/astro-bracelet/',
    cenaSajta: { cena: '14.990 RSD', stara: '17.990 RSD' },
  },
  {
    id: 'konsultacije30', vrsta: 'sajt', url: 'https://astroshop.rs/proizvod/astroloske-konsultacije-30-min/',
    cenaSajta: { cena: '12.000 RSD' },
  },
  {
    id: 'konsultacije90', vrsta: 'sajt', url: 'https://astroshop.rs/proizvod/astroloske-konsultacije-90-min/',
    cenaSajta: { cena: '24.000 RSD' },
  },
];

export function proizvodPoId(id: string | undefined): Proizvod | undefined {
  return PROIZVODI.find((p) => p.id === id);
}
