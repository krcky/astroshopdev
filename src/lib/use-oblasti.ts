/**
 * Tranziti dana i ocene oblasti — JEDAN izvor za tab "Tranziti" (lista po
 * vaznosti) i kartica na slajdu "Danas ukratko", pa su tranziti i ton isti.
 *
 * Tranziti se racunaju na telefonu (`lib/oblasti.ts`); rucne oznake tona
 * astrologa stizu sa servera jednim upitom. Dok ne stignu, ton je po pravilu.
 */
import * as React from 'react';

import type { NatalChart } from '@/lib/natal';
import { aktivniTranziti, LISTA_ORB, lunacijaDana, rasporedi, type OblastiDana } from '@/lib/oblasti';
import { fetchTransitTones } from '@/lib/transit-texts';
import { useJezik } from '@/i18n/use-t';

type Profil = { chart: NatalChart; timeUnknown: boolean } | null | undefined;

export function useOblastiDana(profil: Profil, date: Date): OblastiDana | null {
  const timeUnknown = profil?.timeUnknown ?? false;
  // Ista karta ume da stigne kao nov objekat (profil ponovo stigao sa servera,
  // osoba iz `useKarta`) — racun se vezuje za PODATKE o rodjenju, ne za referencu.
  const b = profil?.chart.birth;
  const potpisKarte = b ? `${b.date.getTime()}|${b.latitude}|${b.longitude}|${profil!.chart.houses.system}` : '';
  const chartRef = React.useRef(profil?.chart ?? null);
  chartRef.current = profil?.chart ?? null;

  const osnova = React.useMemo(() => {
    const chart = chartRef.current;
    return chart ? {
      tranziti: aktivniTranziti(chart, date, timeUnknown),
      // Lista na tabu "Tranziti" — siri orbis (`LISTA_ORB`), nadskup `tranziti`.
      zaListu: aktivniTranziti(chart, date, timeUnknown, LISTA_ORB),
      lunacija: lunacijaDana(chart, date, timeUnknown),
    } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potpisKarte, date, timeUnknown]);

  const [tonovi, setTonovi] = React.useState<Map<string, string>>(new Map());
  // Tonovi za SIRU listu — ona sadrzi i sve iz uske.
  const potpis = osnova?.zaListu.map((t) => t.key).join('|') ?? '';
  React.useEffect(() => {
    if (!potpis) { setTonovi(new Map()); return; }
    let otkazano = false;
    fetchTransitTones(potpis.split('|')).then((m) => { if (!otkazano) setTonovi(m); });
    return () => { otkazano = true; };
  }, [potpis]);

  // Jezik u zavisnostima: `rasporedi` sklapa natpise (ocene, trajanje) — posle promene jezika
  // racuna se iznova, jer se navigacija NE sklapa iznova (`_layout.tsx`).
  const jezik = useJezik();
  return React.useMemo(
    () => (osnova ? rasporedi(osnova.tranziti, osnova.lunacija, tonovi, undefined, undefined, timeUnknown, osnova.zaListu) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [osnova, tonovi, timeUnknown, jezik]
  );
}
