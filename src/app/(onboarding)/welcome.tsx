import * as React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { KrugLoga } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { ScreenBackdrop } from '@/components/screen';
import { useDraft } from '@/store/draft';
import { useT } from '@/i18n';

/**
 * Prvi ekran bez naloga (Ivan, 29.9.2026): krug loga koji se vrti, ime,
 * podnaslov i dva dugmeta — sve zajedno na vertikalnoj sredini ekrana. Kartica
 * "Tvoj dan ukratko" je izbacena: bila je isti primer svaki dan, pa je obecavala
 * "tvoj dan" koji nije ni tvoj ni danasnji.
 */
export default function Welcome() {
  const t = useT();
  const reset = useDraft((s) => s.reset);
  const start = () => { reset(); router.push('/date'); };

  return (
    <View className="flex-1 bg-grouped">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-5">
          <View className="items-center">
            {/* Krug loga koji se vrti, kao u zaglavlju "Danas" (Ivan, 29.9.2026): 48 -> 96 -> +30% = 125. */}
            <KrugLoga size={125} />
            {/* Ime i podnaslov po Ivanu (29.9.2026); pre toga "Astroshop" / "Horoskop koji je stvarno tvoj". */}
            <Text variant="display" className="mt-5 text-5xl">{t.opste.imeAplikacije}</Text>
            <Text variant="label" className="mt-3">{t.onboarding.welcome.podnaslov}</Text>
          </View>

          <View className="mt-12">
            {/* Istaknuto crno dugme (preliv, sjaj, senka), isto kao "Saznaj više" na
                pocetnoj (Ivan, 29.9.2026). Natpis "Napravi nalog", a tok ostaje: prvo
                podaci o rodjenju i velika trojka, nalog posle (pravilo 14). */}
            <Button size="lg" istaknuto onPress={start}>
              <Text>{t.onboarding.welcome.napraviNalog}</Text>
            </Button>
            <Pressable
              onPress={() => router.push('/account')}
              accessibilityRole="button"
              className="mt-5 items-center py-2 active:opacity-60">
              <Text variant="label" className="text-foreground underline">
                {t.onboarding.welcome.vecImamNalog}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
      <ScreenBackdrop />
    </View>
  );
}
