import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { Glyph } from '@/components/ui/glyph';
import { CARD_SURFACE } from '@/components/ui/card';
import { buildPersonalDaily, formatDate, type PersonalDaily } from '@/lib/horoscope';
import { useTransitTexts } from '@/lib/transit-texts';
import { traitsForSign } from '@/lib/traits';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { useHeroLog } from '@/store/hero-log';
import { dayKey } from '@/lib/transits';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/** Pregled dana — izlog, ne sadrzaj. Pun tekst je u tabu "Horoskop". */
export default function Home() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();

  const today = React.useMemo(() => new Date(), []);
  const heroHistory = useHeroLog((s) => s.shown);
  const daily = React.useMemo(
    () => (resolved ? buildPersonalDaily(resolved, today, heroHistory) : null),
    [resolved, today, heroHistory]
  );

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  const sun = resolved.chart.planets.find((p) => p.key === 'sun')!;
  const moon = resolved.chart.planets.find((p) => p.key === 'moon')!;
  const traits = traitsForSign(sun.position.sign.key);

  return (
    <Screen label={formatDate(today)}>
      <View className="pb-7 pt-6">
        <Text variant="display">Zdravo, {daily.name}</Text>
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

      <View className={cn(CARD_SURFACE, 'mt-5 self-start rounded-full px-4 py-2')}>
        <Text className="text-xs text-muted-foreground">{daily.skyline}</Text>
      </View>

      {/* Ko si — iz osobina po suncevom znaku */}
      <View className="mt-9">
        <Text variant="label" className="mb-3">Ti, ukratko</Text>
        {traits.map((t) => (
          <Text key={t} variant="display" className="py-0.5 text-2xl">{t}</Text>
        ))}
      </View>

      {/* Tranzit dana — Hero. Sta ulazi bira waterfall u `transits.ts`. */}
      <Hero daily={daily} today={today} />
    </Screen>
  );
}

function Pill({ label, glyph, value, muted }: { label: string; glyph: string; value: string; muted?: boolean }) {
  return (
    <View className={cn(CARD_SURFACE, 'flex-1 items-center py-3')}>
      <Text variant="label" className="text-[10px]">{label}</Text>
      <Glyph size={22} className={cn('mt-1.5', muted ? 'text-muted-foreground' : 'text-foreground')}>{glyph}</Glyph>
      <Text className={cn('mt-1 text-xs', muted && 'text-muted-foreground')}>{value}</Text>
    </View>
  );
}

/** Natpis iznad Hero-a: iz kog je prioriteta dosao. Korisnik uci da prepoznaje tri vrste dana. */
const HERO_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Tranzit na tvog vladara',
  2: 'Tranzit na ključnu tačku karte',
  3: 'Lični tranzit dana',
};

function Hero({ daily, today }: { daily: PersonalDaily; today: Date }) {
  const { hero } = daily;
  const t = hero.transit;
  const record = useHeroLog((s) => s.record);

  // Upis u dnevnik — od sutra je ovaj tranzit na pauzi 7 dana (osim na vrhuncu).
  React.useEffect(() => {
    if (t) record(t.contentKey, dayKey(today));
  }, [t, record, today]);

  const kljucevi = React.useMemo(() => (t ? [t.contentKey] : []), [t]);
  const { texts, loading } = useTransitTexts(kljucevi);

  // Bez tranzita u orbisu Hero-a nema. Mesec ima svoju karticu i ne ulazi ovde.
  if (hero.priority === 4 || !t) return null;
  const tekst = texts.get(t.contentKey);

  return (
    <Pressable
      onPress={() => router.push('/daily')}
      accessibilityRole="button"
      className={cn(CARD_SURFACE, 'mt-9 p-5 active:opacity-60')}>
      <View className="flex-row items-center justify-between">
        <Text variant="label">{HERO_LABEL[hero.priority]}</Text>
        <ChevronRight size={16} color={neutral.inkSubtle} />
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Glyph size={15} className="text-foreground">
          {`${t.transiting.glyph} ${t.aspect.glyph} ${t.natal.glyph}`}
        </Glyph>
        <Text variant="row" className="flex-1">
          {t.transiting.name} {t.aspect.name} natalni {t.natal.name}
        </Text>
      </View>
      {/* Tekst stize sa servera. Bez teksta (ASC, MC, rupe u korpusu) ostaje
          samo racunati red iznad — ne izmislja se. */}
      {tekst ? (
        <>
          {!!tekst.title && <Text variant="h3" className="mt-2">{tekst.title}</Text>}
          <Text variant="body" className="mt-1" numberOfLines={3}>{tekst.body}</Text>
        </>
      ) : loading ? (
        <Text variant="muted" className="mt-2 text-xs">…</Text>
      ) : null}
      <Text variant="caption" className="mt-3">{hero.reason}</Text>
    </Pressable>
  );
}
