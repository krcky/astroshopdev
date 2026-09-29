/**
 * Nalog i pravo pristupa.
 *
 * Nalog NIJE uslov za koriscenje aplikacije. Onboarding i besplatni horoskop
 * rade lokalno; nalog sluzi da se karta sinhronizuje izmedju uredjaja i da se
 * kupovina veze za osobu, a ne za telefon.
 */
import * as React from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAuthRetryableFetchError, type Session, type User } from '@supabase/supabase-js';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { obrisiKes } from '@/lib/kes-na-disku';
import { obrisiLokalno as obrisiPitanjeLokalno } from '@/lib/pitanje-lokalno';
import { useProfileStore } from '@/store/profile';
import { useTvojDanLog } from '@/store/tvoj-dan-log';
import { useHeroLog } from '@/store/hero-log';
import { DEV_TOOLS_ENABLED, useDevStore } from '@/store/dev';

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

/** Test override iz /profile ima isti oblik kao pravi red u bazi. */
const DEV_ENTITLEMENT: Record<'on' | 'off', Entitlement> = {
  on: { active: true, productId: 'dev.override', expiresAt: null },
  off: { active: false, productId: null, expiresAt: null },
};

/**
 * Pravo pristupa kako ga vidi UI — jedina tacka citanja u aplikaciji.
 *
 * Ekrani NE citaju `useAuthStore(s => s.entitlement)` direktno, jer bi tada
 * test prekidac morao da se ugradjuje na svako mesto posebno. U release bildu
 * je `DEV_TOOLS_ENABLED` false i ovo vraca netaknutu vrednost sa servera.
 */
export function useEntitlement(): Entitlement | null {
  const server = useAuthStore((s) => s.entitlement);
  const override = useDevStore((s) => s.entitlementOverride);

  if (!DEV_TOOLS_ENABLED || override === null) return server;
  return override ? DEV_ENTITLEMENT.on : DEV_ENTITLEMENT.off;
}

/** Da li ovaj korisnik ima Premium (kupovina ili poklon) — prikaz; granice su u `lib/pristup.ts`. */
export function usePremium(): boolean {
  return !!useEntitlement()?.active;
}

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
      ucitajPravo(session.user.id);
    };

    // BEZ INTERNETA (Ivan, 29.9.2026). Pristupni token vazi sat vremena. Kad je
    // istekao, `getSession()` pokusava da ga obnovi preko mreze i bez nje:
    //   1. ponavlja pokusaje ~25 s — kapija bi toliko stajala na praznom ekranu;
    //   2. vrati `session: null`, iako sesija i dalje stoji na telefonu —
    //      kapija bi poslala korisnika na welcome, kao da naloga nema.
    // Zato se sacuvana sesija cita ODMAH sa diska i kapija ide dalje, a odgovor
    // `getSession()` presudjuje kad stigne: nova sesija je zameni, greska MREZE je
    // ostavi (obnavlja se sama kad se mreza vrati — `TOKEN_REFRESHED` ispod), a
    // pravi odgovor "nema sesije" (odjava, opozvan token) je brise.
    let presudjeno = false;
    sacuvanaSesija().then((s) => {
      if (presudjeno || !s) return;
      useAuthStore.getState().setSession(s);
      ucitajPravo(s.user.id);
    });

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (data.session) { presudjeno = true; apply(data.session); return; }
      if (error && isAuthRetryableFetchError(error)) {
        const s = await sacuvanaSesija();
        if (s) {
          presudjeno = true;
          if (useAuthStore.getState().user?.id !== s.user.id) {
            useAuthStore.getState().setSession(s);
            ucitajPravo(s.user.id);
          }
          return;
        }
      }
      presudjeno = true;
      apply(null);
    });
    // INITIAL_SESSION nosi isto sto i `getSession()` (bez interneta i null) — o
    // pocetnom stanju odlucuje blok iznad. Ostali dogadjaji su stvarne promene.
    const { data: sub } = supabase.auth.onAuthStateChange((e, session) => {
      if (e === 'INITIAL_SESSION') return;
      apply(session);
    });

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

/**
 * Brise nalog trajno.
 *
 * Poziv ide na Edge Function `delete-account`, jer brisanje iz `auth.users`
 * trazi service_role kljuc — a on po pravilu 9 ne sme u aplikaciju. Funkcija
 * koga brise odredjuje iz tokena, ne iz onoga sto posaljemo.
 *
 * Profil i pravo pristupa nestaju sami, preko `on delete cascade` u bazi.
 */
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) return { error };

  // `scope: 'local'` namerno: nalog na serveru vise ne postoji, pa bi obicna
  // odjava pokusala da povuce sesiju koje nema i vratila 401. Ovde samo
  // cistimo ono sto je ostalo na telefonu.
  await supabase.auth.signOut({ scope: 'local' });
  useProfileStore.getState().clear();
  await ocistiLokalno();
  return { error: null };
}

/**
 * `local` odjavljuje samo ovaj telefon; podrazumevana `global` opoziva sesije
 * naloga i na svim drugim uredjajima.
 */
export async function signOut(scope: 'global' | 'local' = 'global') {
  const result = await supabase.auth.signOut({ scope });
  // Lokalni profil je samo kes servera. Ako ostane posle odjave, sledeci
  // korisnik na istom telefonu bi video tudju kartu dok se ne povuce njegova.
  useProfileStore.getState().clear();
  await ocistiLokalno();
  return result;
}

