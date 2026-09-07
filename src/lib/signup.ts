/**
 * Sta se desava odmah posle uspesne prijave — zajednicko za lozinku i kod.
 *
 * PRAVILO: server pobedjuje. Ako korisnik vec ima kartu gore, ona se povlaci
 * dole. Draft se salje na server SAMO ako gore jos nista ne postoji.
 *
 * Bez toga bi se desilo ovo: neko zapocne onboarding na tudjem telefonu, pa se
 * ulancano prijavi postojecim nalogom — i njegova prava karta bude prepisana
 * podacima koje je uneo neko drugi.
 */
import { useDraft } from '@/store/draft';
import { useProfileStore, type Profile } from '@/store/profile';
import { pullProfile, pushProfile } from '@/lib/sync';

/** Privremeno ime dok korisnik ne unese svoje — baza ne prima prazno. */
export function initialName(email: string): string {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Ti';
}

export type SignupOutcome =
  /** Karta je vec postojala na serveru — idi pravo u aplikaciju. */
  | 'existing'
  /** Nova karta je upisana iz drafta — sledi korak sa imenom. */
  | 'created'
  /** Nema ni gore ni dole — korisnik mora da unese podatke o rodjenju. */
  | 'incomplete';

export async function completeSignup(userId: string, email: string): Promise<SignupOutcome> {
  const remote = await pullProfile(userId);
  if (remote) {
    useProfileStore.getState().setProfile(remote);
    useDraft.getState().reset();
    return 'existing';
  }

  const d = useDraft.getState();
  if (!d.date || !d.cityName) return 'incomplete';

  const profile: Profile = {
    name: initialName(email),
    birth: d.date,
    time: d.time,
    cityName: d.cityName,
  };

  useProfileStore.getState().setProfile(profile);
  await pushProfile(userId, profile);
  useDraft.getState().reset();
  return 'created';
}

/** Kuda ici posle prijave. */
export function routeAfterSignup(outcome: SignupOutcome): '/home' | '/name' | '/' {
  if (outcome === 'existing') return '/home';
  if (outcome === 'created') return '/name';
  return '/'; // kapija ce poslati na unos podataka o rodjenju
}
