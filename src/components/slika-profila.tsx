import * as React from 'react';
import { Image as RNImage, View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from '@/components/ui/text';
import { SLIKA as SLIKA_PLANETE } from '@/components/planete-par';
import { inicijali, useSlikaProfila } from '@/lib/slika-profila';

/**
 * Krug sa slikom profila (Ivan, 29.9.2026) — svoja slika ili slika Google naloga
 * (`lib/slika-profila.ts`). BEZ SLIKE stoji ilustracija VLADAJUCE PLANETE
 * korisnika (`vladar`, iz `lib/rulers.ts`), iste slike kao na karticama tranzita;
 * inicijali samo ako ni ona ne postoji. Planeta nije u krugu: Saturn i Uran imaju
 * prstenove koji bi se odsekli.
 */
export function SlikaProfila({ ime, vladar, velicina = 88 }: { ime: string; vladar?: string; velicina?: number }) {
  const slika = useSlikaProfila();
  const krug = { width: velicina, height: velicina, borderRadius: velicina / 2 };
  const planeta = vladar ? SLIKA_PLANETE[vladar] : undefined;

  if (!slika && planeta) {
    return (
      <View style={{ width: velicina, height: velicina }}>
        <RNImage source={planeta} style={{ width: velicina, height: velicina }} resizeMode="contain"
          accessibilityIgnoresInvertColors />
      </View>
    );
  }

  return (
    <View style={krug} className="items-center justify-center overflow-hidden bg-fill-strong">
      <Text
        className="text-muted-foreground"
        style={{ fontSize: velicina * 0.36, lineHeight: velicina * 0.44 }}
        accessibilityElementsHidden>
        {inicijali(ime)}
      </Text>
      {slika && (
        <Image
          source={{ uri: slika.uri, cacheKey: slika.cacheKey }}
          style={[krug, { position: 'absolute' }]}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}
