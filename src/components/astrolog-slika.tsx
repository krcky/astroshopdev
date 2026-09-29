import * as React from 'react';
import { Image, View } from 'react-native';

import { ASTROLOG } from '@/lib/pitanja';

const SLIKA = require('../../assets/images/boban-vujovic.png');

/**
 * Astrolog u krugu — tab "Pitaj", list za pitanje, potvrda, odgovor.
 *
 * Slika je glava i ramena na PROVIDNOJ pozadini (`scripts/boban-krug.swift`,
 * 384 px = 128pt na 3x), pa boju kruga daje ovaj okvir: siva `fill-strong`
 * stoji i na beloj i na sivoj pozadini, a seda kosa se na njoj jos vidi.
 */
export function AstrologSlika({ velicina }: { velicina: number }) {
  return (
    <View
      className="overflow-hidden rounded-full bg-fill-strong"
      style={{ width: velicina, height: velicina }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={ASTROLOG.ime}>
      <Image source={SLIKA} style={{ width: velicina, height: velicina }} resizeMode="cover" />
    </View>
  );
}
