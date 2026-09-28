import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Crown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { neutral } from '@/theme/tokens';
import { tvojDanInfo, tvojDanWindow } from '@/lib/tvoj-dan';
import { TransitTrajanje } from '@/components/transit-trajanje';
import { SheetGrabber } from '@/components/sheet';
import { useResolvedProfile } from '@/store/profile';

/** Uglovi nisu u astroloskom fontu — obicnim slovima (vidi CLAUDE.md). */
const UGAO: Record<string, string> = { ascendant: 'Asc', midheaven: 'MC' };

/**
 * Nativni iOS list odozdo (`formSheet`, visok koliko sadrzaj — registrovan u
 * `_layout.tsx`): na osnovu cega je napisan tekst na kartici "Tvoj dan".
 * Koji je to tranzit (planeta, aspekt, natalna tacka) i, kad vazi, zasto ima
 * prednost — tranzit vladara horoskopa (Ivan, 28.9.2026).
 *
 * Parametar je samo kljuc tranzita; sve ostalo se cita iz karte korisnika.
 * Zatvara se povlacenjem nadole — iOS list ima rucicu, dugme nije potrebno.
 */
export default function TvojDanInfo() {
  const { key, day } = useLocalSearchParams<{ key: string; day?: string }>();
  const resolved = useResolvedProfile();
  const insets = useSafeAreaInsets();
  if (!resolved) return <Redirect href="/" />;
  const info = key ? tvojDanInfo(resolved.chart, resolved.timeUnknown, String(key)) : null;
  // Dan sa kartice ("2026-09-28"); bez njega danas. Podne, da je dan jednoznacan.
  const m = typeof day === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : new Date();
  const prozor = info ? tvojDanWindow(info, date) : null;

  return (
    <View className="bg-background px-6 pt-8" style={{ paddingBottom: insets.bottom + 24 }}>
      <SheetGrabber />
      <Text variant="h2">Na osnovu čega je ovaj tekst</Text>

      {info ? (
        <>
          <Text variant="body" className="mt-3">
            Tekst je napisan za tranzit koji je danas najvažniji u tvojoj natalnoj karti.
          </Text>

          {/* Koji tranzit: planeta na danasnjem nebu, aspekt, tacka iz tvoje karte. */}
          <View
            className="mt-6 flex-row items-center gap-3"
            accessible
            accessibilityLabel={`${info.transiting.name} ${info.aspect.name} natalni ${info.natal.name}`}>
            <Simbol glyph={info.transiting.glyph} krunica={info.ruler === 'transiting'} />
            <Glyph size={20} className="text-muted-foreground">{info.aspect.glyph}</Glyph>
            <Simbol glyph={info.natal.glyph} ugao={UGAO[info.natal.key]} krunica={info.ruler === 'natal'} />
          </View>
          <Text variant="row" className="mt-4">
            {info.transiting.name} {info.aspect.name} natalni {info.natal.name}
          </Text>
          <Text variant="muted" className="mt-1">
            Planeta sa današnjeg neba i ugao od {info.aspect.angle}° koji zaklapa sa tačkom iz tvoje natalne karte.
          </Text>

          {/* Trajanje tranzita — ista traka kao na kartici (Ivan, 28.9.2026). */}
          {prozor && (
            <TransitTrajanje start={prozor.start} end={prozor.end} date={date} mesec={info.transiting.key === 'moon'} className="mt-5" />
          )}

          {info.rulerText && (
            <View className="mt-6 rounded-lg bg-fill p-4">
              <View className="flex-row items-center gap-1.5">
                <Crown size={15} color={neutral.ink} strokeWidth={2} />
                <Text variant="h3">Tranzit tvog vladara</Text>
              </View>
              <Text variant="body" className="mt-2">{info.rulerText}</Text>
            </View>
          )}
        </>
      ) : (
        <Text variant="muted" className="mt-3">Ovaj tranzit nije deo tvoje karte.</Text>
      )}
    </View>
  );
}

function Simbol({ glyph, ugao, krunica }: { glyph: string; ugao?: string; krunica: boolean }) {
  return (
    <View className="h-12 w-12 items-center justify-center rounded-full bg-fill">
      {ugao ? <Text variant="h3">{ugao}</Text> : <Glyph size={24} className="text-foreground">{glyph}</Glyph>}
      {krunica && (
        <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border border-border bg-background">
          <Crown size={11} color={neutral.ink} strokeWidth={2.2} />
        </View>
      )}
    </View>
  );
}
