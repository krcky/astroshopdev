import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { moonLitPath } from '@/lib/moon';
import { neutral } from '@/theme/tokens';

/**
 * Mesec kakav je sada: tamni disk i osvetljeni deo preko njega (`moonLitPath`).
 *
 * Crno-belo, kao ilustracije u B stilu (gravira), NE lila. Svetli deo je topla
 * bela, da se odvoji od bele kartice; tanka ivica drzi obris i na mladom Mesecu.
 */
const LIT = '#F4F1E8';

export function MoonDisc({ angle, size = 64 }: { angle: number; size?: number }) {
  const r = size / 2;
  const d = moonLitPath(angle, r);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={r} cy={r} r={r - 0.5} fill={neutral.ink} />
      {!!d && <Path d={d} fill={LIT} />}
      <Circle cx={r} cy={r} r={r - 0.5} fill="none" stroke={neutral.ink} strokeWidth={1} />
    </Svg>
  );
}
