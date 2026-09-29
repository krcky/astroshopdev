import * as React from 'react';
import { Image } from 'react-native';

/**
 * Ikonice odeljaka tumacenja — Efekat, Pazi, Savet (Ivan, 28.9.2026): 3D slike
 * iz `files/<odeljak>.png`, smanjene na 144 px u `assets/images/ikone/`.
 * Iste na kartici "Tvoj dan" i u dugom tekstu tranzita.
 */
export type Odeljak = 'efekat' | 'pazi' | 'savet';

const SLIKE: Record<Odeljak, number> = {
  efekat: require('../../assets/images/ikone/efekat.png'),
  pazi: require('../../assets/images/ikone/pazi.png'),
  savet: require('../../assets/images/ikone/savet.png'),
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
