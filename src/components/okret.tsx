import * as React from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, {
  useAnimatedStyle, useFrameCallback, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';

import { probudi, useBudnost, useUstedaBaterije } from '@/store/budnost';

/**
 * Pun okret: 60 s, ravnomerno (Ivan, 30.9.2026: "malo brze, ne vidim animaciju";
 * u dnevnoj prici je 240 s, sto se na telefonu ne primeti). Mesec (`moon-disc.tsx`)
 * i velika planeta na "Tvom danu" (`tvoj-dan-card.tsx`).
 */
const OKRET_MS = 60_000;
/** Zalet i kocenje okretanja kad se korisnik vrati ili zamiri (kao preliv, `screen.tsx`). */
const ZALET_MS = 800;
const KOCENJE_MS = 1_500;

/**
 * Okretanje kao ukrasni pokret koji traje (CLAUDE.md, pravilo 17): samo na ekranu u
 * fokusu, 20 s posle poslednjeg dodira uspori do nule (`useBudnost`), a uz "Smanji
 * pokrete" i u rezimu ustede baterije ne okrece se uopste. Ugao tece po kadrovima na
 * niti za animaciju, pa ne ceka JS.
 */
export function Okret({ children }: { children: React.ReactNode }) {
  const budan = useBudnost((s) => s.budan);
  const usteda = useUstedaBaterije();
  const bezPokreta = useReducedMotion();
  const ugao = useSharedValue(0);
  const brzina = useSharedValue(1);
  const kadar = useFrameCallback((f) => {
    ugao.set((ugao.get() + ((f.timeSincePreviousFrame ?? 0) / OKRET_MS) * 360 * brzina.get()) % 360);
  }, false);

  useFocusEffect(React.useCallback(() => { probudi(); }, []));
  useFocusEffect(
    React.useCallback(() => {
      if (bezPokreta || usteda) return;
      kadar.setActive(true);
      if (budan) {
        brzina.set(withTiming(1, { duration: ZALET_MS }));
        return () => kadar.setActive(false);
      }
      brzina.set(withTiming(0, { duration: KOCENJE_MS }));
      const t = setTimeout(() => kadar.setActive(false), KOCENJE_MS + 50);
      return () => { clearTimeout(t); kadar.setActive(false); };
    }, [bezPokreta, usteda, budan, kadar, brzina])
  );

  const stil = useAnimatedStyle(() => ({ transform: [{ rotate: `${ugao.get()}deg` }] }));
  return <Animated.View style={stil}>{children}</Animated.View>;
}
