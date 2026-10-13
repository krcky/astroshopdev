/**
 * Poziv "Nebo sada na početnom ekranu" na tabu "Nebo" (Ivan, 13.10.2026): kad se kartica pokazuje.
 *
 * Ne pri prvom dolasku na tab — korisnik tada jos ne zna sta je krug — nego od DRUGOG.
 * Ko je karticu sklonio (X) ili widget vec ima, ne vidi je vise. Uputstvo ostaje u listu `/widget-uputstvo`.
 */

/** Koliko ranijih poseta tabu "Nebo" treba pre nego sto se kartica pokaze. */
export const POSETE_PRE_POZIVA = 1;

export function trebaPozivZaWidget(s: {
  /** Widget postoji u ovom buildu. */
  imaWidget: boolean;
  /** Zavrsene ranije posete tabu "Nebo". */
  posete: number;
  /** Korisnik je sklonio karticu. */
  sklonjeno: boolean;
  /** Koliko widgeta vec ima; `null` = jos se ne zna (kartica ceka, da ne bljesne pa nestane). */
  naEkranu: number | null;
}): boolean {
  if (!s.imaWidget || s.sklonjeno || s.naEkranu === null) return false;
  return s.naEkranu === 0 && s.posete >= POSETE_PRE_POZIVA;
}
