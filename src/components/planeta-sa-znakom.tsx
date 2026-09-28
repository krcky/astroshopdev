import * as React from 'react';
import { Image, type ImageSourcePropType } from 'react-native';

/**
 * Slika planete sa njenim znakom u crnom krugu (Ivan, 28.9.2026;
 * `files/*-sa-znakom.png`). U `assets/images/planete-znak/` su isecene po
 * sadrzaju (Saturn i Uran su imali prazne providne ivice), imena po kljucu tela.
 */
const SLIKA: Record<string, { izvor: ImageSourcePropType; w: number; h: number }> = {
  sun: { izvor: require('../../assets/images/planete-znak/sun.png'), w: 279, h: 232 },
  moon: { izvor: require('../../assets/images/planete-znak/moon.png'), w: 250, h: 234 },
  mercury: { izvor: require('../../assets/images/planete-znak/mercury.png'), w: 280, h: 233 },
  venus: { izvor: require('../../assets/images/planete-znak/venus.png'), w: 278, h: 232 },
  mars: { izvor: require('../../assets/images/planete-znak/mars.png'), w: 280, h: 233 },
  jupiter: { izvor: require('../../assets/images/planete-znak/jupiter.png'), w: 278, h: 232 },
  saturn: { izvor: require('../../assets/images/planete-znak/saturn.png'), w: 446, h: 270 },
  uranus: { izvor: require('../../assets/images/planete-znak/uranus.png'), w: 350, h: 225 },
  neptune: { izvor: require('../../assets/images/planete-znak/neptune.png'), w: 275, h: 230 },
  pluto: { izvor: require('../../assets/images/planete-znak/pluto.png'), w: 278, h: 232 },
};

export function imaSlikuSaZnakom(key: string): boolean {
  return key in SLIKA;
}

/**
 * Visina je zadata, sirina ide po razmeri slike — Saturn i Uran sa prstenom su
 * siri od ostalih, pa bi u kvadratu ispali sitni.
 */
export function PlanetaSaZnakom({ planeta, visina }: { planeta: string; visina: number }) {
  const s = SLIKA[planeta];
  if (!s) return null;
  return (
    <Image
      source={s.izvor}
      style={{ height: visina, width: (visina * s.w) / s.h }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
