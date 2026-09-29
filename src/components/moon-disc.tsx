import * as React from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import { mesecSlika } from '@/lib/moon';

/**
 * Mesec kakav je sada: jedna od 30 ilustracija (`assets/images/mesec/`), po uglu faze.
 *
 * Svih 30 je napravljeno iz jedne slike punog Meseca (`scripts/mesec-faze.ts`,
 * Ivan 28.9.2026), pa su kadar i tekstura isti i Mesec ne skace kad se promeni dan.
 * Slika se bira po UGLU (`mesecSlika`), da oblik odgovara procentu pored nje.
 */
const SLIKE: ImageSourcePropType[] = [
  require('../../assets/images/mesec/mesec-01.png'),
  require('../../assets/images/mesec/mesec-02.png'),
  require('../../assets/images/mesec/mesec-03.png'),
  require('../../assets/images/mesec/mesec-04.png'),
  require('../../assets/images/mesec/mesec-05.png'),
  require('../../assets/images/mesec/mesec-06.png'),
  require('../../assets/images/mesec/mesec-07.png'),
  require('../../assets/images/mesec/mesec-08.png'),
  require('../../assets/images/mesec/mesec-09.png'),
  require('../../assets/images/mesec/mesec-10.png'),
  require('../../assets/images/mesec/mesec-11.png'),
  require('../../assets/images/mesec/mesec-12.png'),
  require('../../assets/images/mesec/mesec-13.png'),
  require('../../assets/images/mesec/mesec-14.png'),
  require('../../assets/images/mesec/mesec-15.png'),
  require('../../assets/images/mesec/mesec-16.png'),
  require('../../assets/images/mesec/mesec-17.png'),
  require('../../assets/images/mesec/mesec-18.png'),
  require('../../assets/images/mesec/mesec-19.png'),
  require('../../assets/images/mesec/mesec-20.png'),
  require('../../assets/images/mesec/mesec-21.png'),
  require('../../assets/images/mesec/mesec-22.png'),
  require('../../assets/images/mesec/mesec-23.png'),
  require('../../assets/images/mesec/mesec-24.png'),
  require('../../assets/images/mesec/mesec-25.png'),
  require('../../assets/images/mesec/mesec-26.png'),
  require('../../assets/images/mesec/mesec-27.png'),
  require('../../assets/images/mesec/mesec-28.png'),
  require('../../assets/images/mesec/mesec-29.png'),
  require('../../assets/images/mesec/mesec-30.png'),
];

export function MoonDisc({ angle, size = 64 }: { angle: number; size?: number }) {
  return <Image source={SLIKE[mesecSlika(angle) - 1]} style={{ width: size, height: size }} />;
}
