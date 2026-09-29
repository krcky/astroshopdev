/**
 * Pitaj astrologa — upiti ka serveru (`supabase/pitanja.sql`).
 *
 * Aplikacija CITA svoja pitanja i kredite, a PISE samo kroz tri funkcije
 * (`sacuvaj_nacrt`, `posalji_kreditom`, `oznaci_procitano`). Status, placanje i
 * odgovor upisuje server — za tabele nema politike za upis (pravilo 8).
 */
import * as React from 'react';
import { AppState } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { brojNeprocitanih, neprocitan, type Pitanje } from '@/lib/pitanja';
import type { SnimakKarte } from '@/lib/pitanja-snimak';
import { useAuthStore } from '@/store/auth';

const POLJA = 'id, tekst, status, created_at, paid_at, answered_at, audio_putanja, audio_trajanje, procitano_at';

/** Koliko dugo vazi link za slusanje. Novi se trazi pri svakom otvaranju pitanja. */
const LINK_SEKUNDI = 60 * 60;

export function useMojaPitanja() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['pitanja', uid],
    enabled: !!uid && isSupabaseConfigured,
    // Odgovor stize bez push-a (jos ga nema): lista se osvezava pri svakom
    // povratku na tab (`refetch` u `ask.tsx`), pa kratko vazi.
    staleTime: 15_000,
    queryFn: async (): Promise<Pitanje[]> => {
      const { data, error } = await supabase.from('pitanja').select(POLJA).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pitanje[];
    },
  });
}

/**
 * Broj novih odgovora — oznaka na tabu "Pitaj" (`(tabs)/_layout.tsx`).
 *
 * Push jos nema, pa je ovo jedini znak da je odgovor stigao: lista se cita pri
 * pokretanju i ponovo svaki put kad se aplikacija vrati u prvi plan.
 */
export function useBrojNeprocitanih(): number {
  const q = useMojaPitanja();
  const { refetch } = q;
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refetch(); });
    return () => sub.remove();
  }, [refetch]);
  return brojNeprocitanih(q.data);
}

/**
 * Odgovor je otvoren. Oznaka nestaje ODMAH (kes), a server se javlja u pozadini;
 * ako ne uspe (bez mreze), sledece citanje liste vrati oznaku i pokusava se opet.
 */
export function useOznaciProcitano() {
  const qc = useQueryClient();
  const uid = useAuthStore((s) => s.user?.id);
  return React.useCallback(async (p: Pitanje) => {
    if (!neprocitan(p)) return;
    const sada = new Date().toISOString();
    qc.setQueryData<Pitanje[]>(['pitanja', uid], (stara) => stara?.map((x) => (x.id === p.id ? { ...x, procitano_at: sada } : x)));
    const { error } = await supabase.rpc('oznaci_procitano', { p_pitanje: p.id });
    if (error) qc.invalidateQueries({ queryKey: ['pitanja'] });
  }, [qc, uid]);
}

/** Jedno pitanje iz iste liste — list sa detaljem ne salje nov upit. */
export function usePitanje(id: string | undefined) {
  const q = useMojaPitanja();
  return { ...q, pitanje: q.data?.find((p) => p.id === id) ?? null };
}

/** Broj placenih pitanja koja jos nisu napisana (kupovina bez nacrta, poklon). */
export function useKrediti() {
  const uid = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['krediti', uid],
    enabled: !!uid && isSupabaseConfigured,
    staleTime: 15_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('pitanja_krediti')
        .select('id', { count: 'exact', head: true })
        .is('iskoriscen_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Posle slanja: lista i krediti se citaju ponovo. */
export function useOsveziPitanja() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: ['pitanja'] }),
    qc.invalidateQueries({ queryKey: ['krediti'] }),
  ]);
}

/** Cuva JEDINI nacrt korisnika i vraca njegov id. Baca gresku sa porukom servera. */
export async function sacuvajNacrt(tekst: string, karta: SnimakKarte | null): Promise<string> {
  const { data, error } = await supabase.rpc('sacuvaj_nacrt', { p_tekst: tekst, p_karta: karta });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Salje nacrt astrologu na racun kredita. */
export async function posaljiKreditom(pitanjeId: string): Promise<void> {
  const { error } = await supabase.rpc('posalji_kreditom', { p_pitanje: pitanjeId });
  if (error) throw new Error(error.message);
}

/**
 * Potpisan link za glasovni odgovor. Skladiste je privatno: link pravi samo
 * vlasnik pitanja (politika u `pitanja.sql`) i istice posle `LINK_SEKUNDI`.
 */
export function useLinkZvuka(putanja: string | null) {
  return useQuery({
    queryKey: ['zvuk', putanja],
    enabled: !!putanja && isSupabaseConfigured,
    // Nov link pre nego sto stari istekne.
    staleTime: (LINK_SEKUNDI - 10 * 60) * 1000,
    gcTime: (LINK_SEKUNDI - 5 * 60) * 1000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from('odgovori').createSignedUrl(putanja!, LINK_SEKUNDI);
      if (error || !data?.signedUrl) throw new Error(error?.message ?? 'nema linka');
      return data.signedUrl;
    },
  });
}
