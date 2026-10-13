import * as React from 'react';

import { PocetnaV1 } from '@/components/pocetna/v1';
import { PocetnaV2 } from '@/components/pocetna/v2';
import { PocetnaV3 } from '@/components/pocetna/v3';
import { PocetnaV4 } from '@/components/pocetna/v4';
import { PROBNI_BUILD, useDevStore } from '@/store/dev';

/**
 * Pocetna strana — bira se jedna od cetiri verzije (Ivan, 13.10.2026; PROBNI PREKIDAC u profilu, sekcija "Test"): v1 = stara
 * (tabovi sa "Danas ukratko"), v2 = krug zivota, v3 = vodoravne kartice oblasti, v4 = kao v3 sa animiranom planetom na Temi dana. U buildu za prodavnicu (`PROBNI_BUILD` je
 * false) uvek v4. Kad se odluci koja ostaje, ostali fajlovi u `components/pocetna/` se brisu.
 */
export default function Home() {
  const izabrana = useDevStore((s) => s.pocetnaVerzija);
  const verzija = PROBNI_BUILD ? izabrana : 4;
  if (verzija === 1) return <PocetnaV1 />;
  if (verzija === 2) return <PocetnaV2 />;
  if (verzija === 3) return <PocetnaV3 />;
  return <PocetnaV4 />;
}
