import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { ChevronRight, Lock, Sparkles } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Screen } from '@/components/screen';
import { ProfileButton } from '@/components/profile-button';
import { Glyph } from '@/components/ui/glyph';
import { buildPersonalDaily } from '@/lib/horoscope';
import { useTransitTexts } from '@/lib/transit-texts';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore, useEntitlement } from '@/store/auth';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { TranzitiLista } from '@/components/tranziti-lista';
import { useOblastiDana } from '@/lib/use-oblasti';

const GOLD = '#A7731B';

/**
 * Tab "Tranziti". PREMIUM: svi tranziti dana po vaznosti, svaki u svojoj
 * kartici (`components/tranziti-lista.tsx`, 28.9.2026). Besplatni do daljeg vide
 * stari prikaz sa katancima (`DailyBesplatno`).
 */
export default function Daily() {
  // Pravo pristupa iskljucivo sa servera — RLS dozvoljava samo citanje svog
  // reda. U razvoju kroz ovo prolazi i test prekidac iz /profile.
  const entitlement = useEntitlement();
  const isPremium = entitlement?.active ?? false;
  return isPremium ? <DailyPremium /> : <DailyBesplatno isPremium={false} />;
}

function DailyPremium() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();
  const today = React.useMemo(() => new Date(), []);
  const rez = useOblastiDana(resolved, today);

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !rez) return <Redirect href="/" />;

  return (
    <Screen label="Tranziti" tint="blue" right={<ProfileButton />}>
      <TranzitiLista rez={rez} date={today} />
    </Screen>
  );
}

function DailyBesplatno({ isPremium }: { isPremium: boolean }) {
  const hydrated = useProfileStore((s) => s.hydrated);
  const authLoading = useAuthStore((s) => s.loading);
  const resolved = useResolvedProfile();

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

  if (authLoading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved || !daily) return <Redirect href="/" />;

  const sun = resolved.chart.planets.find((p) => p.key === 'sun')!;
  const locked = !isPremium;

  return (
    <Screen label="Tranziti" tint="blue" right={<ProfileButton />}>
      {/* Bez naslova, trake sa planetama i oznake "Po jacini" — lista odmah
          pocinje karticama (Ivan, 27.9.2026). Redosled je i dalje po jacini. */}
      <View className="pt-6">

        {daily.entries.map((e) => {
          const t = e.transit;
          const tekst = texts.get(t.contentKey);

          // Tekst jos stize: ista kartica kao gotova (ime tranzita je poznato),
          // sa trakama umesto teksta — da lista ne skoci kad tekst stigne.
          if (!tekst && textsLoading) {
            return (
              <Card key={t.contentKey} className="mb-3">
                <CardContent className="p-5">
                  <View className="flex-row items-center gap-2 pb-1">
                    <Glyph size={15} className="text-foreground">
                      {`${t.transiting.glyph} ${t.aspect.glyph} ${t.natal.glyph}`}
                    </Glyph>
                    <Text variant="label">
                      {t.transiting.name} {t.aspect.name} natalni {t.natal.name}
                    </Text>
                  </View>
                  <TextPlaceholder lines={4} className="mt-2" />
                </CardContent>
              </Card>
            );
          }

          // Bez teksta u korpusu — prikazuje se kao sazet red, ne kao
          // prazna kartica. Iskreno je, a ne izgleda kao kvar.
          if (!tekst) {
            return (
              <View key={t.contentKey} className="flex-row items-center gap-2 border-b border-fill-strong py-3">
                <Glyph size={14} className="text-muted-foreground">
                  {`${t.transiting.glyph} ${t.aspect.glyph} ${t.natal.glyph}`}
                </Glyph>
                <Text variant="muted" className="flex-1 text-xs">
                  {t.transiting.name} {t.aspect.name} natalni {t.natal.name}
                </Text>
              </View>
            );
          }

          return (
            <Pressable
              key={t.contentKey}
              onPress={() => router.push({ pathname: '/transit', params: { key: t.contentKey } })}
              disabled={locked}
              accessibilityRole="button"
              accessibilityLabel={
                locked
                  ? 'Detaljno tumačenje zahteva plaćen pristup'
                  : `Detaljno tumačenje: ${t.transiting.name} ${t.aspect.name} natalni ${t.natal.name}`
              }
              className={cn(!locked && 'active:opacity-60')}>
              <Card className="mb-3">
                <CardContent className="p-5">
                  <View className="flex-row items-center gap-2 pb-1">
                    <Glyph size={15} className="text-foreground">
                      {`${t.transiting.glyph} ${t.aspect.glyph} ${t.natal.glyph}`}
                    </Glyph>
                    <Text variant="label">
                      {t.transiting.name} {t.aspect.name} natalni {t.natal.name}
                    </Text>
                  </View>

                  {!!tekst.title && <Text variant="h3" className="mb-2 mt-1">{tekst.title}</Text>}
                  <Text variant="body">{tekst.body}</Text>

                  {!!tekst.positive && <Polje oznaka="Pozitivno" tekst={tekst.positive} />}
                  {!!tekst.challenge && <Polje oznaka="Izazov" tekst={tekst.challenge} />}
                  {!!tekst.advice && <Polje oznaka="Savet" tekst={tekst.advice} />}

                  <View className="mt-4 flex-row items-center justify-between border-t border-border pt-3">
                    {locked ? (
                      <>
                        <Text variant="label" className="text-muted-foreground">
                          Detaljno tumačenje — uz plaćen pristup
                        </Text>
                        <Lock size={14} color={GOLD} />
                      </>
                    ) : (
                      <>
                        <Text variant="label">Detaljno tumačenje</Text>
                        <ChevronRight size={15} color={neutral.inkSubtle} />
                      </>
                    )}
                  </View>
                </CardContent>
              </Card>
            </Pressable>
          );
        })}

        {locked && (
          <Card className="mb-3 mt-2 border-gold/40">
            <CardContent className="items-center p-6">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <Lock size={20} color={GOLD} />
              </View>
              <Text variant="h3" className="mt-4 text-center">Detaljna tumačenja</Text>
              <Text variant="muted" className="mt-2 text-center">
                Dugoročni efekti, sfere života na koje se tranzit odnosi, i
                konkretni saveti — za svaki tranzit posebno.
              </Text>
              <Button className="mt-5 w-full" onPress={() => router.push('/profile')}>
                <Sparkles size={18} color="#FFFFFF" />
                <Text>Otključaj</Text>
              </Button>
            </CardContent>
          </Card>
        )}
      </View>

      {daily.houseHighlights.length > 0 && (
        <View className={cn(CARD_SURFACE, 'mt-8 p-4')}>
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
    </Screen>
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
