import * as React from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/lib/utils';

/**
 * Mesto za tekst koji se jos ucitava — sive trake u obliku redova.
 *
 * iOS obrazac za sadrzaj unutar vec nacrtanog ekrana (SwiftUI
 * `.redacted(reason: .placeholder)`: Weather, News, App Store). Spinner je za
 * ceo ekran bez icega; ovde okvir vec stoji, pa trake cuvaju raspored — kad
 * tekst stigne, nista ne skace.
 *
 * Visine prate `tailwind.config.js` (fontSize): traka je visina slova, ostatak
 * reda je razmak, pa `lines` traka zauzme isto koliko i `lines` redova teksta.
 * Puls je blag (1 -> 0.45); uz "Smanji pokrete" traka miruje.
 */
const RED = {
  /** `body` — 15/20 */
  body: { visina: 12, red: 20 },
  /** veci tekst tela, 17/24 (sazetak "Tvog dana") */
  veliki: { visina: 13, red: 24 },
  /** `display` — 32/38 */
  display: { visina: 26, red: 38 },
  /** naslov tranzita dana na pocetnoj — 24/30 */
  hero: { visina: 20, red: 30 },
} as const;

// Poslednji red kraci, kao pravi pasus; ostali skoro puni.
const SIRINE = ['100%', '96%', '100%', '92%', '98%'] as const;

export function TextPlaceholder({ lines = 3, title, lineType = 'body', className }: {
  /** Broj redova teksta tela. */
  lines?: number;
  /** Visina reda teksta koji stize: `body` 15/20 ili `veliki` 17/24. */
  lineType?: 'body' | 'veliki';
  /** Traka naslova iznad teksta, u visini te varijante. */
  title?: 'display' | 'hero';
  className?: string;
}) {
  const bezPokreta = useReducedMotion();
  const providnost = useSharedValue(1);

  React.useEffect(() => {
    if (bezPokreta) return;
    providnost.set(withRepeat(withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true));
    return () => cancelAnimation(providnost);
  }, [bezPokreta, providnost]);

  const puls = useAnimatedStyle(() => ({ opacity: providnost.get() }));

  const traka = (vrsta: keyof typeof RED, sirina: string, kljuc: React.Key) => (
    <View key={kljuc} style={{ height: RED[vrsta].red, justifyContent: 'center' }}>
      <View className="rounded bg-fill-strong" style={{ height: RED[vrsta].visina, width: sirina as `${number}%` }} />
    </View>
  );

  return (
    <Animated.View
      style={puls}
      className={cn(className)}
      accessible
      accessibilityLabel="Učitavam"
      accessibilityState={{ busy: true }}>
      {title && <View className="mb-2">{traka(title, '70%', 'naslov')}</View>}
      {Array.from({ length: lines }, (_, i) =>
        traka(lineType, i === lines - 1 && lines > 1 ? '60%' : SIRINE[i % SIRINE.length], i),
      )}
    </Animated.View>
  );
}
