/**
 * Supabase klijent.
 *
 * Anon kljuc je UGRADJEN u aplikaciju i svako ko je raspakuje moze da ga
 * procita. To nije propust — tako je zamisljeno. Podatke stiti Row Level
 * Security u bazi (vidi `supabase/schema.sql`), ne tajnost kljuca.
 */
import 'react-native-url-polyfill/auto';

import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** false dok anon kljuc nije upisan u .env — app tada radi lokalno, bez naloga. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'https://unset.supabase.co', anonKey ?? 'unset', {
  auth: {
    // Sesija se cuva u AsyncStorage (peskovnik aplikacije). To je ono sto
    // Supabase preporucuje za React Native. Ako ikad budemo cuvali osetljivije
    // podatke, prelazi se na expo-secure-store adapter sa deljenjem na delove
    // (SecureStore ima ogranicenje od 2048 bajta po stavci, a JWT ume da bude veci).
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Nema URL callback-a kao na vebu; sesija stize iz storage-a.
    detectSessionInUrl: false,
  },
});

// Osvezavanje tokena mora da stane kad aplikacija ode u pozadinu, inace
// timer radi u prazno i trosi bateriju.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
