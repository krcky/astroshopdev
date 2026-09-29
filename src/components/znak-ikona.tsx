import * as React from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { Element } from '@/lib/zodiac';
import { ELEMENT_BOJA, ZNAK_CENTAR as C, ZNAK_OBLIK as ZNAK, ZNAK_VIEWBOX } from '@/lib/znak-oblici';

/*
 * Ikonice znakova zodijaka (Ivan, 28.9.2026) — oblici i boje su u `lib/znak-oblici.ts`
 * (dele se sa panelom za astrologa). Koriste se SVUDA gde se crta znak.
 */
export { ELEMENT_BOJA, ZNAK_VIEWBOX };

/** Sadrzaj ikonice bez `<Svg>` — za crtanje unutar drugog SVG-a (natalni tocak). */
export function ZnakOblik({ znak, element }: { znak: string; element: Element }) {
  const z = ZNAK[znak];
  if (!z) return null;
  return (
    <G>
      <Circle cx={C} cy={C} r={C} fill={ELEMENT_BOJA[element]} />
      <Path d={z.d} fill="#FFFFFF" fillRule={z.evenodd ? 'evenodd' : 'nonzero'} />
    </G>
  );
}

export function ZnakIkona({ znak, element, size = 24, accessibilityLabel }: {
  /** `SIGNS[].key` — 'aries', 'taurus', … */
  znak: string;
  element: Element;
  size?: number;
  /** Ime znaka za VoiceOver; bez njega ikonica je ukras. */
  accessibilityLabel?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${ZNAK_VIEWBOX} ${ZNAK_VIEWBOX}`}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}>
      <ZnakOblik znak={znak} element={element} />
    </Svg>
  );
}
