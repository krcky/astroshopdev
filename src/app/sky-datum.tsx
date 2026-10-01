import * as React from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { SheetGrabber, dnoLista } from '@/components/sheet';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { danZaKalendar, zoneClock } from '@/lib/sky';
import { useMestoNeba } from '@/store/sky-place';
import { useSkyTimeStore } from '@/store/sky-time';
import { useT } from '@/i18n';

/**
 * Kalendar za ekran "Trenutno na nebu" — list odozdo sa dugmeta sa datumom
 * (Ivan, 28.9.2026). Dodir na dan pomera nebo na taj dan i zatvara list; sat
 * ostaje onaj sa ekrana.
 *
 * Kalendar radi u zoni UREDJAJA, a nebo u zoni mesta posmatranja, pa mu se daje
 * nosilac dana (`danZaKalendar`), ne trenutak — vidi `lib/sky.ts`.
 *
 * iOS: ugradjen kalendar (`display="inline"`). Android na ovaj list ne dolazi —
 * tamo dugme odmah otvara sistemski dijalog sa kalendarom (`sky.tsx`). Veb nema
 * kalendar iz paketa, pa dobija polja za dan, mesec i godinu.
 */
export default function SkyDatum() {
  const t = useT();
  const grad = useMestoNeba();
  const izabran = useSkyTimeStore((s) => s.izabran);
  const izaberiDan = useSkyTimeStore((s) => s.izaberiDan);
  const insets = useSafeAreaInsets();
  // Trenutak se uzima jednom, pri otvaranju: oko ponoci kalendar inace ne bi
  // znao koji je "danasnji" dan dok je otvoren.
  const [trenutak] = React.useState(() => izabran ?? new Date());
  // Na vebu polja menjaju dan jedno po jedno, pa se list ne zatvara na svaku izmenu.
  const [webDan, setWebDan] = React.useState<Date | null>(null);

  if (!grad) return null;
  const nosilac = danZaKalendar(trenutak, grad.tz);

  const izaberi = (d: Date) => {
    izaberiDan(d, grad.tz);
    router.back();
  };

  return (
    <View className="bg-background px-6 pt-8" style={dnoLista(insets.bottom)}>
      <SheetGrabber />
      <Text variant="naslovLista">{t.karta.datumNeba.naslov}</Text>
      <Text variant="body" className="mt-2">
        {t.karta.datumNeba.opis(grad.name, zoneClock(trenutak, grad.tz))}
      </Text>

      <View className="mt-4">
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={nosilac}
            mode="date"
            display="inline"
            // "sr-RS" na iOS-u daje CIRILICU — za latinicu mora "sr-Latn-RS" (`wheel-picker.tsx`).
            locale={t.gramatika.locale}
            // Svetla lila, ista kao "i" pored tocka na "Ti" (Ivan, 28.9.2026: danasnji
            // dan svetlo ljubicast, ne indigo). Boji i strelice za mesec.
            accentColor={OBLAST_BOJA}
            themeVariant="light"
            onValueChange={(_e, d) => izaberi(d)}
          />
        ) : (
          <WheelPicker mode="date" value={webDan ?? nosilac} onChange={(d) => {
            setWebDan(d);
            izaberiDan(d, grad.tz);
          }} />
        )}
      </View>
    </View>
  );
}
