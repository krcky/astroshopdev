import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { NIJANSE, type Nijansa } from '@/components/prica/boje';
import { useSekunde } from '@/components/prica/sat';

/**
 * Zivi preliv preko cele slike price — isti princip kao na pocetnoj (`screen.tsx`,
 * `Mrlja`), samo veci: tri meke mrlje plove svaka svojim tempom. Pokret je samo
 * `transform` na UI niti i ide po SATU SLIKE (`sat.tsx`): stoji dok je prica
 * pauzirana, a bez sata (kartica za sliku, "Smanji pokrete") mrlje su na pocetnom mestu.
 *
 * `sirina`/`visina` su za karticu za deljenje (360 × 640); bez njih se meri roditelj.
 */
export function PricaPozadina({ nijansa, sirina, visina }: {
  nijansa: Nijansa;
  sirina?: number;
  visina?: number;
}) {
  const [mera, setMera] = React.useState<{ w: number; h: number } | null>(
    sirina && visina ? { w: sirina, h: visina } : null
  );
  const sat = useSekunde();

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
      onLayout={sirina ? undefined : (e) => setMera({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {mera && NIJANSE[nijansa].map(([boja, alfa], i) => (
        <Mrlja key={i} redni={i} boja={boja} alfa={alfa} sat={sat} w={mera.w} h={mera.h} />
      ))}
    </View>
  );
}

/**
 * Po mrlji: mesto i velicina kao udeo slike, period (s) i koliko luta.
 * Iz prototipa: prva gore levo, druga gore desno, treca dole.
 */
const MRLJE = [
  { x: -0.45, y: -0.22, w: 1.5, h: 0.62, period: 16, dx: 0.2, dy: 0.04, ds: 0.08 },
  { x: 0.1, y: -0.08, w: 1.4, h: 0.58, period: 12, dx: -0.2, dy: -0.05, ds: -0.09 },
  { x: -0.2, y: 0.8, w: 1.3, h: 0.5, period: 20, dx: 0.2, dy: 0.04, ds: 0.08 },
] as const;

function Mrlja({ redni, boja, alfa, sat, w, h }: {
  redni: number; boja: string; alfa: number; sat: Readonly<SharedValue<number>>; w: number; h: number;
}) {
  // Jedinstven id, bez dvotacaka iz `useId` (pravilo 13).
  const id = `prica-mrlja-${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const m = MRLJE[redni % MRLJE.length];
  const sw = w * m.w;
  const sh = h * m.h;
  const pokret = useAnimatedStyle(() => {
    // Tam-amo: 0 -> 1 -> 0 za jedan period, meko (kosinus), kao `alternate ease-in-out`.
    const t = (1 - Math.cos((2 * Math.PI * sat.get()) / m.period)) / 2;
    return {
      transform: [
        { translateX: t * m.dx * w },
        { translateY: t * m.dy * h },
        { scale: 1 + t * m.ds },
      ],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: w * m.x, top: h * m.y, width: sw, height: sh }, pokret]}>
      <Svg width={sw} height={sh}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={boja} stopOpacity={alfa} />
            <Stop offset="0.35" stopColor={boja} stopOpacity={alfa * 0.72} />
            <Stop offset="0.7" stopColor={boja} stopOpacity={alfa * 0.24} />
            <Stop offset="1" stopColor={boja} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={sw} height={sh} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
