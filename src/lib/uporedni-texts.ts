/**
 * Uporedni horoskop — tekstovi astrologa za par znakova, iz baze (`uporedni_texts`, `supabase/uporedni-texts.sql`).
 *
 * Kao lunarni kalendar: tekstovi NISU u aplikaciji (pravilo 7); trazi se samo ono sto treba za JEDAN par (do tri
 * reda: Ljubav, Prijateljstvo, Posao), a citanje je besplatno za prijavljene (RLS). Tekstovi su USMERENI: prvi znak je
 * onaj u kom je "ti" (korisnik), drugi je znak druge osobe. Disk je rezerva za rad bez interneta (pravilo 19).
 * Nekim parovima oblast fali (sajt nema "Posao" za Strelac-Rak, a "Ljubav" za Lav-Devica je odsecena) — ekran tada
 * pokazuje samo oblasti koje postoje.
 */
import * as React from 'react';

import type { OblastPara } from '@/lib/uporedni';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { kesProcitaj, kesUpisi, ucitajKes } from '@/lib/kes-na-disku';
import { usePovratakMreze } from '@/lib/mreza';
import { useAuthStore } from '@/store/auth';
import { jeziciUpita, jezikKorpusa, kesJezika, poJeziku } from '@/lib/jezik-korpusa';
import { useJezik } from '@/i18n';
import type { Jezik } from '@/i18n/jezik';

export { OBLASTI_PARA, uporedniKey, type OblastPara } from '@/lib/uporedni';

/** Sve oblasti za par, jednim upitom. `null` = upit nije uspeo (mreza); prazna mapa = za par nema nijednog teksta. */
export async function fetchUporedniTexts(prvi: string, drugi: string, j: Jezik = jezikKorpusa()): Promise<Map<OblastPara, string> | null> {
  const out = new Map<OblastPara, string>();
  if (!isSupabaseConfigured) return out;
  const { data, error } = await supabase
    .from('uporedni_texts')
    .select('area, body, jezik')
    .eq('prvi', prvi)
    .eq('drugi', drugi)
    .in('jezik', jeziciUpita(j));
  if (error || !data) return null;
  type Red = { area: OblastPara; body: string; jezik?: string | null };
  // Prevod ako postoji, inace srpski (`lib/jezik-korpusa.ts`).
  for (const r of poJeziku(data as Red[], j, (x) => x.area)) out.set(r.area, r.body);
  return out;
}

export function useUporedniTexts(prvi: string | null, drugi: string | null) {
  const [texts, setTexts] = React.useState<Map<OblastPara, string>>(new Map());
  const [loading, setLoading] = React.useState(!!prvi && !!drugi);
  const korisnik = useAuthStore((s) => s.user?.id ?? '');
  const povratak = usePovratakMreze();
  const j = jezikKorpusa(useJezik());

  React.useEffect(() => {
    if (!prvi || !drugi) { setTexts(new Map()); setLoading(false); return; }
    const kljuc = `uporedni|${kesJezika(j)}${korisnik}|${prvi}|${drugi}`;
    let otkazano = false;
    let server = false;
    let disk = false;
    // Disk i server u isto vreme (`kes-na-disku.ts`): disk popuni dok server ne odgovori, a bez interneta ostaje on.
    // Odgovor servera uvek ima prednost; prethodni par ostaje dok novi ne stigne, da ekran ne skace.
    setLoading(true);
    ucitajKes().then(() => {
      const d = kesProcitaj<[OblastPara, string][]>(kljuc);
      if (otkazano || server || !d) return;
      disk = true;
      setTexts(new Map(d));
      setLoading(false);
    });
    fetchUporedniTexts(prvi, drugi, j).then((m) => {
      if (otkazano) return;
      if (m) {
        server = true;
        setTexts(m);
        if (m.size) kesUpisi(kljuc, [...m]);
      } else if (!disk) {
        setTexts(new Map());
      }
      setLoading(false);
    });
    return () => { otkazano = true; };
  }, [prvi, drugi, korisnik, povratak, j]);

  return { texts, loading };
}
