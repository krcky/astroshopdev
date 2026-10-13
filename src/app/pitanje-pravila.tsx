import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { SheetGrabber, dnoLista } from '@/components/sheet';
import { pitajTeme } from '@/i18n/sr/pitaj-teme';
import { ASTROLOG } from '@/lib/pitanja';

/**
 * "Na šta Boban ne odgovara" — nativni list odozdo, visok koliko sadrzaj (`LIST_PO_SADRZAJU`
 * u `_layout.tsx`), sa reda na ekranu za pisanje pitanja (Ivan, 13.10.2026).
 *
 * Zasto lista a ne provera teksta: "Otac mi je umro u martu, kako da prodjem ovaj period" je
 * dobro pitanje, a provera po reci "umro" bi ga zaustavila. Korisnik zato procita pravila PRE
 * placanja (posle placanja pitanje ne moze da se menja), a polje ostaje slobodno.
 *
 * Tekst je samo na srpskom i ceka astrologa (`i18n/sr/pitaj-teme.ts`); red koji otvara list se na
 * drugim jezicima ne prikazuje. Zatvara se povlacenjem nadole.
 */
export default function PitanjePravila() {
  const p = pitajTeme.pravila;
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-background px-6 pt-8" style={dnoLista(insets.bottom)}>
      <SheetGrabber />
      <Text variant="naslovLista">{p.naslov(ASTROLOG.kratko)}</Text>
      {/* Linije od ivice do ivice sadrzaja; poslednja stavka je bez nje — ispod je zakljucak. */}
      <View className="mt-3">
        {p.stavke.map((s, i) => (
          <View key={s.naslov} className={i < p.stavke.length - 1 ? 'border-b border-border py-3' : 'py-3'}>
            <Text variant="row">{s.naslov}</Text>
            {s.opis ? (
              <Text variant="body" className="mt-0.5">
                {typeof s.opis === 'function' ? s.opis(ASTROLOG.kratko) : s.opis}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
      <Text variant="body" className="mt-3 text-foreground">{p.zakljucak}</Text>
    </View>
  );
}
