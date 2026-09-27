/**
 * Tumacenja natalne karte — SA SERVERA (`natal_texts`), nikad iz aplikacije
 * (pravilo 7). Aplikacija trazi samo kljuceve iz karte korisnika
 * (`lib/natal-keys.ts`).
 *
 * Paywall je u bazi (pravilo 8): besplatne redove (Sunce, Mesec i podznak u
 * znaku) salje svakom prijavljenom, ostale samo uz aktivan pristup. Red koji
 * nije stigao je zato ILI zakljucan ILI jos nenapisan — razlikuje ih ekran
 * (`isFreeNatalKey` + pravo pristupa), ne ovaj fajl.
 */
import * as React from 'react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type NatalText = { key: string; title: string; subtitle: string; body: string };

export async function fetchNatalTexts(keys: string[]): Promise<Map<string, NatalText>> {
  const out = new Map<string, NatalText>();
  if (!isSupabaseConfigured || keys.length === 0) return out;
  const { data, error } = await supabase
    .from('natal_texts')
    .select('key, title, subtitle, body')
    .in('key', keys);
  if (error || !data) return out;
  for (const r of data as { key: string; title: string; subtitle: string | null; body: string }[]) {
    out.set(r.key, { key: r.key, title: r.title, subtitle: r.subtitle ?? '', body: r.body });
  }
  return out;
}

export function useNatalTexts(keys: string[]) {
  const [texts, setTexts] = React.useState<Map<string, NatalText>>(new Map());
  const [loading, setLoading] = React.useState(keys.length > 0);
  // Poredi se sadrzaj, ne referenca niza.
  const potpis = keys.join('|');

  React.useEffect(() => {
    if (keys.length === 0) { setTexts(new Map()); setLoading(false); return; }
    let otkazano = false;
    setLoading(true);
    fetchNatalTexts(keys).then((m) => {
      if (otkazano) return;
      setTexts(m);
      setLoading(false);
    });
    return () => { otkazano = true; };
  }, [potpis]);

  return { texts, loading };
}
