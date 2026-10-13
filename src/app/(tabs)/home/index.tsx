import * as React from 'react';

import { PocetnaV1 } from '@/components/pocetna/v1';
import { PocetnaV2 } from '@/components/pocetna/v2';
import { PocetnaV3 } from '@/components/pocetna/v3';
import { PROBNI_BUILD, useDevStore } from '@/store/dev';

/**
 * Pocetna strana — bira se jedna od tri verzije (Ivan, 13.10.2026; PROBNI PREKIDAC u profilu, sekcija "Test"): v1 = stara
 * (tabovi sa "Danas ukratko"), v2 = krug zivota, v3 = vodoravne kartice oblasti. U buildu za prodavnicu (`PROBNI_BUILD` je
 * false) uvek v3. Kad se odluci koja ostaje, ostali fajlovi u `components/pocetna/` se brisu.
 */
export default function Home() {
  const izabrana = useDevStore((s) => s.pocetnaVerzija);
  const verzija = PROBNI_BUILD ? izabrana : 3;
  if (verzija === 1) return <PocetnaV1 />;
  if (verzija === 2) return <PocetnaV2 />;
  return <PocetnaV3 />;
}
