/**
 * Druge osobe — upiti ka serveru (`supabase/osobe.sql`) i hook-ovi koji traze nalog.
 *
 * UPIS IDE PRVO NA SERVER, pa tek onda u telefon: baza proverava granicu (1
 * besplatno, 10 uz Premium — pravilo 8) i daje id. Zato bez mreze osoba ne moze
 * da se doda ni izmeni; CITANJE radi sa onim sto je vec stiglo (pravilo 19).
 */
import * as React from 'react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { profilIzReda, redIzProfila, RODJENJE_POLJA, type RodjenjeRed } from '@/lib/sync';
import { otvoreneOsobe, type OdnosKljuc, type Osoba } from '@/lib/osobe';
import { useOsobeStore } from '@/store/osobe';
import { resolveProfile, useProfileStore, type Profile, type ResolvedProfile } from '@/store/profile';
import { useAuthStore, usePremium } from '@/store/auth';

const POLJA = `id, odnos, created_at, ${RODJENJE_POLJA}`;

type Red = RodjenjeRed & { id: string; odnos: OdnosKljuc | null; created_at: string };

const osobaIzReda = (r: Red): Osoba => ({ ...profilIzReda(r), id: r.id, odnos: r.odnos, createdAt: r.created_at });

/** Podaci koje korisnik unosi — sve osim id-a i datuma dodavanja. */
export type NovaOsoba = Profile & { odnos: OdnosKljuc | null };

/** Spisak sa servera. Greska (mreza) BACA — "nema osoba" i "nismo uspeli da pitamo" nisu isto. */
async function povuciOsobe(): Promise<Osoba[]> {
  const { data, error } = await supabase.from('osobe').select(POLJA).order('created_at');
  if (error) throw error;
  return ((data ?? []) as Red[]).map(osobaIzReda);
}

/** Osvezi spisak sa servera; bez mreze ostaje ono sto je na telefonu. */
export async function osveziOsobe(uid: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const osobe = await povuciOsobe();
    // Nalog se u medjuvremenu promenio (odjava) — spisak ne pripada nikome.
    if (useAuthStore.getState().user?.id === uid) useOsobeStore.getState().postavi(uid, osobe);
  } catch { /* disk je rezerva */ }
}

/** Nova osoba. Baca gresku sa porukom servera (`granica_osoba`…) — `porukaOsobe` je prevodi. */
export async function dodajOsobu(uid: string, p: NovaOsoba): Promise<Osoba> {
  const { data, error } = await supabase
    .from('osobe')
    .insert({ user_id: uid, odnos: p.odnos, ...redIzProfila(p) })
    .select(POLJA)
    .single();
  if (error) throw new Error(error.message);
  const osoba = osobaIzReda(data as Red);
  useOsobeStore.getState().upisi(uid, osoba);
  return osoba;
}

export async function izmeniOsobu(uid: string, id: string, p: NovaOsoba): Promise<Osoba> {
  const { data, error } = await supabase
    .from('osobe')
    .update({ odnos: p.odnos, ...redIzProfila(p) })
    .eq('id', id)
    .select(POLJA)
    .single();
  if (error) throw new Error(error.message);
  const osoba = osobaIzReda(data as Red);
  useOsobeStore.getState().upisi(uid, osoba);
  return osoba;
}

/** Brise osobu. Pitanja o njoj ostaju — snimak karte je u pitanju (`pitanja.osoba_id` postaje NULL). */
export async function obrisiOsobu(uid: string, id: string): Promise<void> {
  const { error } = await supabase.from('osobe').delete().eq('id', id);
  if (error) throw new Error(error.message);
  useOsobeStore.getState().ukloni(uid, id);
}

const PRAZNO: Osoba[] = [];

/** Osobe prijavljenog naloga, redom dodavanja. Tudji spisak (drugi nalog na istom telefonu) je prazan. */
export function useOsobe(): Osoba[] {
  const uid = useAuthStore((s) => s.user?.id);
  const vlasnik = useOsobeStore((s) => s.uid);
  const osobe = useOsobeStore((s) => s.osobe);
  return uid && vlasnik === uid ? osobe : PRAZNO;
}

/** Id-jevi otvorenih osoba (prve po redu, do granice) — `otvoreneOsobe`. */
export function useOtvoreneOsobe(): Set<string> {
  const osobe = useOsobe();
  const premium = usePremium();
  return React.useMemo(() => otvoreneOsobe(osobe, premium), [osobe, premium]);
}

/** Osvezi spisak kad se pozove (fokus ekrana); ne ceka se na njega. */
export function useOsveziOsobe(): () => void {
  const uid = useAuthStore((s) => s.user?.id);
  return React.useCallback(() => { if (uid) void osveziOsobe(uid); }, [uid]);
}

/**
 * Karta za ekran: bez `osobaId` korisnikova, sa njim — te osobe. `null` dok
 * profil nije ucitan, ili kad osobe nema (obrisana, drugi nalog). Racuna se
 * jednom po osobi, ne pri svakom crtanju.
 */
export function useKarta(osobaId?: string | null): ResolvedProfile | null {
  const profil = useProfileStore((s) => s.profile);
  const osobe = useOsobe();
  const izvor: Profile | null = osobaId ? osobe.find((o) => o.id === osobaId) ?? null : profil;
  return React.useMemo(() => resolveProfile(izvor), [izvor]);
}

/** Osoba po id-u, ili null. */
export function useOsoba(osobaId?: string | null): Osoba | null {
  const osobe = useOsobe();
  return osobaId ? osobe.find((o) => o.id === osobaId) ?? null : null;
}
