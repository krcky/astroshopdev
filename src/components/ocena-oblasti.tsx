import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OCENA_MAX } from '@/lib/oblasti-config';
import { oceneOblasti, type OblastiDana } from '@/lib/oblasti';

/**
 * Ocena oblasti 1—5 kao tackice (●●●○○), na slajdu "Danas ukratko". Crno i svetlosivo, bez boje: ocena je
 * informacija, ne ukras. VoiceOver cita zaglavlje oblasti, ne tackice.
 */
export function OcenaTackice({ ocena }: { ocena: number }) {
  return (
    <View className="flex-row gap-1" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: OCENA_MAX }, (_, i) => (
        <View key={i} className={cn('h-2 w-2 rounded-pill', i < ocena ? 'bg-foreground' : 'bg-fill-strong')} />
      ))}
    </View>
  );
}

/**
 * Ocene oblasti — zbijena kartica iznad sazetka na slajdu "Danas ukratko"
 * (Ivan, 28.9.2026). Cetiri reda bez linija: ikona i naziv levo, tackice desno;
 * oznaka ("Dobar dan") je samo u VoiceOver-u, da kartica bude sto niza. Ocene iz
 * `oceneOblasti` (`lib/oblasti.ts`). Dodir vodi na tab "Tranziti".
 */
export function OceneOblasti({ rez }: { rez: OblastiDana }) {
  const ocene = oceneOblasti(rez);
  return (
    <Pressable
      onPress={() => router.navigate('/daily')}
      accessibilityRole="button"
      accessibilityLabel={ocene.map((o) => `${o.name}, ocena ${o.ocena} od 5, ${o.oznaka}`).join('. ') + '.'}
      accessibilityHint="Otvara tranzite"
      className={cn(CARD_SURFACE, 'px-4 py-2.5 active:opacity-80')}>
      {ocene.map((o) => (
        <View key={o.key} className="flex-row items-center gap-2 py-1">
          <Text variant="caption">{o.emoji}</Text>
          <Text variant="default" className="flex-1 font-medium text-foreground">{o.name}</Text>
          <OcenaTackice ocena={o.ocena} />
        </View>
      ))}
    </Pressable>
  );
}
