import * as React from 'react';
import { Image } from 'react-native';

import type { LunarArea } from '@/lib/moon';

/**
 * Boja ikonica oblasti i punih tackica ocene — svetla lila, ista kao izabrani
 * tab (`IZABRANI` u `app/(tabs)/_layout.tsx`, Ivan 27.9.2026). Ikonice su
 * Ivanove (`files/*-active.svg`, 28.9.2026) i stigle su u toj boji.
 */
export const OBLAST_BOJA = '#B39DDB';

/**
 * Ikonice oblasti (Ivan, 28.9.2026, drugi krug): 3D slike u lila tonu iz
 * `files/<oblast>.png`, smanjene na 144 px u `assets/images/ikone/`. Zamenile su
 * ravne SVG ikonice (`files/*-active.svg`).
 */
/** Dodatne ikonice za krug zivota (Ivan, 8.10.2026): Finansije, Zabava, Prijateljstvo. */
export type IkonaOblasti = LunarArea | 'finansije' | 'zabava' | 'prijateljstvo';

const SLIKE: Record<IkonaOblasti, number> = {
  ljubav: require('../../assets/images/ikone/ljubav.png'),
  zdravlje: require('../../assets/images/ikone/zdravlje.png'),
  karijera: require('../../assets/images/ikone/karijera.png'),
  kuca: require('../../assets/images/ikone/kuca.png'),
  basta: require('../../assets/images/ikone/basta.png'),
  finansije: require('../../assets/images/ikone/finansije.png'),
  zabava: require('../../assets/images/ikone/zabava.png'),
  prijateljstvo: require('../../assets/images/ikone/prijateljstvo.png'),
};

/** Neizabrana oblast (tab na ekranu Mesec, kapsula na kartici) — slika se ne boji, nego prigusi. */
const NEAKTIVNA = 0.4;

/**
 * Ikona oblasti (Ljubav, Zdravlje, Karijera, Kuca, Basta) u kvadratu `size` x
 * `size`, slika zadrzava razmeru. `aktivna={false}` je prigusena.
 */
export function OblastIkona({ oblast, size = 20, aktivna = true }: {
  oblast: IkonaOblasti;
  size?: number;
  aktivna?: boolean;
}) {
  return (
    <Image
      source={SLIKE[oblast]}
      style={{ width: size, height: size, opacity: aktivna ? 1 : NEAKTIVNA }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
