import * as React from 'react';

import type { ZodiacSign } from '@/lib/zodiac';
import { useResolvedProfile } from '@/store/profile';

/**
 * Znak Sunca korisnika, za "Ostalo" i "Uporedni horoskop". `null` bez profila ili kad zona nije pouzdana (rodjenje na
 * granici znaka — pravilo 4: radije priznati nego pogadjati; isto radi lista "Tvoji ljudi").
 */
export function useMojZnak(): ZodiacSign | null {
  const r = useResolvedProfile();
  return React.useMemo(() => {
    if (!r || r.zoneUnreliable) return null;
    return r.chart.planets.find((p) => p.key === 'sun')?.position.sign ?? null;
  }, [r]);
}
