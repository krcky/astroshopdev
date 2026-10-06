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
import { kesProcitaj, kesUpisi, ucitajKes } from '@/lib/kes-na-disku';
import { usePovratakMreze } from '@/lib/mreza';
import { useAuthStore } from '@/store/auth';
import { jeziciUpita, jezikKorpusa, kesJezika, poJeziku } from '@/lib/jezik-korpusa';
import { useJezik } from '@/i18n';
import type { Jezik } from '@/i18n/jezik';

export function lunarKey(phase: LunarTextPhase, sign: string, area: LunarArea): string {
  return `lunar.${phase}.${sign}.${area}`;
}

/** Svih pet oblasti za fazu i znak, jednim upitom. `null` = upit nije uspeo (mreza). */
export async function fetchLunarTexts(phase: LunarTextPhase, sign: string, j: Jezik = jezikKorpusa()): Promise<Map<LunarArea, string> | null> {
  const out = new Map<LunarArea, string>();
  if (!isSupabaseConfigured) return out;
  const { data, error } = await supabase
    .from('lunar_texts')
    .select('area, body, jezik')
    .eq('phase', phase)
    .eq('sign', sign)
    .in('jezik', jeziciUpita(j));
  if (error || !data) return null;
  type Red = { area: LunarArea; body: string; jezik?: string | null };
  // Prevod ako postoji, inace srpski (`lib/jezik-korpusa.ts`).
  for (const r of poJeziku(data as Red[], j, (x) => x.area)) out.set(r.area, r.body);
  return out;
}

export function useLunarTexts(phase: LunarTextPhase | null, sign: string | null) {
  const [texts, setTexts] = React.useState<Map<LunarArea, string>>(new Map());
  const [loading, setLoading] = React.useState(!!phase && !!sign);
  const korisnik = useAuthStore((s) => s.user?.id ?? '');
  const povratak = usePovratakMreze();
  const j = jezikKorpusa(useJezik());

  React.useEffect(() => {
    if (!phase || !sign) { setTexts(new Map()); setLoading(false); return; }
    // Disk i server u isto vreme (`kes-na-disku.ts`): disk popuni dok server ne
    // odgovori, a bez interneta ostaje on. Odgovor servera uvek ima prednost.
    const kljuc = `lunar|${kesJezika(j)}${korisnik}|${phase}|${sign}`;
    let otkazano = false;
    let server = false;
    let disk = false;
    // PRETHODNI TEKST OSTAJE dok novi ne stigne (Ivan, 29.9.2026: "nije smooth") — pri
    // promeni dana nema sivih traka pa skoka visine; ekran ga za to vreme priguši
    // (`loading`). Tekst se brise samo kad za novi dan zaista nema nicega.
    setLoading(true);
    ucitajKes().then(() => {
      const d = kesProcitaj<[LunarArea, string][]>(kljuc);
      if (otkazano || server || !d) return;
      disk = true;
      setTexts(new Map(d));
      setLoading(false);
    });
    fetchLunarTexts(phase, sign, j).then((m) => {
      if (otkazano) return;
      if (m) {
        server = true;
        setTexts(m);
        if (m.size) kesUpisi(kljuc, [...m]);
      } else if (!disk) {
        // Bez mreze i bez diska: stari tekst bi bio za drugi dan.
        setTexts(new Map());
      }
      setLoading(false);
    });
    return () => { otkazano = true; };
  }, [phase, sign, korisnik, povratak, j]);

  return { texts, loading };
}

/** Jedna oblast — za karticu na pocetnoj. */
export function useLunarText(phase: LunarTextPhase | null, sign: string | null, area: LunarArea) {
  const { texts, loading } = useLunarTexts(phase, sign);
  return { body: texts.get(area) ?? null, loading };
}
