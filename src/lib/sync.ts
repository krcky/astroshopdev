/**
 * Sinhronizacija profila izmedju uredjaja i servera.
 *
 * PRAVILO ZA SUKOB: ako server ima profil, server pobedjuje. On je zajednicki
 * za sve uredjaje, a lokalna kopija je samo kes. Lokalni profil se salje gore
 * SAMO kad na serveru jos nista ne postoji — tipicno kad neko prvo prodje
 * onboarding pa tek onda napravi nalog.
 */
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/store/profile';

/** Podaci o rodjenju u bazi — isti oblik u `profiles` i `osobe` (`supabase/osobe.sql`). */
export type RodjenjeRed = {
  name: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number | null;
  city_id: number | null;
  city_name: string;
  latitude: number | null;
  longitude: number | null;
  time_zone: string | null;
};

export const profilIzReda = (r: RodjenjeRed): Profile => ({
  name: r.name,
  birth: { year: r.birth_year, month: r.birth_month, day: r.birth_day },
  time: r.birth_hour !== null && r.birth_minute !== null
    ? { hour: r.birth_hour, minute: r.birth_minute }
    : null,
  cityId: r.city_id ?? 0,
  cityName: r.city_name,
  latitude: r.latitude ?? undefined as unknown as number,
  longitude: r.longitude ?? undefined as unknown as number,
  timeZone: r.time_zone ?? undefined as unknown as string,
});

export const redIzProfila = (p: Profile): RodjenjeRed => ({
  name: p.name,
  birth_year: p.birth.year,
  birth_month: p.birth.month,
  birth_day: p.birth.day,
  birth_hour: p.time?.hour ?? null,
  birth_minute: p.time?.minute ?? null,
  city_id: p.cityId,
  city_name: p.cityName,
  latitude: p.latitude ?? null,
  longitude: p.longitude ?? null,
  time_zone: p.timeZone ?? null,
});

/** Kolone podataka o rodjenju, za `select`. */
export const RODJENJE_POLJA = 'name, birth_year, birth_month, birth_day, birth_hour, birth_minute, city_id, city_name, latitude, longitude, time_zone';

const toRow = (p: Profile, userId: string) => ({ id: userId, ...redIzProfila(p) });

/**
 * Karta sa servera, ili null ako je nema. Greska (mreza) BACA: "nema karte" i
 * "nismo uspeli da pitamo" nisu isto. Da vrati null, prijava postojecim emailom
 * bez mreze bi zakljucila da karte nema i upisala draft preko nje.
 */
export async function pullProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(RODJENJE_POLJA)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? profilIzReda(data as RodjenjeRed) : null;
}

export async function pushProfile(userId: string, profile: Profile) {
  const { error } = await supabase.from('profiles').upsert(toRow(profile, userId));
  return error;
}

/**
 * Poziva se odmah po prijavi. Vraca profil koji treba drzati lokalno,
 * ili null ako ga nema ni gore ni dole (korisnik ide na onboarding).
 */
export async function syncOnSignIn(
  userId: string,
  localProfile: Profile | null
): Promise<Profile | null> {
  const remote = await pullProfile(userId);
  if (remote) return remote;
  if (localProfile) {
    await pushProfile(userId, localProfile);
    return localProfile;
  }
  return null;
}
