import * as React from 'react';
import { View } from 'react-native';
import { Image, type ImageRef } from 'expo-image';
import { mesecSlika } from '@/lib/moon';
import { Okret } from '@/components/okret';

/**
 * Mesec kakav je sada: jedna od 30 ilustracija (`assets/images/mesec/`), po uglu faze.
 *
 * Svih 30 je napravljeno iz jedne slike punog Meseca (`scripts/mesec-faze.ts`,
 * Ivan 28.9.2026), pa su kadar i tekstura isti i Mesec ne skace kad se promeni dan.
 * Slika se bira po UGLU (`mesecSlika`), da oblik odgovara procentu pored nje.
 */
const SLIKE: number[] = [
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

/**
 * Mesec koji se vrti (`vrti`) je u DVA sloja (Ivan, 7.10.2026: "okrece se i senka sa njim —
 * nije verodostojno"): tekstura punog Meseca se okrece, a senka stoji — Sunce ne prati
 * okretanje. Obe slike pravi `scripts/mesec-faze.ts`; disk daje okvir sa `borderRadius`.
 */
const PUN: number = require('../../assets/images/mesec/pun.png');
const SENKE: number[] = [
  require('../../assets/images/mesec/senka-01.png'),
  require('../../assets/images/mesec/senka-02.png'),
  require('../../assets/images/mesec/senka-03.png'),
  require('../../assets/images/mesec/senka-04.png'),
  require('../../assets/images/mesec/senka-05.png'),
  require('../../assets/images/mesec/senka-06.png'),
  require('../../assets/images/mesec/senka-07.png'),
  require('../../assets/images/mesec/senka-08.png'),
  require('../../assets/images/mesec/senka-09.png'),
  require('../../assets/images/mesec/senka-10.png'),
  require('../../assets/images/mesec/senka-11.png'),
  require('../../assets/images/mesec/senka-12.png'),
  require('../../assets/images/mesec/senka-13.png'),
  require('../../assets/images/mesec/senka-14.png'),
  require('../../assets/images/mesec/senka-15.png'),
  require('../../assets/images/mesec/senka-16.png'),
  require('../../assets/images/mesec/senka-17.png'),
  require('../../assets/images/mesec/senka-18.png'),
  require('../../assets/images/mesec/senka-19.png'),
  require('../../assets/images/mesec/senka-20.png'),
  require('../../assets/images/mesec/senka-21.png'),
  require('../../assets/images/mesec/senka-22.png'),
  require('../../assets/images/mesec/senka-23.png'),
  require('../../assets/images/mesec/senka-24.png'),
  require('../../assets/images/mesec/senka-25.png'),
  require('../../assets/images/mesec/senka-26.png'),
  require('../../assets/images/mesec/senka-27.png'),
  require('../../assets/images/mesec/senka-28.png'),
  require('../../assets/images/mesec/senka-29.png'),
  require('../../assets/images/mesec/senka-30.png'),
];

/**
 * UCITANO UNAPRED (Ivan, 29.9.2026: "kad se otvori lunarni malo se ceka"). Obican RN
 * `Image` je svaku sliku ucitavao i dekodirao tek kad se pojavi — kalendar ima do 42
 * Meseca, pa su se pojavljivali jedan po jedan, i pri svakom listanju meseca. Sada se
 * svih 30 (2,8 MB) dekodira jednom, cim se modul uveze (pocetna ga uvozi odmah), i
 * crta se iz memorije (`ImageRef`). Dok referenca ne stigne, crta se iz fajla sa
 * kesom u memoriji — isti izgled, samo bez garancije da je vec dekodirano.
 */
const GOTOVE: (ImageRef | null)[] = SLIKE.map(() => null);
SLIKE.forEach((s, i) => {
  Image.loadAsync(s).then((ref) => { GOTOVE[i] = ref; }).catch(() => { /* ostaje fajl */ });
});
const GOTOVE_SENKE: (ImageRef | null)[] = SENKE.map(() => null);
SENKE.forEach((s, i) => {
  Image.loadAsync(s).then((ref) => { GOTOVE_SENKE[i] = ref; }).catch(() => { /* ostaje fajl */ });
});

export function MoonDisc({ angle, size = 64, vrti = false }: {
  angle: number;
  size?: number;
  /**
   * Polako se okrece (Ivan, 30.9.2026: "isto kao na storyju") — "Mesec danas" na
   * pocetnoj i veliki Mesec u lunarnom kalendaru. Sitni Meseci (kalendar) ne.
   * Okrece se samo tekstura, senka stoji na mestu (7.10.2026).
   */
  vrti?: boolean;
}) {
  const i = mesecSlika(angle) - 1;
  if (vrti) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }} accessibilityIgnoresInvertColors>
        <Okret>
          <Image source={PUN} cachePolicy="memory" transition={0} style={{ width: size, height: size }} />
        </Okret>
        <Image
          source={GOTOVE_SENKE[i] ?? SENKE[i]}
          cachePolicy="memory"
          transition={0}
          pointerEvents="none"
          style={{ position: 'absolute', width: size, height: size }}
        />
      </View>
    );
  }
  const slika = (
    <Image
      source={GOTOVE[i] ?? SLIKE[i]}
      cachePolicy="memory"
      transition={0}
      style={{ width: size, height: size }}
      accessibilityIgnoresInvertColors
    />
  );
  return slika;
}
