/**
 * Lunarni kalendar — tekst za fazu i znak tog dana, iz baze (`lunar_texts`).
 *
 * Kao i tumacenja tranzita, tekstovi NISU u aplikaciji (pravilo 7): trazi se
 * samo ono sto vazi danas. Citanje je besplatno za prijavljene (RLS u
 * `supabase/lunar-texts.sql`). Fazu i znak daje `phaseDay()` iz moon.ts —
 * isti izvor za karticu na pocetnoj i za ekran Mesec, da se ne raziđu.
 */
import * as React from 'react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LunarArea, LunarTextPhase } from '@/lib/moon';

export function lunarKey(phase: LunarTextPhase, sign: string, area: LunarArea): string {
  return `lunar.${phase}.${sign}.${area}`;
}

/** Svih pet oblasti za fazu i znak, jednim upitom. */
export async function fetchLunarTexts(phase: LunarTextPhase, sign: string): Promise<Map<LunarArea, string>> {
  const out = new Map<LunarArea, string>();
  if (!isSupabaseConfigured) return out;
  const { data, error } = await supabase
    .from('lunar_texts')
    .select('area, body')
    .eq('phase', phase)
    .eq('sign', sign);
  if (error || !data) return out;
  for (const r of data as { area: LunarArea; body: string }[]) out.set(r.area, r.body);
  return out;
}

export function useLunarTexts(phase: LunarTextPhase | null, sign: string | null) {
  const [texts, setTexts] = React.useState<Map<LunarArea, string>>(new Map());
  const [loading, setLoading] = React.useState(!!phase && !!sign);

  React.useEffect(() => {
    if (!phase || !sign) { setTexts(new Map()); setLoading(false); return; }
    let otkazano = false;
    setLoading(true);
    fetchLunarTexts(phase, sign).then((m) => {
      if (otkazano) return;
      setTexts(m);
      setLoading(false);
    });
    return () => { otkazano = true; };
  }, [phase, sign]);

  return { texts, loading };
}

/** Jedna oblast — za karticu na pocetnoj. */
export function useLunarText(phase: LunarTextPhase | null, sign: string | null, area: LunarArea) {
  const { texts, loading } = useLunarTexts(phase, sign);
  return { body: texts.get(area) ?? null, loading };
}
