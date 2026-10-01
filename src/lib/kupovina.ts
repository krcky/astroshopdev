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
import { tr } from '@/i18n/jezik';

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
 * PRIVREMENO (Ivan, 29.9.2026): probne cene dok RevenueCat ne stigne, da se vidi
 * kako stoje na ekranu — u razvoju (`__DEV__`) i u PROBNOM buildu sa
 * `EXPO_PUBLIC_PROBNE_CENE=1` (lokalni `.env` za build iz Xcode-a, EAS profili
 * `development` i `preview`). Build za prodavnicu (`production`) ih nema: tamo cena
 * stize SAMO iz RevenueCat Offerings — tada ovo ide napolje.
 * Do 29.9.2026 je vazilo samo `__DEV__`, pa Release build na telefonu nije imao cenu.
 */
const PROBNE_CENE = __DEV__ || process.env.EXPO_PUBLIC_PROBNE_CENE === '1';

// 19,99 € za sve, bez popusta za Premium (Ivan, 29.9.2026).
const PROBNA_CENA = { obicna: '19,99 €', clanska: '19,99 €' } as const;

/** Cena iz prodavnice, npr. "14,99 €". `null` dok RevenueCat ne stigne (osim probne). */
export function useCenaPitanja(premium: boolean): string | null {
  if (PROBNE_CENE) return premium ? PROBNA_CENA.clanska : PROBNA_CENA.obicna;
  return null;
}

/* ------------------------------------------------------------------------- *
 * PREMIUM PRETPLATA (paywall `/premium`, Ivan 29.9.2026) — JOS NIJE UKLJUCENO.
 *
 * Kad stigne RevenueCat: paketi iz tekuceg Offering-a (`$rc_annual`,
 * `$rc_monthly`), cena i proba iz `product` (priceString, price, introPrice) —
 * u kod se cena nikad ne upisuje. Pravo pristupa i dalje upisuje SAMO webhook
 * na serveru (pravilo 8); aplikacija posle kupovine samo ponovo procita pravo.
 * ------------------------------------------------------------------------- */

export type PaketPremium = {
  id: 'godisnje' | 'mesecno';
  /** Cena kako je prodavnica formatira: "49,99 €". */
  cena: string;
  /** Broj, samo za racun ustede i cene po mesecu. */
  iznos: number;
  /** Valuta za "4,17 € mesečno" (ISO, npr. "EUR"). */
  valuta: string;
  /** Besplatna proba u danima; `null` = paket nema probu. */
  probaDana: number | null;
};

/**
 * PRIVREMENO: probni paketi pod istim uslovom kao probna cena pitanja
 * (`PROBNE_CENE`), da se vidi raspored. Brojevi nisu odluka o ceni — prava cena
 * stize iz App Store Connect-a / Play Console-a.
 */
const PROBNI_PAKETI: PaketPremium[] = [
  { id: 'godisnje', cena: '49,99 €', iznos: 49.99, valuta: 'EUR', probaDana: 7 },
  { id: 'mesecno', cena: '5,99 €', iznos: 5.99, valuta: 'EUR', probaDana: null },
];

/** Paketi iz prodavnice; `null` dok RevenueCat ne stigne (osim probnih). */
export function usePaketiPremium(): PaketPremium[] | null {
  if (PROBNE_CENE) return PROBNI_PAKETI;
  return null;
}

export async function kupiPremium(_paket: PaketPremium['id']): Promise<IshodKupovine> {
  return 'nedostupno';
}

export type IshodVracanja = 'vraceno' | 'nema' | 'greska' | 'nedostupno';

/** "Vrati kupovine" — Apple ga trazi na svakom paywall-u. */
export async function vratiKupovine(): Promise<IshodVracanja> {
  return 'nedostupno';
}

/** Koliko je godisnje jeftinije od 12 mesecnih, zaokruzeno na ceo procenat; `null` kad nije jeftinije. */
export function ustedaGodisnje(godisnje: number, mesecno: number): number | null {
  if (!(godisnje > 0) || !(mesecno > 0)) return null;
  const u = Math.round((1 - godisnje / (mesecno * 12)) * 100);
  return u > 0 ? u : null;
}

/** "4,17 €" — godisnja cena podeljena na 12, u valuti paketa, zapisom jezika. */
export function cenaPoMesecu(godisnje: number, valuta: string): string {
  // Na dole, da "mesecno" nikad ne izgleda jeftinije nego sto jeste zaokruzivanjem navise.
  return formatCena(Math.floor((godisnje / 12) * 100) / 100, valuta);
}

/**
 * PUNA CENA GODINE bez popusta (Ivan, 30.9.2026) — 12 mesecnih rata, precrtana na
 * godisnjem paketu. Racuna se iz cene MESECNOG paketa iz prodavnice, kao i
 * "Uštedi N%": Apple dozvoljava precrtanu cenu samo kad je stvarna, a ova jeste —
 * toliko bi korisnik platio godinu mesecnim paketom. `null` kad godisnje nije jeftinije.
 */
export function cenaBezPopusta(godisnje: number, mesecno: number, valuta: string): string | null {
  if (ustedaGodisnje(godisnje, mesecno) === null) return null;
  return formatCena(Math.round(mesecno * 12 * 100) / 100, valuta);
}

/** Iznos u valuti paketa, zapisom jezika (`gramatika.locale`): "71,88 €". */
function formatCena(iznos: number, valuta: string): string {
  try {
    return new Intl.NumberFormat(tr().gramatika.locale, { style: 'currency', currency: valuta }).format(iznos);
  } catch {
    // Android Hermes ume da nema punu Intl podrsku — tada rucno, decimalni zarez.
    return `${iznos.toFixed(2).replace('.', ',')} ${valuta === 'EUR' ? '€' : valuta}`;
  }
}
