import * as React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';

import { NatalWheel } from '@/components/natal-wheel';
import { Text } from '@/components/ui/text';
import { TabBackground } from '@/components/ambient-gradient';
import { Glyph } from '@/components/ui/glyph';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { findAspects } from '@/lib/astro';
import { cn } from '@/lib/utils';

const MESECI = ['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];

export default function ChartScreen() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const resolved = useResolvedProfile();
  const { width } = useWindowDimensions();

  const aspects = React.useMemo(
    () => (resolved ? findAspects(resolved.chart.planets) : []),
    [resolved]
  );

  if (!hydrated) return <View className="flex-1 bg-background" />;
  if (!resolved) return <Redirect href="/" />;

  const { chart, profile, city, timeUnknown } = resolved;
  const b = profile.birth;
  const t = profile.time;
  const wheelSize = Math.min(width - 16, 430);

  return (
    <View className="flex-1 bg-background">
      <TabBackground tab="chart" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-1 pt-4">
          <Text variant="label">Natalna karta</Text>
        </View>

        <ScrollView contentContainerClassName="pb-16" showsVerticalScrollIndicator={false}>
          <View className="px-5 pb-5">
            <Text variant="display">{profile.name}</Text>
            <Text variant="muted" className="mt-1.5">
              {b.day}. {MESECI[b.month - 1]} {b.year}
              {t ? ` u ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}` : ''}
              {' · '}{city.name}
            </Text>
          </View>

          <View className="items-center">
            <NatalWheel chart={chart} size={wheelSize} />
          </View>

          {timeUnknown && (
            <View className="mx-5 mt-4 rounded-lg bg-secondary p-4">
              <Text variant="muted">
                Vreme rođenja nije uneto, pa su ascendent i kuće samo procena.
                Pozicije planeta su tačne — osim Meseca, koji za 12 sati pređe i do 7°.
              </Text>
            </View>
          )}

          {/* Legenda aspekata */}
          <View className="mx-5 mt-6 flex-row flex-wrap gap-x-5 gap-y-2">
            <LegendItem color="#C4453A" label="napeti — kvadrat, opozicija" />
            <LegendItem color="#3B6FA8" label="skladni — trigon, sekstil" />
            <LegendItem color="#8A8A8A" label="konjunkcija" dashed />
          </View>

          {/* Uglovi */}
          <View className="mx-5 mt-7 rounded-xl border border-border">
            <RowHead>Uglovi</RowHead>
            <Row glyph={chart.ascendantSign.sign.glyph} name="Ascendent"
                 value={chart.ascendantSign.formatted} muted={timeUnknown} />
            <Row glyph={chart.midheavenSign.sign.glyph} name="Medium Coeli"
                 value={chart.midheavenSign.formatted} muted={timeUnknown} last />
          </View>

          {/* Planete */}
          <View className="mx-5 mt-4 rounded-xl border border-border">
            <RowHead>
              Planete · {chart.houses.system === 'placidus' ? 'Placidus kuće' : 'Whole Sign kuće'}
            </RowHead>
            {chart.planets.map((p, i) => (
              <Row
                key={p.key}
                glyph={p.glyph}
                name={p.name}
                value={p.position.formatted}
                extra={`${p.house}. kuća`}
                retro={p.retrograde}
                last={i === chart.planets.length - 1}
              />
            ))}
          </View>

          {/* Aspekti */}
          <View className="mx-5 mt-4 rounded-xl border border-border">
            <RowHead>Aspekti · {aspects.length}</RowHead>
            {aspects.map((a, i) => (
              <View key={a.contentKey}
                    className={cn('flex-row items-center justify-between px-4 py-3',
                                  i < aspects.length - 1 && 'border-b border-border')}>
                <View className="flex-row items-center gap-2">
                  <Glyph size={15} className="text-foreground">
                    {`${a.a.glyph} ${a.aspect.glyph} ${a.b.glyph}`}
                  </Glyph>
                  <Text className="text-sm">
                    {a.a.name} {a.aspect.name} {a.b.name}
                  </Text>
                </View>
                <Text variant="muted" className="text-xs">{a.orb.toFixed(1)}°</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RowHead({ children }: { children: React.ReactNode }) {
  return (
    <View className="border-b border-border px-4 py-3">
      <Text variant="label">{children}</Text>
    </View>
  );
}

function Row({ glyph, name, value, extra, retro, muted, last }: {
  glyph: string; name: string; value: string;
  extra?: string; retro?: boolean; muted?: boolean; last?: boolean;
}) {
  return (
    <View className={cn('flex-row items-center px-4 py-3', !last && 'border-b border-border')}>
      <Glyph size={17} className={muted ? 'text-muted-foreground' : 'text-foreground'}>{glyph}</Glyph>
      <Text className={cn('ml-3 flex-1 text-sm', muted && 'text-muted-foreground')}>{name}</Text>
      <View className="items-end">
        <Text className={cn('text-sm', muted && 'text-muted-foreground')}>
          {value}{retro ? '  R' : ''}
        </Text>
        {extra && <Text variant="muted" className="text-xs">{extra}</Text>}
      </View>
    </View>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View style={{ width: 16, height: 2, backgroundColor: color, opacity: dashed ? 0.6 : 1 }} />
      <Text variant="muted" className="text-xs">{label}</Text>
    </View>
  );
}
