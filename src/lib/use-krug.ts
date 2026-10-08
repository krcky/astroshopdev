/**
 * Podaci za krug zivota — JEDAN izvor za pocetnu i list oblasti (`app/oblast.tsx`).
 *
 * Tri dana tranzita (juce, danas, sutra) se racunaju na telefonu: stanje je prosek njihovih
 * ocena, tackice su danasnje (`lib/krug.ts`). Rucne oznake tona astrologa stizu sa servera
 * jednim upitom za sve kljuceve; dok ne stignu, ton je po pravilu (`lib/tone.ts`).
 */
import * as React from 'react';

import type { NatalChart } from '@/lib/natal';
import { danPomeren, osnovaDana, krugDana, type KrugDana } from '@/lib/krug';
import { fetchTransitTones } from '@/lib/transit-texts';
import { useJezik } from '@/i18n/use-t';

type Profil = { chart: NatalChart; timeUnknown: boolean } | null | undefined;

const PRAZNO = new Map<string, string>();

export function useKrug(profil: Profil, date: Date): { rez: KrugDana | null; tonovi: Map<string, string> } {
  const timeUnknown = profil?.timeUnknown ?? false;
  // Kao `useOblastiDana`: racun se vezuje za PODATKE o rodjenju, ne za referencu karte (ista karta
  // ume da stigne kao nov objekat).
  const b = profil?.chart.birth;
  const potpisKarte = b ? `${b.date.getTime()}|${b.latitude}|${b.longitude}|${profil!.chart.houses.system}` : '';

  const osnove = React.useMemo(() => {
    const chart = profil?.chart;
    return chart ? {
      jucer: osnovaDana(chart, danPomeren(date, -1), timeUnknown),
      danas: osnovaDana(chart, date, timeUnknown),
      sutra: osnovaDana(chart, danPomeren(date, 1), timeUnknown),
    } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potpisKarte, date, timeUnknown]);

  const potpis = React.useMemo(() => {
    if (!osnove) return '';
    const k = new Set<string>();
    for (const o of [osnove.jucer, osnove.danas, osnove.sutra]) for (const t of o.tranziti) k.add(t.key);
    return [...k].sort().join('|');
  }, [osnove]);
  // Tonovi uz potpis za koji su stigli — stari potpis se ne koristi, a efekat ne postavlja stanje sinhrono.
  const [stigli, setStigli] = React.useState<{ potpis: string; m: Map<string, string> }>({ potpis: '', m: PRAZNO });
  React.useEffect(() => {
    if (!potpis) return;
    let otkazano = false;
    fetchTransitTones(potpis.split('|')).then((m) => { if (!otkazano) setStigli({ potpis, m }); });
    return () => { otkazano = true; };
  }, [potpis]);
  const tonovi = stigli.potpis === potpis ? stigli.m : PRAZNO;

  // Jezik u zavisnostima: navigacija se ne sklapa iznova, a rezultat nosi natpise.
  const jezik = useJezik();
  const rez = React.useMemo(
    () => (osnove ? krugDana(osnove, tonovi, timeUnknown) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [osnove, tonovi, timeUnknown, jezik]
  );
  return { rez, tonovi };
}
