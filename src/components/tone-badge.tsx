import * as React from 'react';
import { View } from 'react-native';
import { ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react-native';

import { neutral } from '@/theme/tokens';
import { TONE_LABEL, type Tone } from '@/lib/tone';

/**
 * Boje tona (Ivan, 28.9.2026). Zelena i roze su njegove; Mesovito je topla
 * neutralna izmedju njih — NE zuta (do 29.9.2026 zlatna je bila boja placenog;
 * sada je to indigo, pravilo 2). Roze je ista kao minus u "Koci te" na pocetnoj.
 */
export const TONE_COLOR: Record<Tone, string> = {
  povoljno: '#66BB6A',
  izazovno: '#F8B3C3',
  mesovito: '#D9D1C3',
};

/** Ikonica umesto reci (Ivan, 28.9.2026): gore, dole, oba smera. */
const TONE_ICON: Record<Tone, typeof TrendingUp> = {
  povoljno: TrendingUp,
  izazovno: TrendingDown,
  mesovito: ArrowRightLeft,
};

/** Obojen kruzic sa ikonicom tona. Rec ide u `accessibilityLabel`, za VoiceOver. */
export function ToneBadge({ tone, size = 26 }: { tone: Tone; size?: number }) {
  const Ikona = TONE_ICON[tone];
  return (
    <View
      accessible
      accessibilityLabel={`Ton: ${TONE_LABEL[tone]}`}
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: TONE_COLOR[tone], alignItems: 'center', justifyContent: 'center',
      }}>
      <Ikona size={Math.round(size * 0.58)} color={neutral.ink} strokeWidth={2.2} />
    </View>
  );
}
