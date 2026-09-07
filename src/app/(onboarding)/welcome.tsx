import * as React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { moonPhase, planetPositions } from '@/lib/astro';
import { useDraft } from '@/store/draft';

export default function Welcome() {
  const reset = useDraft((s) => s.reset);

  // Kartica prikazuje STVARNO danasnje nebo, ne izmisljen primer.
  const sky = React.useMemo(() => {
    const now = new Date();
    const moon = planetPositions(now).find((p) => p.key === 'moon')!;
    return { moon, phase: moonPhase(now) };
  }, []);

  const start = () => { reset(); router.push('/date'); };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 px-5">

          <View className="items-center pt-10">
            <Text variant="display" className="text-5xl">Astroshop</Text>
            <Text variant="label" className="mt-3">Horoskop koji je stvarno tvoj</Text>
          </View>

          <View className="flex-1 justify-center">
            <View className="rounded-xl border border-border p-6">
              <Text variant="label" className="text-center">Tvoj dan ukratko</Text>

              <Text variant="display" className="mt-4 text-center text-3xl">
                Prestani da se ubeđuješ.
              </Text>

              <View className="mt-6 flex-row items-center justify-center gap-2">
                <Glyph size={18} className="text-muted-foreground">{sky.moon.position.sign.glyph}</Glyph>
                <Text variant="muted" className="text-xs">
                  Mesec u znaku {sky.moon.position.sign.name} · {sky.phase.name}
                </Text>
              </View>

              <View className="mt-7 flex-row">
                <View className="flex-1 items-center">
                  <Text variant="label" className="mb-3">Ide</Text>
                  {['Iskrenost', 'Odmor', 'Stari planovi'].map((t) => (
                    <Text key={t} className="py-0.5 text-base">{t}</Text>
                  ))}
                </View>
                <View className="w-px bg-border" />
                <View className="flex-1 items-center">
                  <Text variant="label" className="mb-3">Ne ide</Text>
                  {['Ubeđivanje', 'Velike kupovine', 'Izgovori'].map((t) => (
                    <Text key={t} className="py-0.5 text-base text-muted-foreground">{t}</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View className="pb-2">
            <Button size="lg" onPress={start}>
              <Text>Započni</Text>
            </Button>
            <Pressable
              onPress={() => router.push('/account')}
              accessibilityRole="button"
              className="mt-5 items-center py-2 active:opacity-60">
              <Text variant="label" className="text-foreground underline">
                Već imam nalog
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
