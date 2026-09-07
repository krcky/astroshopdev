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

type Row = {
  name: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number | null;
  birth_minute: number | null;
  city_name: string;
};

const toProfile = (r: Row): Profile => ({
  name: r.name,
  birth: { year: r.birth_year, month: r.birth_month, day: r.birth_day },
  time: r.birth_hour !== null && r.birth_minute !== null
    ? { hour: r.birth_hour, minute: r.birth_minute }
    : null,
  cityName: r.city_name,
});

const toRow = (p: Profile, userId: string) => ({
  id: userId,
  name: p.name,
  birth_year: p.birth.year,
  birth_month: p.birth.month,
  birth_day: p.birth.day,
  birth_hour: p.time?.hour ?? null,
  birth_minute: p.time?.minute ?? null,
  city_name: p.cityName,
});

export async function pullProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, birth_year, birth_month, birth_day, birth_hour, birth_minute, city_name')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return toProfile(data as Row);
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
