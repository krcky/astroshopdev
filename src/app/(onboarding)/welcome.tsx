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
import { IzborJezika } from '@/components/izbor-jezika';

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
            {/* Obecanje u jednoj recenici (Ivan, 2.10.2026, opcija A) — pre "Est. 2004": prvo sta dobijas, pa ko stoji iza. */}
            <Text variant="body" className="mt-3 max-w-[250px] text-center">{t.onboarding.welcome.obecanje}</Text>
            <Text variant="label" className="mt-3">{t.onboarding.welcome.podnaslov}</Text>
          </View>

          <View className="mt-12">
            {/* Istaknuto crno dugme (preliv, sjaj, senka), isto kao "Saznaj više" na
                pocetnoj (Ivan, 29.9.2026). Natpis "Izracunaj moju kartu" (2.10.2026; "Napravi nalog" je obecavao nalog a sledi izbor datuma), a tok ostaje: prvo
                podaci o rodjenju i velika trojka, nalog posle (pravilo 14). */}
            <Button size="lg" istaknuto onPress={start}>
              <Text>{t.onboarding.welcome.izracunajKartu}</Text>
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
        {/* Jezik na DNU ekrana, centrirano (Ivan, 2.10.2026): zastava + ime, meni sa svih sest
            jezika. Bez izbora je srpski. */}
        <View className="items-center pb-4">
          <IzborJezika />
        </View>
      </SafeAreaView>
      <ScreenBackdrop />
    </View>
  );
}
