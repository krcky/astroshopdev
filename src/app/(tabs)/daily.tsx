import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { Lock, Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { buildPersonalDaily, formatDate } from '@/lib/horoscope';
import { useTransitTexts } from '@/lib/transit-texts';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const GOLD = '#A7731B';

export default function Daily() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();

  // Pravo pristupa iskljucivo sa servera — RLS dozvoljava samo citanje svog reda.
  const entitlement = useAuthStore((s) => s.entitlement);
  const isPremium = entitlement?.active ?? false;

  const today = React.useMemo(() => new Date(), []);
  const daily = React.useMemo(
    () => (resolved ? buildPersonalDaily(resolved, today) : null),
    [resolved, today]
  );

  // Tranziti se racunaju na telefonu, tekstovi stizu sa servera.
  const keys = React.useMemo(
    () => daily?.entries.map((e) => e.transit.contentKey) ?? [],
    [daily]
  );
  const { texts, loading: textsLoading } = useTransitTexts(keys);

  if (authLoading || !hydrated) return <View className="flex-1 bg-background" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  const sun = resolved.chart.planets.find((p) => p.key === 'sun')!;
  const locked = !isPremium;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}>

          <View className="pt-4 pb-6">
            <Text variant="label">{formatDate(today)}</Text>
            <Text variant="display" className="mt-1">Dnevni horoskop</Text>
          </View>

          <Card>
            <CardContent className="p-5">
              <Text variant="label" className="mb-2.5">Danas za {sun.position.sign.name}</Text>
              <Text variant="body">{daily.free}</Text>
            </CardContent>
          </Card>

          <View className="mt-6">
            <Text variant="label" className="mb-3">Tvoji tranziti danas</Text>

            {daily.entries.map((e, i) => {
              const t = e.transit;
              const hidden = locked && i > 0;
              const tekst = texts.get(t.contentKey);
              return (
                <Card key={t.contentKey} className={cn('mb-3', hidden && 'border-dashed')}>
                  <CardContent className="p-5">
                    <View className="flex-row items-center gap-2 pb-1">
                      <Glyph size={15} className="text-foreground">
                        {`${t.transiting.glyph} ${t.aspect.glyph} ${t.natal.glyph}`}
                      </Glyph>
                      <Text variant="label">
                        {t.transiting.name} {t.aspect.name} natalni {t.natal.name}
                      </Text>
                    </View>

                    {hidden ? (
                      <Text variant="muted" className="mt-2">Otključaj da vidiš šta ovo znači za tebe.</Text>
                    ) : tekst ? (
                      <>
                        {!!tekst.title && (
                          <Text variant="h3" className="mb-2 mt-1">{tekst.title}</Text>
                        )}
                        <Text variant="body">{tekst.body}</Text>
                        {!!tekst.positive && (
                          <Polje oznaka="Pozitivno" tekst={tekst.positive} />
                        )}
                        {!!tekst.challenge && (
                          <Polje oznaka="Izazov" tekst={tekst.challenge} />
                        )}
                        {!!tekst.advice && (
                          <Polje oznaka="Savet" tekst={tekst.advice} />
                        )}
                      </>
                    ) : textsLoading ? (
                      <Text variant="muted" className="mt-2">Učitavam…</Text>
                    ) : (
                      <Text variant="muted" className="mt-2">
                        Tumačenje za ovaj tranzit još nije napisano.
                      </Text>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {locked && (
              <Card className="mt-1 border-gold/40 bg-secondary/40">
                <CardContent className="items-center p-6">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                    <Lock size={20} color={GOLD} />
                  </View>
                  <Text variant="h3" className="mt-4 text-center">
                    Još {Math.max(0, daily.entries.length - 1)} tranzita za danas
                  </Text>
                  <Text variant="muted" className="mt-2 text-center">
                    Računato prema tvom datumu, vremenu i mestu rođenja — ne prema znaku.
                  </Text>
                  <Button className="mt-5 w-full" onPress={() => router.push('/profile')}>
                    <Sparkles size={18} color="#FFFFFF" />
                    <Text>Otključaj ceo horoskop</Text>
                  </Button>
                  <Text className="mt-3 text-center text-xs text-muted-foreground">
                    Kupovina se uključuje kad povežemo RevenueCat
                  </Text>
                </CardContent>
              </Card>
            )}
          </View>

          {daily.houseHighlights.length > 0 && (
            <View className="mt-8 rounded-lg border border-border p-4">
              <Text variant="label" className="mb-3">Tema ovog perioda</Text>
              {daily.houseHighlights.map((hh) => (
                <View key={hh.contentKey} className="flex-row items-center gap-2 py-1">
                  <Glyph size={14} className="text-muted-foreground">{hh.glyph}</Glyph>
                  <Text className="text-xs text-muted-foreground">
                    {hh.planetName} prolazi kroz tvoju {hh.house}. kuću
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Polje({ oznaka, tekst }: { oznaka: string; tekst: string }) {
  return (
    <View className="mt-3 border-t border-border pt-3">
      <Text variant="label" className="mb-1">{oznaka}</Text>
      <Text variant="muted">{tekst}</Text>
    </View>
  );
}
