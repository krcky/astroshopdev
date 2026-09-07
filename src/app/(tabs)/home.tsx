import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { NeatBackground } from '@/components/neat-gradient';
import { Glyph } from '@/components/ui/glyph';
import { buildPersonalDaily, formatDate } from '@/lib/horoscope';
import { traitsForSign } from '@/lib/traits';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

/** Pregled dana — izlog, ne sadrzaj. Pun tekst je u tabu "Horoskop". */
export default function Home() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();

  const today = React.useMemo(() => new Date(), []);
  const daily = React.useMemo(
    () => (resolved ? buildPersonalDaily(resolved, today) : null),
    [resolved, today]
  );

  if (authLoading || !hydrated) return <View className="flex-1 bg-background" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  const sun = resolved.chart.planets.find((p) => p.key === 'sun')!;
  const moon = resolved.chart.planets.find((p) => p.key === 'moon')!;
  const traits = traitsForSign(sun.position.sign.key);
  const top = daily.entries[0];

  return (
    <View className="flex-1 bg-background">
      <NeatBackground />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}>

          <View className="pt-4 pb-7">
            <Text variant="label">{formatDate(today)}</Text>
            <Text variant="display" className="mt-1">Zdravo, {daily.name}</Text>
          </View>

          {/* Velika trojka — vodi na natalnu kartu */}
          <Pressable
            onPress={() => router.push('/chart')}
            accessibilityRole="button"
            accessibilityLabel="Otvori natalnu kartu"
            className="flex-row gap-2 active:opacity-60">
            <Pill label="Sunce" glyph={sun.position.sign.glyph} value={sun.position.sign.name} />
            <Pill label="Mesec" glyph={moon.position.sign.glyph} value={moon.position.sign.name} />
            <Pill
              label="Ascendent"
              glyph={resolved.chart.ascendantSign.sign.glyph}
              value={resolved.timeUnknown ? '—' : resolved.chart.ascendantSign.sign.name}
              muted={resolved.timeUnknown}
            />
          </Pressable>

          <View className="mt-5 self-start rounded-full bg-secondary px-4 py-2">
            <Text className="text-xs text-muted-foreground">{daily.skyline}</Text>
          </View>

          {/* Ko si — iz osobina po suncevom znaku */}
          <View className="mt-9">
            <Text variant="label" className="mb-3">Ti, ukratko</Text>
            {traits.map((t) => (
              <Text key={t} variant="display" className="py-0.5 text-2xl">{t}</Text>
            ))}
          </View>

          {/* Precica na pun horoskop */}
          <Pressable
            onPress={() => router.push('/daily')}
            accessibilityRole="button"
            className="mt-9 rounded-xl border border-border p-5 active:opacity-60">
            <View className="flex-row items-center justify-between">
              <Text variant="label">Danas za tebe</Text>
              <ChevronRight size={16} color="#9A9A9A" />
            </View>
            <Text variant="body" className="mt-3" numberOfLines={3}>{daily.free}</Text>
            {top && (
              <View className="mt-4 flex-row items-center gap-2 border-t border-border pt-3">
                <Glyph size={13} className="text-muted-foreground">
                  {`${top.transit.transiting.glyph} ${top.transit.aspect.glyph} ${top.transit.natal.glyph}`}
                </Glyph>
                <Text variant="muted" className="text-xs">
                  {daily.entries.length} tranzita na tvoju kartu
                </Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Pill({ label, glyph, value, muted }: { label: string; glyph: string; value: string; muted?: boolean }) {
  return (
    <View className="flex-1 items-center rounded-xl border border-border py-3">
      <Text variant="label" className="text-[10px]">{label}</Text>
      <Glyph size={22} className={cn('mt-1.5', muted ? 'text-muted-foreground' : 'text-foreground')}>{glyph}</Glyph>
      <Text className={cn('mt-1 text-xs', muted && 'text-muted-foreground')}>{value}</Text>
    </View>
  );
}
