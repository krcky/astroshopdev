import * as React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { useVremeVidea } from '@/components/prica/sat';
import { polozajZnaka, ugaoLoga } from '@/lib/logo-price';
import { LOGO_KRUG as K, LOGO_LUKOVI, LOGO_MREZA, LOGO_PRSTEN, LOGO_SLOVA, LOGO_SUNCE, LOGO_ZNAKOVI, type Putanja, type ZnakLoga } from '@/lib/logo-price-oblici';

/** Boje iz `files/logo-story-*.svg`: krug indigo, slova tamnosiva; negativ sve belo. */
const BOJE = {
  pozitiv: { krug: '#403F98', slova: '#424242' },
  negativ: { krug: '#FFFFFF', slova: '#FFFFFF' },
} as const;

const Deo = ({ p, boja }: { p: Putanja; boja: string }) => (
  <Path d={p.d} fill={boja} fillRule={p.evenodd ? 'evenodd' : 'nonzero'} clipRule={p.evenodd ? 'evenodd' : 'nonzero'} />
);

/**
 * LOGO "ASTRO ◎ SHOP" na slici i u videu price (`kartica.tsx`), vektorski iz tvog SVG-a.
 * U VIDEU se krug vrti kao u uvodu (`lib/logo-price.ts`): lice miruje, zraci i lukovi se
 * okrecu, znakovi kruze uspravni. Na slici za deljenje nema vremena videa — logo miruje.
 */
export function LogoPrice({ sirina, negativ = false, style }: { sirina: number; negativ?: boolean; style?: StyleProp<ViewStyle> }) {
  const k = sirina / LOGO_MREZA.w;
  const boje = negativ ? BOJE.negativ : BOJE.pozitiv;
  const vreme = useVremeVidea();
  const ugao = useDerivedValue(() => (vreme ? ugaoLoga(vreme.get()) : 0), [vreme]);
  const okret = useAnimatedStyle(() => ({ transform: [{ rotate: `${ugao.get()}deg` }] }));
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const kx = K.cx - K.r;
  const ky = K.cy - K.r;
  return (
    <View style={[{ width: sirina, height: LOGO_MREZA.h * k }, style]}>
      {/* Mirno: slova, spoljni prsten i lice (sunce samo unutar ivice lica). */}
      <Svg width={sirina} height={LOGO_MREZA.h * k} viewBox={`0 0 ${LOGO_MREZA.w} ${LOGO_MREZA.h}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <Mask id={`lice-${id}`}>
            <Circle cx={K.cx} cy={K.cy} r={K.rLice} fill="white" />
          </Mask>
        </Defs>
        {LOGO_SLOVA.map((p, i) => <Deo key={i} p={p} boja={boje.slova} />)}
        <Deo p={LOGO_PRSTEN} boja={boje.krug} />
        <G mask={`url(#lice-${id})`}>
          {LOGO_SUNCE.map((p, i) => <Deo key={i} p={p} boja={boje.krug} />)}
        </G>
      </Svg>
      {/* Okrece se oko sredine kruga: unutrasnji lukovi i zraci (sunce van ivice lica). */}
      <Animated.View style={[{ position: 'absolute', left: kx * k, top: ky * k, width: 2 * K.r * k, height: 2 * K.r * k }, okret]}>
        <Svg width={2 * K.r * k} height={2 * K.r * k} viewBox={`${kx} ${ky} ${2 * K.r} ${2 * K.r}`}>
          <Defs>
            <Mask id={`zraci-${id}`}>
              <Rect x={kx} y={ky} width={2 * K.r} height={2 * K.r} fill="white" />
              <Circle cx={K.cx} cy={K.cy} r={K.rLice} fill="black" />
            </Mask>
          </Defs>
          <Deo p={LOGO_LUKOVI} boja={boje.krug} />
          <G mask={`url(#zraci-${id})`}>
            {LOGO_SUNCE.map((p, i) => <Deo key={i} p={p} boja={boje.krug} />)}
          </G>
        </Svg>
      </Animated.View>
      {/* Znakovi kruze, uspravni. */}
      {LOGO_ZNAKOVI.map((z, i) => <Znak key={i} z={z} k={k} ugao={ugao} boja={boje.krug} />)}
    </View>
  );
}

const RUB = 0.6; // malo mesta oko znaka, da se ivica ne odseca

function Znak({ z, k, ugao, boja }: { z: ZnakLoga; k: number; ugao: SharedValue<number>; boja: string }) {
  const stil = useAnimatedStyle(() => {
    const p = polozajZnaka(z, ugao.get());
    return { left: (p.x - z.w / 2 - RUB) * k, top: (p.y - z.h / 2 - RUB) * k };
  });
  return (
    <Animated.View style={[{ position: 'absolute', width: (z.w + 2 * RUB) * k, height: (z.h + 2 * RUB) * k }, stil]}>
      <Svg width={(z.w + 2 * RUB) * k} height={(z.h + 2 * RUB) * k} viewBox={`${z.x0 - RUB} ${z.y0 - RUB} ${z.w + 2 * RUB} ${z.h + 2 * RUB}`}>
        {z.delovi.map((p, i) => <Deo key={i} p={p} boja={boja} />)}
      </Svg>
    </Animated.View>
  );
}
