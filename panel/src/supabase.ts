/**
 * Supabase klijent panela — isti projekat i isti javni kljuc kao aplikacija.
 * Sesija je u `localStorage` pregledaca (podrazumevano za supabase-js na vebu).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const kljuc = import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export const podeseno = Boolean(url && kljuc);

export const supabase = createClient(url ?? 'https://unset.supabase.co', kljuc ?? 'unset', {
  auth: { storageKey: 'astroshop-panel', persistSession: true, autoRefreshToken: true },
});

/** Turnstile kljuc; prazan = kapije nema (isti prekidac kao u aplikaciji). */
export const TURNSTILE_KLJUC = (import.meta.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY as string | undefined) ?? '';

/** Red iz `pitanja` kako ga panel cita. */
export type PitanjePanel = {
  id: string;
  user_id: string;
  tekst: string;
  status: 'draft' | 'paid' | 'answered' | 'refunded';
  karta: import('../../src/lib/pitanja-snimak').SnimakKarte | null;
  created_at: string;
  paid_at: string | null;
  answered_at: string | null;
  sandbox: boolean;
  audio_putanja: string | null;
  audio_trajanje: number | null;
};

export const POLJA = 'id, user_id, tekst, status, karta, created_at, paid_at, answered_at, sandbox, audio_putanja, audio_trajanje';
