import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { Screen } from '@/components/screen';
import { ProfileButton } from '@/components/profile-button';
import { cn } from '@/lib/utils';

/**
 * Pitaj astrologa — tab "Pitaj" (Ivan, 26.9.2026). Svetloplavi preliv.
 *
 * Za sada samo okvir: sta strana radi jos nije odluceno (forma za pitanje,
 * cena, ko odgovara). Kartica ispod to i kaze — ne glumi gotovu funkciju.
 */
export default function AskScreen() {
  return (
    <Screen label="Pitaj astrologa" tint="gold" right={<ProfileButton />}>
      <View className="pt-4" />
      <View className={cn(CARD_SURFACE, 'p-5')}>
        <Text variant="h3">Pitanje za astrologa</Text>
        <Text variant="body" className="mt-2">
          Ovde ćeš moći da postaviš lično pitanje i dobiješ odgovor astrologa. Uskoro.
        </Text>
      </View>
    </Screen>
  );
}
