/**
 * Pretraga gradova: prvo lokalno, pa preko mreze.
 *
 * Region (2.102 grada) je ugradjen u aplikaciju i odgovara trenutno, bez
 * mreze. Ostatak sveta (69.084 grada) je u tabeli `cities` u bazi — u bundle
 * ne staje, a i menja se bez novog izlaska u prodavnicu.
 *
 * Lokalni pogoci uvek idu prvi: vecina korisnika je iz regiona i za njih
 * pretraga nikad ne ceka mrezu.
 */
import { searchCities as searchLocal, type City } from '@/lib/cities';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ZONE_STANDARD_OFFSET } from '@/lib/zone-offsets';
import type { TimeZoneInfo } from '@/lib/timezone';

/** Isto presavijanje koje je primenjeno na `search_name` u bazi. */
function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'd')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Zone regiona idu po evropskom pravilu; ostale se oslanjaju na Intl. */
function zoneFor(name: string): TimeZoneInfo {
  return {
    name,
    standardOffsetMinutes: ZONE_STANDARD_OFFSET[name] ?? 0,
    europeanDst: name.startsWith('Europe/'),
  };
}

/** Ime zemlje na srpskom ako runtime ume; inace kod zemlje. */
function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['sr-Latn'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

type Row = {
  id: number;
  name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export async function searchCitiesRemote(query: string, limit = 8): Promise<City[]> {
  const q = fold(query.trim());
  if (!isSupabaseConfigured || q.length < 2) return [];

  // Funkcija u bazi, ne obican upit: mora da pogleda i glavna imena i
  // alijase. GeoNames glavno ime je englesko ("Vienna"), a korisnik kuca
  // "bec" — bez alijasa pretraga dijaspore ne radi.
  const { data, error } = await supabase.rpc('search_cities', { q, lim: limit });

  if (error || !data) return [];

  return (data as Row[]).map((r) => ({
    id: r.id,
    name: r.name,
    country: countryName(r.country_code),
    latitude: r.latitude,
    longitude: r.longitude,
    tz: zoneFor(r.timezone),
  }));
}

/**
 * Lokalni pogoci prvi, pa mrezni da popune ostatak.
 * Ista GeoNames numeracija na obe strane, pa duplikata ne moze biti.
 */
export async function searchCitiesAll(query: string, limit = 8): Promise<City[]> {
  const local = searchLocal(query, limit);
  if (local.length >= limit) return local;

  const remote = await searchCitiesRemote(query, limit - local.length);
  const seen = new Set(local.map((c) => c.id));
  return [...local, ...remote.filter((c) => !seen.has(c.id))];
}

/* ------------------------------------------------------------------------- */

import * as React from 'react';

/**
 * Pretraga za UI.
 *
 * Lokalni pogoci se prikazuju ODMAH, bez cekanja. Mrezni stizu posle i
 * dopunjuju listu. Tako korisnik iz regiona nikad ne ceka mrezu, a onaj iz
 * dijaspore vidi da se nesto desava umesto praznog ekrana.
 */
export function useCitySearch(query: string, limit = 8) {
  const [results, setResults] = React.useState<City[]>(() => searchLocal(query, limit));
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const local = searchLocal(query, limit);
    setResults(local);

    // Dovoljno lokalnih pogodaka — mreza se ne dira.
    if (local.length >= limit || query.trim().length < 2) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let otkazano = false;
    // Kratka pauza da se ne salje zahtev na svako otkucano slovo.
    const t = setTimeout(async () => {
      const remote = await searchCitiesRemote(query, limit - local.length);
      if (otkazano) return;
      const seen = new Set(local.map((c) => c.id));
      setResults([...local, ...remote.filter((c) => !seen.has(c.id))]);
      setLoading(false);
    }, 300);

    return () => { otkazano = true; clearTimeout(t); };
  }, [query, limit]);

  return { results, loading };
}
