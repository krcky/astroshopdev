import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { IKONE_OSNOVA } from '@/lib/ikone-osnova';

/**
 * Ivanova ikonica za karticu na slici "Osnove znaka" (kvalitet, polaritet, pol, izgled, deo tela;
 * `files/*.svg`, 30.9.2026). Boje su iz njegovih fajlova — element ima svoju ikonicu (`ElementIkona`).
 */
export function IkonaOsnove({ ime, size }: { ime: keyof typeof IKONE_OSNOVA; size: number }) {
  const ik = IKONE_OSNOVA[ime];
  if (!ik) return null;
  const p = ik.pravougaonik;
  return (
    <Svg width={size} height={size} viewBox="0 0 118 118" accessible={false}>
      {p && (
        <Rect x={p.x} y={p.y} width={p.w} height={p.h} transform={p.transform} fill="none" stroke={p.boja} strokeWidth={p.debljina} />
      )}
      {ik.putanje.map((t, i) => (
        <Path key={i} d={t.d} fill={t.boja} fillRule={t.evenodd ? 'evenodd' : 'nonzero'} clipRule={t.evenodd ? 'evenodd' : 'nonzero'} />
      ))}
    </Svg>
  );
}
