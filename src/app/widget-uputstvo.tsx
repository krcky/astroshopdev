import * as React from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { SheetGrabber, dnoLista } from '@/components/sheet';
import { WidgetSlika } from '@/components/widget-poziv';
import { useT } from '@/i18n';

/**
 * Kako se dodaje widget "Nebo sada" — list odozdo, visok koliko sadrzaj (`LIST_PO_SADRZAJU`),
 * sa kartice na tabu "Nebo" (Ivan, 13.10.2026). iOS ne dozvoljava aplikaciji da widget doda sama,
 * pa su tu tri koraka; na Androidu se list otvara samo kad pokretac nema dijalog za dodavanje.
 */
export default function WidgetUputstvo() {
  const t = useT().karta.widget;
  const insets = useSafeAreaInsets();
  const android = Platform.OS === 'android';
  const koraci = android ? t.koraciAndroid : t.koraciIos;
  return (
    <View className="bg-background px-6 pt-8" style={dnoLista(insets.bottom)}>
      <SheetGrabber />
      <Text variant="naslovLista">{t.listNaslov}</Text>
      <Text variant="reading" className="mt-3">{t.listUvod}</Text>

      <View className="mt-6 items-center">
        <WidgetSlika strana={132} />
      </View>

      <View className="mt-6 gap-4">
        {koraci.map((korak, i) => (
          <View key={korak} className="flex-row gap-3">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-fill">
              <Text variant="row">{i + 1}</Text>
            </View>
            <Text variant="row" className="flex-1 pt-0.5">{korak}</Text>
          </View>
        ))}
      </View>

      {android ? null : <Text variant="muted" className="mt-6">{t.napomenaIos}</Text>}
    </View>
  );
}
