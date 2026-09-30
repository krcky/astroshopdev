/**
 * Druge osobe (Ivan, 29.9.2026): partner, dete, roditelj, prijatelj — njihova
 * natalna karta i tranziti, i pitanje astrologu o njima.
 *
 * Cist racun, bez RN uvoza (pravilo 6). Server: `supabase/osobe.sql`. Stanje:
 * `store/osobe.ts`. Upiti: `lib/osobe-api.ts`. Provera: `npm run check:osobe`.
 *
 * Osoba je profil kao korisnikov (`Profile`) — ista polja, isti `resolveProfile`,
 * ista pravila 4 i 5. Karta se racuna na telefonu; tekstovi tumacenja stizu po
 * kljucu (`contentKey`), pa server ne zna o kome je rec.
 */
import { BESPLATNO, PREMIUM } from '@/lib/pristup';
import type { Profile } from '@/store/profile';

export type OdnosKljuc = 'partner' | 'dete' | 'roditelj' | 'brat_sestra' | 'prijatelj' | 'drugo';

/**
 * "Ko ti je" — ponudjeni odnosi, redom. Kljucevi su u bazi (`osobe.odnos`,
 * check); naziv je bez roda gde god moze, jer pol ne pitamo.
 */
export const ODNOSI: readonly { key: OdnosKljuc; naziv: string }[] = [
  { key: 'partner', naziv: 'Partner' },
  { key: 'dete', naziv: 'Dete' },
  { key: 'roditelj', naziv: 'Roditelj' },
  { key: 'brat_sestra', naziv: 'Brat ili sestra' },
  { key: 'prijatelj', naziv: 'Prijatelj' },
  { key: 'drugo', naziv: 'Neko drugi' },
];

/** Polje osobe koje se menja na listu odozdo (`/rodjenje-polje?polje=`, tabele u `/osoba-uredi` i na listu "Nalog"). */
export type PoljeOsobe = 'ime' | 'odnos' | 'datum' | 'vreme' | 'mesto';

/** Napomena ispod koraka unosa druge osobe (umesto "tvoju kartu" iz onboardinga). */
export const NAPOMENA_PODACI = 'Podatke o rođenju vidiš samo ti. Ne delimo ih i ne prodajemo.';

/** Naziv odnosa za prikaz; "Neko drugi" i neodabran nemaju sta da kazu — null. */
export function nazivOdnosa(k: OdnosKljuc | null | undefined): string | null {
  if (!k || k === 'drugo') return null;
  return ODNOSI.find((o) => o.key === k)?.naziv ?? null;
}

export type Osoba = Profile & {
  id: string;
  odnos: OdnosKljuc | null;
  /** ISO; redosled dodavanja odlucuje koja ostaje otvorena bez Premium-a. */
  createdAt: string;
};

/** Najvise osoba na nalogu. Istu brojku drzi baza (`osobe.sql`). */
export function granicaOsoba(premium: boolean): number {
  return premium ? PREMIUM.osobe : BESPLATNO.osobe;
}

/** Moze li se dodati jos jedna osoba. */
export function mozeDaDoda(broj: number, premium: boolean): boolean {
  return broj < granicaOsoba(premium);
}

/** Osobe redom dodavanja (najstarija prva); isti datum — po id-u, da redosled bude stalan. */
export function poRedu<T extends Pick<Osoba, 'id' | 'createdAt'>>(osobe: readonly T[]): T[] {
  return [...osobe].sort((a, b) => (a.createdAt === b.createdAt ? (a.id < b.id ? -1 : 1) : a.createdAt < b.createdAt ? -1 : 1));
}

/**
 * Koje su osobe otvorene: prvih `granicaOsoba` po redu dodavanja. Premium koji je
 * istekao ne brise nikoga — visak ostaje na listi pod katancem (Ivan, 29.9.2026).
 */
export function otvoreneOsobe(osobe: readonly Pick<Osoba, 'id' | 'createdAt'>[], premium: boolean): Set<string> {
  return new Set(poRedu(osobe).slice(0, granicaOsoba(premium)).map((o) => o.id));
}

/**
 * Greska servera ili mreze -> recenica za korisnika: sta se desilo, pa sta moze
 * (copywriter-sr). Upis osobe ide samo preko servera, pa bez mreze ne ide.
 */
export function porukaOsobe(poruka: string | undefined | null): string {
  const m = poruka ?? '';
  if (/granica_osoba/.test(m)) return 'Za još osoba potreban je Premium.';
  if (/nema_naloga|JWT/i.test(m)) return 'Prijava je istekla. Zatvori aplikaciju i otvori je ponovo.';
  if (/fetch|network|timed? ?out/i.test(m)) return 'Nema veze sa serverom. Ništa nije sačuvano — probaj kad se internet vrati.';
  // U razvoju i tacna poruka servera — bez nje se kvar ne vidi.
  const razvoj = typeof __DEV__ !== 'undefined' && __DEV__ ? ` (${m})` : '';
  return `Nije sačuvano. Probaj ponovo za minut.${razvoj}`;
}
