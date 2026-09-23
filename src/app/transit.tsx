import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { useTransitTexts } from '@/lib/transit-texts';
import { useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { findTransits } from '@/lib/transits';

const GOLD = '#A7731B';

/**
 * Detaljno tumacenje jednog tranzita — duga verzija.
 *
 * Duga verzija stize samo ako korisnik ima aktivan pristup. To NE proverava
 * ova komponenta nego RLS politika u bazi: server jednostavno ne posalje
 * tekst. Ako `long` stigne prazan a `short` nije, znaci da pristup nije
 * placen — i tada se prikazuje kratka verzija sa pozivom na otkljucavanje.
 */
export default function TransitDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const resolved = useResolvedProfile();
  const entitlement = useAuthStore((s) => s.entitlement);

  const kljucevi = React.useMemo(() => (key ? [String(key)] : []), [key]);
  const { texts: duga, loading: dugaLoading } = useTransitTexts(kljucevi, 'long');
  const { texts: kratka } = useTransitTexts(kljucevi, 'short');

  const tranzit = React.useMemo(() => {
    if (!resolved || !key) return null;
    return findTransits(resolved.chart).find((t) => t.contentKey === key) ?? null;
  }, [resolved, key]);

  if (!resolved) return <Redirect href="/" />;

  const puna = duga.get(String(key));
  const sazeta = kratka.get(String(key));
  const zakljucano = !dugaLoading && !puna;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-2 px-5 pb-2 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={14}
                     accessibilityRole="button" accessibilityLabel="Nazad">
            <ChevronLeft size={26} color="#141414" />
          </Pressable>
          <Text variant="label">Tumačenje</Text>
        </View>

        <ScrollView contentContainerClassName="px-5 pb-16" showsVerticalScrollIndicator={false}>
          {tranzit && (
            <View className="flex-row items-center gap-2 pb-1 pt-2">
              <Glyph size={17} className="text-foreground">
                {`${tranzit.transiting.glyph} ${tranzit.aspect.glyph} ${tranzit.natal.glyph}`}
              </Glyph>
              <Text variant="label">
                {tranzit.transiting.name} {tranzit.aspect.name} natalni {tranzit.natal.name}
              </Text>
            </View>
          )}

          <Text variant="display" className="mb-5 mt-1">
            {puna?.title || sazeta?.title || 'Tranzit'}
          </Text>

          {dugaLoading ? (
            <Text variant="muted">Učitavam…</Text>
          ) : puna ? (
            <>
              {!!puna.body && <Text variant="body">{puna.body}</Text>}
              {puna.sections.map((s) => (
                <View key={s.heading} className="mt-7">
                  <Text variant="label" className="mb-2">{s.heading}</Text>
                  <Text variant="body">{s.body}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              {!!sazeta?.body && <Text variant="body">{sazeta.body}</Text>}

              <View className="mt-8 rounded-xl border border-gold/40 bg-secondary/40 p-6">
                <View className="h-12 w-12 items-center justify-center self-center rounded-full bg-gold/10">
                  <Lock size={20} color={GOLD} />
                </View>
                <Text variant="h3" className="mt-4 text-center">Detaljno tumačenje</Text>
                <Text variant="muted" className="mt-2 text-center">
                  Dugoročni efekti, sfere života na koje se odnosi, i konkretni
                  saveti za ovaj period.
                </Text>
                <Button className="mt-5 w-full" onPress={() => router.push('/profile')}>
                  <Text>Otključaj</Text>
                </Button>
              </View>
            </>
          )}

          {zakljucano && entitlement?.active && (
            <Text variant="muted" className="mt-6 text-xs">
              Tumačenje za ovaj tranzit još nije napisano.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
