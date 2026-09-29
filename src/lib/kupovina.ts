/**
 * Kupovina pitanja — mesto gde ce stajati RevenueCat (faza 4, JOS NIJE UKLJUCENO).
 *
 * Kad stigne:
 *   - proizvodi `question` i `question_member` (consumable), cene SAMO iz
 *     RevenueCat Offerings — u kod se cena nikad ne upisuje;
 *   - Premium korisnik (`useEntitlement()` — kupovina ILI poklon) vidi
 *     `question_member`; RevenueCat za poklon ne zna, zato ne njegov entitlement;
 *   - App User ID = id naloga iz Supabase-a;
 *   - placanje potvrdjuje WEBHOOK na serveru (nacrt -> paid). Aplikacija nikad
 *     sama ne upisuje da je placeno (pravilo 8).
 *
 * Do tada `kupiPitanje` iskreno kaze da placanje ne postoji, a cena se ne
 * prikazuje. Pitanje moze da se posalje samo kreditom (`admin.daj_pitanje`).
 */

export type IshodKupovine =
  /** Prodavnica je naplatila; webhook ce nacrt prebaciti u `paid`. */
  | 'placeno'
  /** Korisnik je zatvorio prozor za placanje. Nije greska. */
  | 'odustao'
  /** Ceka odobrenje (roditelj, banka). */
  | 'ceka'
  | 'greska'
  /** Placanje jos nije ugradjeno u aplikaciju. */
  | 'nedostupno';

export async function kupiPitanje(_pitanjeId: string, _premium: boolean): Promise<IshodKupovine> {
  return 'nedostupno';
}

/**
 * PRIVREMENO (Ivan, 29.9.2026): probna cena SAMO u razvoju (`__DEV__`), da se vidi
 * kako stoji na ekranu. U buildu za prodavnicu se ne prikazuje nista dok cena ne
 * stigne iz RevenueCat Offerings — tada ovo ide napolje.
 */
// 19,99 € za sve, bez popusta za Premium (Ivan, 29.9.2026).
const PROBNA_CENA = { obicna: '19,99 €', clanska: '19,99 €' } as const;

/** Cena iz prodavnice, npr. "14,99 €". `null` dok RevenueCat ne stigne (osim probne u razvoju). */
export function useCenaPitanja(premium: boolean): string | null {
  if (__DEV__) return premium ? PROBNA_CENA.clanska : PROBNA_CENA.obicna;
  return null;
}
