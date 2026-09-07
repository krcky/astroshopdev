/**
 * Nalog i pravo pristupa.
 *
 * Nalog NIJE uslov za koriscenje aplikacije. Onboarding i besplatni horoskop
 * rade lokalno; nalog sluzi da se karta sinhronizuje izmedju uredjaja i da se
 * kupovina veze za osobu, a ne za telefon.
 */
import * as React from 'react';
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useProfileStore } from '@/store/profile';

export type Entitlement = { active: boolean; productId: string | null; expiresAt: string | null };

type AuthState = {
  session: Session | null;
  user: User | null;
  /** true dok se ne zna da li postoji sacuvana sesija. */
  loading: boolean;
  entitlement: Entitlement | null;
  setSession: (s: Session | null) => void;
  setEntitlement: (e: Entitlement | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  entitlement: null,
  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
  setEntitlement: (entitlement) => set({ entitlement }),
}));

/** Pokrece se jednom iz korenskog layout-a. */
export function useAuthListener() {
  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      useAuthStore.setState({ loading: false });
      return;
    }

    const apply = (session: Session | null) => {
      useAuthStore.getState().setSession(session);
      if (!session) {
        useAuthStore.getState().setEntitlement(null);
        return;
      }
      // Pravo pristupa se UVEK cita sa servera, nikad iz lokalnog stanja.
      fetchEntitlement(session.user.id).then((e) => useAuthStore.getState().setEntitlement(e));
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => apply(session));

    return () => sub.subscription.unsubscribe();
  }, []);
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return { data, error };
}

export async function signOut() {
  const result = await supabase.auth.signOut();
  // Lokalni profil je samo kes servera. Ako ostane posle odjave, sledeci
  // korisnik na istom telefonu bi video tudju kartu dok se ne povuce njegova.
  useProfileStore.getState().clear();
  return result;
}

/**
 * Ucitava pravo pristupa SA SERVERA.
 *
 * Korisnik po RLS politici sme samo da cita svoj red — upis ide iskljucivo
 * preko RevenueCat webhook-a sa service_role kljucem. Zato se paywall nikad
 * ne sme oslanjati na lokalno stanje.
 */
export async function fetchEntitlement(userId: string): Promise<Entitlement> {
  const { data, error } = await supabase
    .from('entitlements')
    .select('active, product_id, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return { active: false, productId: null, expiresAt: null };

  const expired = data.expires_at ? new Date(data.expires_at).getTime() < Date.now() : false;
  return {
    active: Boolean(data.active) && !expired,
    productId: data.product_id ?? null,
    expiresAt: data.expires_at ?? null,
  };
}
