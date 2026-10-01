/**
 * Sta se desava odmah posle uspesne prijave — zajednicko za lozinku i kod.
 *
 * PRAVILO: server pobedjuje. Ako korisnik vec ima kartu gore, ona se povlaci
 * dole. Draft se salje na server SAMO ako gore jos nista ne postoji.
 *
 * Bez toga bi se desilo ovo: neko zapocne onboarding na tudjem telefonu, pa se
 * ulancano prijavi postojecim nalogom — i njegova prava karta bude prepisana
 * podacima koje je uneo neko drugi.
 *
 * "NAPRAVI NALOG" SA EMAILOM KOJI VEC IMA KARTU (Ivan, 29.9.2026): ovde se ne
 * stize. Ekran sa kodom (`?nov=1`, iz reveal-a) posle potvrde kaze da je email
 * zauzet i nudi drugi email ili ulazak u postojeci nalog. Ranije je tok tiho
 * usao u stari nalog, a upravo uneti podaci su nestali bez ijedne poruke.
 * Pita se tek POSLE koda: pre njega bi odgovor "zauzeto" svakome otkrivao ciji
 * email koristi aplikaciju; posle koda je jasno da je email njegov.
 */
import { useDraft } from '@/store/draft';
import { placeFields, useProfileStore, type Profile } from '@/store/profile';
import { pullProfile, pushProfile } from '@/lib/sync';
import { tr } from '@/i18n/jezik';

/** Privremeno ime dok korisnik ne unese svoje — baza ne prima prazno. */
export function initialName(email: string): string {
  const local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : tr().onboarding.podrazumevanoIme;
}

export type SignupOutcome =
  /** Karta je vec postojala na serveru — idi pravo u aplikaciju. */
  | 'existing'
  /** Nova karta je upisana iz drafta — sledi korak sa imenom. */
  | 'created'
  /** Nema ni gore ni dole — korisnik mora da unese podatke o rodjenju. */
  | 'incomplete';

/** Karta sa servera postaje lokalna, a draft se baca. */
export function adoptRemote(remote: Profile) {
  useProfileStore.getState().setProfile(remote);
  useDraft.getState().reset();
}

/** Baca ako server ne odgovori (`pullProfile`) — tada se nista ne upisuje. */
export async function completeSignup(userId: string, email: string): Promise<SignupOutcome> {
  const remote = await pullProfile(userId);
  if (remote) {
    adoptRemote(remote);
    return 'existing';
  }

  const d = useDraft.getState();
  if (!d.date || !d.city) return 'incomplete';

  const profile: Profile = {
    name: initialName(email),
    birth: d.date,
    time: d.time,
    ...placeFields(d.city),
  };

  useProfileStore.getState().setProfile(profile);
  // Neuspeo upis BACA (30.9.2026): do tada se tiho isao dalje — karta je ostajala
  // samo na telefonu, a draft se brisao. `code.tsx` korak ponavlja; draft ostaje
  // dok upis ne prodje, pa ponovni pokusaj ima sta da posalje.
  const greska = await pushProfile(userId, profile);
  if (greska) throw greska;
  useDraft.getState().reset();
  return 'created';
}

/** Kuda ici posle prijave. */
export function routeAfterSignup(outcome: SignupOutcome): '/home' | '/name' | '/date' {
  if (outcome === 'existing') return '/home';
  if (outcome === 'created') return '/name';
  // Nalog bez karte (npr. "Već imam nalog" sa novim emailom): odmah unos podataka o rodjenju.
  // Ne preko kapije — ona prijavljenog bez karte salje na dobrodoslicu (pravilo 11).
  return '/date';
}
