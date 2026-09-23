/**
 * Tumacenja tranzita — dolaze SA SERVERA, nikad iz aplikacije.
 *
 * Korpus je najvrednija imovina projekta. Da je ugradjen u bundle, svako ko
 * raspakuje .ipa izvukao bi ceo rad astrologa. Zato aplikacija trazi samo
 * tekstove za danasnje tranzite.
 *
 * Paywall je u bazi, ne ovde. RLS politika salje kratku verziju svakom
 * prijavljenom, a dugu samo onome ko ima aktivan pristup. Ako korisnik bez
 * pretplate zatrazi dugu verziju, server jednostavno ne vrati nista —
 * izmena aplikacije to ne moze da zaobidje.
 */
import * as React from 'react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type TransitVersion = 'short' | 'long';

export type TransitSection = { heading: string; body: string };

export type TransitText = {
  key: string;
  version: TransitVersion;
  title: string;
  body: string;
  positive: string;
  challenge: string;
  advice: string;
  sections: TransitSection[];
};

type Row = {
  key: string;
  version: TransitVersion;
  title: string | null;
  body: string | null;
  positive: string | null;
  challenge: string | null;
  advice: string | null;
  sections: string | null;
};

function toText(r: Row): TransitText {
  let sections: TransitSection[] = [];
  if (r.sections) {
    // Cuva se kao JSON tekst, ne jsonb — uvoz iz CSV-a je tako pouzdaniji.
    try { sections = JSON.parse(r.sections); } catch { sections = []; }
  }
  return {
    key: r.key,
    version: r.version,
    title: r.title ?? '',
    body: r.body ?? '',
    positive: r.positive ?? '',
    challenge: r.challenge ?? '',
    advice: r.advice ?? '',
    sections,
  };
}

/** Jedan upit za sve danasnje tranzite, ne jedan po tranzitu. */
export async function fetchTransitTexts(
  keys: string[],
  version: TransitVersion = 'short'
): Promise<Map<string, TransitText>> {
  const out = new Map<string, TransitText>();
  if (!isSupabaseConfigured || keys.length === 0) return out;

  const { data, error } = await supabase
    .from('transit_texts')
    .select('key, version, title, body, positive, challenge, advice, sections')
    .eq('version', version)
    .in('key', keys);

  if (error || !data) return out;
  for (const r of data as Row[]) out.set(r.key, toText(r));
  return out;
}

export function useTransitTexts(keys: string[], version: TransitVersion = 'short') {
  const [texts, setTexts] = React.useState<Map<string, TransitText>>(new Map());
  const [loading, setLoading] = React.useState(keys.length > 0);

  // Kljucevi se menjaju svakog dana; poredi se sadrzaj, ne referenca niza.
  const potpis = keys.join('|');

  React.useEffect(() => {
    if (keys.length === 0) { setTexts(new Map()); setLoading(false); return; }
    let otkazano = false;
    setLoading(true);
    fetchTransitTexts(keys, version).then((m) => {
      if (otkazano) return;
      setTexts(m);
      setLoading(false);
    });
    return () => { otkazano = true; };
  }, [potpis, version]);

  return { texts, loading };
}
