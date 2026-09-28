import * as React from 'react';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { brand } from '@/theme/tokens';

/**
 * Ikonice aspekata (Ivan, 28.9.2026; `files/konjukcija.svg` … `opozicija.svg`),
 * u boji brenda (`brand.indigo`).
 *
 * ISTE DEBLJINE KAO ZNACI PLANETA (Ivan, 28.9.2026). U fajlovima su oblici
 * ispunjeni i imaju razlicite debljine (1,26—1,6pt na 13pt), pa su ovde
 * PRECRTANI kao linije po sredini originalnog oblika, iste geometrije, sa potezom
 * `potez` u tackama. Kartica salje potez planete (`PLANETA_POTEZ` x precnik
 * kruga), pa su znaci aspekta i planete iste debljine na ekranu.
 */
export type AspektKljuc = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

const OKVIR: Record<AspektKljuc, { w: number; h: number }> = {
  conjunction: { w: 31, h: 31 },
  sextile: { w: 31, h: 31 },
  square: { w: 28, h: 28 },
  trine: { w: 32, h: 29 },
  opposition: { w: 28, h: 28 },
};

export function imaAspekt(key: string): key is AspektKljuc {
  return key in OKVIR;
}

export function AspektIkona({ aspekt, size = 16, potez = 1.35, color = brand.indigo }: {
  aspekt: AspektKljuc;
  size?: number;
  /** Debljina linije u tackama na ekranu. */
  potez?: number;
  color?: string;
}) {
  const { w, h } = OKVIR[aspekt];
  // Potez u jedinicama viewBox-a: oblik se skalira na `size` po duzoj strani.
  const s = potez * (Math.max(w, h) / size);
  const linija = { stroke: color, strokeWidth: s, fill: 'none' as const };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${w} ${h}`}>
      {aspekt === 'conjunction' && (
        <>
          <Circle cx={9.04} cy={21.29} r={7.31} {...linija} />
          <Line x1={14.21} y1={16.12} x2={28.51} y2={1.73} {...linija} strokeLinecap="round" />
        </>
      )}
      {aspekt === 'sextile' && (
        <>
          <Line x1={2.12} y1={28} x2={28} y2={2.12} {...linija} strokeLinecap="square" />
          <Line x1={2.75} y1={2.27} x2={28.63} y2={28.15} {...linija} strokeLinecap="square" />
          <Line x1={2.43} y1={15.18} x2={29.09} y2={15.18} {...linija} strokeLinecap="square" />
        </>
      )}
      {aspekt === 'square' && <Rect x={1.73} y={1.73} width={24.51} height={24.51} rx={1.2} {...linija} />}
      {aspekt === 'trine' && (
        <Polygon points="2.92,26.77 15.55,3.61 28.18,26.77" {...linija} strokeLinejoin="miter" />
      )}
      {aspekt === 'opposition' && (
        <>
          <Circle cx={21.11} cy={6.4} r={4.67} {...linija} />
          <Circle cx={6.4} cy={21.1} r={4.67} {...linija} />
          <Path d="M17.81 9.7 L9.7 17.8" {...linija} />
        </>
      )}
    </Svg>
  );
}
