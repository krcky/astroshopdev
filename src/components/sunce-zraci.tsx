import * as React from 'react';
import { Image, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue } from 'react-native-reanimated';

import { useUstedaBaterije } from '@/store/budnost';

/** Jedan pun okret zraka (s) — sporo. */
const OKRET_S = 90;
/** Prečnik lica u odnosu na celu sliku sa zracima (izmereno na `sunce-kraci.png`: disk ~226 od 530 px). */
const LICE = 0.43;

/**
 * SUNCE SA ZRACIMA (Ivan, 13.10.2026): slika sa zracima (`sunce-kraci.png`) se SPORO VRTI sve vreme, a lice (`sunce-lice.png`,
 * neprozirni disk) stoji ISPOD NJE... tacnije IZNAD nje i prekriva lice koje se okrece, pa izgleda kao da se samo zraci
 * vrte oko nepomicnog lica. Vrti se stalno, kao krug loga (ne staje posle mirovanja); uz "Smanji pokrete" i u ustedi baterije stoji.
 */
export function SunceSaZracima({ size }: { size: number }) {
  const bezPokreta = useReducedMotion();
  const usteda = useUstedaBaterije();
  const ugao = useSharedValue(0);
  const kadar = useFrameCallback((f) => {
    ugao.set((ugao.get() + ((f.timeSincePreviousFrame ?? 0) / 1000 / OKRET_S) * 360) % 360);
  }, false);
  useFocusEffect(React.useCallback(() => {
    if (bezPokreta || usteda) return;
    kadar.setActive(true);
    return () => kadar.setActive(false);
  }, [bezPokreta, usteda, kadar]));
  const stil = useAnimatedStyle(() => ({ transform: [{ rotate: `${ugao.get()}deg` }] }));
  const lice = size * LICE;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, stil]}>
        <Image source={require('../../assets/images/tema-dana/sunce-kraci.png')} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
      <Image
        source={require('../../assets/images/tema-dana/sunce-lice.png')}
        style={{ position: 'absolute', left: (size - lice) / 2, top: (size - lice) / 2, width: lice, height: lice }}
        resizeMode="contain"
      />
    </View>
  );
}