/** Sacuvani tekstovi, poslednje pravo pristupa, pitanje u pisanju i dnevnici prikaza pripadaju nalogu — ne ostaju posle odjave. */
async function ocistiLokalno() {
  useTvojDanLog.getState().clear();
  useHeroLog.getState().clear();
  await obrisiKes();
  await obrisiPitanjeLokalno();
  try { await AsyncStorage.removeItem(PRAVO_KLJUC); } catch { /* nista */ }
}

/**
 * Sesija kako stoji na disku, bez obnove tokena i bez mreze. Kljuc je onaj pod
 * kojim je Supabase klijent sam cuva (`storageKey`).
 */
async function sacuvanaSesija(): Promise<Session | null> {
  try {
    const kljuc = (supabase.auth as unknown as { storageKey: string }).storageKey;
    const sirovo = kljuc ? await AsyncStorage.getItem(kljuc) : null;
    const s = sirovo ? (JSON.parse(sirovo) as Session) : null;
    return s?.refresh_token && s.user?.id ? s : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------------- *
 * POSLEDNJE POZNATO PRAVO PRISTUPA — samo za PRIKAZ bez interneta.
 *
 * Bez ovoga Premium korisnik bez interneta vidi besplatnu pocetnu. Ovo NE
 * otkljucava nista: duge tekstove i dalje salje iskljucivo server po RLS-u
 * (pravilo 8). Ko rucno upise `active: true` na svoj telefon, dobija samo
 * Premium raspored i tekstove koje je taj telefon vec primio dok je pretplata
 * trajala (`kes-na-disku.ts`) — nijedan nov.
 *
 * Vazi najvise `PRAVO_VAZI_DANA` od poslednje provere na serveru, i nikad posle
 * `expiresAt`. Cim server odgovori, njegov odgovor zamenjuje ovaj.
 * ------------------------------------------------------------------------- */
const PRAVO_KLJUC = 'pravo-pristupa-v1';
const PRAVO_VAZI_DANA = 7;
type SacuvanoPravo = { userId: string; e: Entitlement; provereno: number };

async function sacuvanoPravo(userId: string): Promise<Entitlement | null> {
  try {
    const sirovo = await AsyncStorage.getItem(PRAVO_KLJUC);
    const p = sirovo ? (JSON.parse(sirovo) as SacuvanoPravo) : null;
    if (!p || p.userId !== userId) return null;
    if (Date.now() - p.provereno > PRAVO_VAZI_DANA * 86_400_000) return null;
    if (p.e.expiresAt && new Date(p.e.expiresAt).getTime() < Date.now()) return null;
    return p.e;
  } catch {
    return null;
  }
}

/**
 * Sacuvano pravo odmah (da Premium ne bljesne kao besplatan), pa odgovor servera.
 * Kad server ne odgovori, ostaje sacuvano ako jos vazi, inace besplatno.
 */
function ucitajPravo(userId: string) {
  const jos = () => useAuthStore.getState().user?.id === userId;
  sacuvanoPravo(userId).then((e) => {
    if (e && jos() && useAuthStore.getState().entitlement === null) useAuthStore.getState().setEntitlement(e);
  });
  fetchEntitlement(userId).then(async (e) => {
    if (!jos()) return;
    if (e) {
      useAuthStore.getState().setEntitlement(e);
      const p: SacuvanoPravo = { userId, e, provereno: Date.now() };
      try { await AsyncStorage.setItem(PRAVO_KLJUC, JSON.stringify(p)); } catch { /* nista */ }
      return;
    }
    useAuthStore.getState().setEntitlement((await sacuvanoPravo(userId)) ?? { active: false, productId: null, expiresAt: null });
  });
}

/**
 * Ucitava pravo pristupa SA SERVERA.
 *
 * Korisnik po RLS politici sme samo da cita svoj red — upis ide iskljucivo
 * preko RevenueCat webhook-a sa service_role kljucem. Zato se paywall nikad
 * ne sme oslanjati na lokalno stanje.
 *
 * `null` = upit nije uspeo (mreza) — razlicito od "nema pretplate", da
 * Premium korisnik bez interneta ne bi bio svrstan u besplatne (`ucitajPravo`).
 */
export async function fetchEntitlement(userId: string): Promise<Entitlement | null> {
  // Premium = kupovina ILI poklon (`supabase/pokloni.sql`). Server pita isto kroz
  // `ima_premium()`; ovde se cita odvojeno samo da bi profil znao do kad vazi.
  const [kupovina, poklon] = await Promise.all([
    supabase.from('entitlements').select('active, product_id, expires_at').eq('user_id', userId).maybeSingle(),
    supabase.from('pokloni').select('vazi_do').eq('user_id', userId).maybeSingle(),
  ]);

  if (kupovina.error) return null;
  const data = kupovina.data;
  const expired = data?.expires_at ? new Date(data.expires_at).getTime() < Date.now() : false;
  if (data && data.active && !expired) {
    return { active: true, productId: data.product_id ?? null, expiresAt: data.expires_at ?? null };
  }

  // Greska na `pokloni` (npr. tabela jos ne postoji) ne sme da obori placeni pristup
  // iznad, ali ni da poklon proglasi aktivnim.
  const g = poklon.error ? null : poklon.data;
  if (g && (!g.vazi_do || new Date(g.vazi_do).getTime() > Date.now())) {
    return { active: true, productId: 'poklon', expiresAt: g.vazi_do ?? null };
  }
  return { active: false, productId: data?.product_id ?? null, expiresAt: data?.expires_at ?? null };
}
