import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Redirect } from 'expo-router';

import { NatalWheel } from '@/components/natal-wheel';
import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Screen } from '@/components/screen';
import { AspectRow, Row, RowHead } from '@/components/ui/row';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { findAspects } from '@/lib/astro';

const MESECI = ['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];

export default function ChartScreen() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const resolved = useResolvedProfile();
  const { width } = useWindowDimensions();

  const aspects = React.useMemo(
    () => (resolved ? findAspects(resolved.chart.planets) : []),
    [resolved]
  );

  if (!hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved) return <Redirect href="/" />;

  const { chart, profile, city, timeUnknown, zoneUnreliable } = resolved;
  const b = profile.birth;
  const t = profile.time;
  const wheelSize = Math.min(width - 16, 430);

  return (
    <Screen label="Natalna karta" padded={false}>
      <View className="px-5 pb-5 pt-6">
        <Text variant="display">{profile.name}</Text>
        <Text variant="muted" className="mt-1.5">
          {b.day}. {MESECI[b.month - 1]} {b.year}
          {t ? ` u ${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}` : ''}
          {' · '}{city.name}
        </Text>
      </View>

      {zoneUnreliable ? (
        <View className={cn(CARD_SURFACE, 'mx-5 border-destructive/40 p-5')}>
          <Text variant="h3">Karta ne može da se izračuna</Text>
          <Text variant="muted" className="mt-2">
            Ne možemo pouzdano da utvrdimo koliko je sati bilo po UTC-u u
            mestu {city.name} na taj datum. Greška od sat vremena pomeri
            ascendent za pola znaka, pa radije ne prikazujemo ništa nego
            pogrešne brojeve.
          </Text>
          <Text variant="muted" className="mt-3 text-xs">
            Javi nam ovo — zona: {city.tz.name}
          </Text>
        </View>
      ) : (
        <View className="items-center">
          <NatalWheel chart={chart} size={wheelSize} />
        </View>
      )}

      {timeUnknown && (
        <View className={cn(CARD_SURFACE, 'mx-5 mt-4 p-4')}>
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
      <View className={cn(CARD_SURFACE, 'mx-5 mt-7')}>
        <RowHead>Uglovi</RowHead>
        <Row glyph={chart.ascendantSign.sign.glyph} name="Ascendent"
             value={chart.ascendantSign.formatted} muted={timeUnknown} />
        <Row glyph={chart.midheavenSign.sign.glyph} name="Medium Coeli"
             value={chart.midheavenSign.formatted} muted={timeUnknown} last />
      </View>

      {/* Planete */}
      <View className={cn(CARD_SURFACE, 'mx-5 mt-4')}>
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
      <View className={cn(CARD_SURFACE, 'mx-5 mt-4')}>
        <RowHead>Aspekti · {aspects.length}</RowHead>
        {aspects.map((a, i) => (
          <AspectRow
            key={a.contentKey}
            glyphs={`${a.a.glyph} ${a.aspect.glyph} ${a.b.glyph}`}
            label={`${a.a.name} ${a.aspect.name} ${a.b.name}`}
            orb={a.orb}
            last={i === aspects.length - 1}
          />
        ))}
      </View>
    </Screen>
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
