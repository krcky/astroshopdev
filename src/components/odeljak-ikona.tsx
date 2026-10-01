import * as React from 'react';
import { Image } from 'react-native';

import type { VrstaSekcije } from '@/lib/tumacenje';

/**
 * Ikonice odeljaka tumacenja — 3D slike iz `files/<odeljak>.png`, smanjene na 144 px
 * (duza strana) u `assets/images/ikone/`. Efekat, Pazi, Savet (Ivan, 28.9.2026) su i na
 * kartici "Tvoj dan"; Suština (bocica), Dugoročni efekti (pescani sat), Specifične sfere
 * (kugle na tacni) i Opšte preporuke (kompas) samo u dugom tekstu (Ivan, 1.10.2026 —
 * do tada sistemske ikonice, nisu se slagale sa 3D slikama).
 */
export type Odeljak = VrstaSekcije;

const SLIKE: Record<Odeljak, number> = {
  efekat: require('../../assets/images/ikone/efekat.png'),
  pazi: require('../../assets/images/ikone/pazi.png'),
  savet: require('../../assets/images/ikone/savet.png'),
  sustina: require('../../assets/images/ikone/sustina.png'),
  dugorocno: require('../../assets/images/ikone/dugorocno.png'),
  sfere: require('../../assets/images/ikone/sfere.png'),
  preporuke: require('../../assets/images/ikone/preporuke.png'),
};

export function OdeljakIkona({ odeljak, size = 18 }: { odeljak: Odeljak; size?: number }) {
  return (
    <Image
      source={SLIKE[odeljak]}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
