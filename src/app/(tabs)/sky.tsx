import * as React from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { NatalWheel } from '@/components/natal-wheel';
import { Text } from '@/components/ui/text';
import { TabBarSpacer } from '@/components/floating-tab-bar';
import { AspectRow, Row, RowHead } from '@/components/ui/row';
import { buildSky, shiftDays, zoneClock, zoneShift } from '@/lib/sky';
import { formatDate } from '@/lib/horoscope';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useSkyPlaceStore } from '@/store/sky-place';
import { cn } from '@/lib/utils';

/**
 * Trenutno na nebu — gde su planete SADA, nad gradom iz profila.
 *
 * Razlika u odnosu na tab "Karta": tamo je nebo zamrznuto na trenutak rodjenja
 * i tice se samo korisnika, ovde se pomera dok gledas i isto je za sve.
 *
 * Nista se ne tumaci. Ekran prikazuje IZRACUNATO stanje — znak, stepen, kucu,
 * retrogradnost — a ne tekst astrologa. Tumacenja tranzita na licnu kartu su
 * i dalje u tabu "Horoskop", jer se tamo placaju.
 */
export default function Sky() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const resolved = useResolvedProfile();
  const { width } = useWindowDimensions();

  // Mesto posmatranja je zaseban izbor; `null` znaci grad iz profila. Ceka se i
  // njegova hidratacija, inace bi ekran nakratko pokazao kartu za pogresan grad
  // i onda je zamenio — a razlika je ceo ascendent.
  const izabranGrad = useSkyPlaceStore((s) => s.city);
  const mestoHydrated = useSkyPlaceStore((s) => s.hydrated);
  const grad = izabranGrad ?? resolved?.city ?? null;

  const [sada, setSada] = React.useState(() => new Date());
  /** null = prati sat. Cim se pomeri vreme, trenutak se zamrzava. */
  const [izabran, setIzabran] = React.useState<Date | null>(null);
  const now = izabran ?? sada;

  // Osvezavanje ide SAMO dok je ekran u fokusu i dok se gleda sadasnjost.
  // Tabovi ostaju montirani i kad se sa njih ode, pa bi obican `useEffect`
  // racunao efemeride u pozadini do kraja rada aplikacije. Minut je dovoljno
  // gusto: za to vreme se ascendent pomeri 15', a Mesec manje od jednog
  // lucnog minuta.
  useFocusEffect(
    React.useCallback(() => {
      if (izabran) return;
      setSada(new Date());
      const id = setInterval(() => setSada(new Date()), 60_000);
      return () => clearInterval(id);
    }, [izabran])
  );

  // Zavisnosti su BROJEVI, ne `resolved` — `useResolvedProfile()` pravi nov
  // objekat pri svakom renderu, pa bi se cela karta racunala iznova bez
  // ikakvog povoda.
  const latitude = grad?.latitude;
  const longitude = grad?.longitude;
  const sky = React.useMemo(
    () => (latitude === undefined || longitude === undefined
      ? null
      : buildSky(now, latitude, longitude)),
    [now, latitude, longitude]
  );

  if (!hydrated || !mestoHydrated) return <View className="flex-1 bg-background" />;
  if (!resolved || !grad || !sky) return <Redirect href="/" />;

  // Ispod kapije, da se do grada dolazi bez `!`.
  const pomeriSat = (smer: number) =>
    setIzabran(new Date(now.getTime() + smer * 3_600_000));
  const pomeriDan = (smer: number) =>
    setIzabran(shiftDays(now, grad.tz, smer));

  const { chart, points, aspects, retrograde } = sky;
  const moon = chart.planets.find((p) => p.key === 'moon')!;
  const wheelSize = Math.min(width - 16, 430);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pb-1 pt-4">
          <Text variant="label">{izabran ? 'Nebo u izabranom trenutku' : 'Trenutno na nebu'}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-5 pb-5">
            <Text variant="display">{zoneClock(now, grad.tz)}</Text>
            <Pressable
              onPress={() => router.push('/sky-place')}
              accessibilityRole="button"
              accessibilityLabel={`Mesto posmatranja: ${grad.name}. Dodirni da promeniš.`}
              className="mt-1.5 flex-row items-center gap-1 self-start active:opacity-60">
              <Text variant="muted">
                {formatDate(zoneShift(now, grad.tz), true)} · {grad.name}
              </Text>
              <ChevronRight size={15} color="#9A9A9A" />
            </Pressable>
          </View>

          <View className="mx-5 mb-5 self-start rounded-full bg-secondary px-4 py-2">
            <Text className="text-xs text-muted-foreground">
              Mesec u znaku {moon.position.sign.name} · {sky.moonPhaseName}
              {retrograde.length
                ? ` · retrogradni: ${retrograde.map((r) => r.name).join(', ')}`
                : ' · nijedna planeta nije retrogradna'}
            </Text>
          </View>

          <View className="items-center">
            <NatalWheel chart={chart} size={wheelSize} points={points} />
          </View>

          {/* Pomeranje vremena. Dan ide preko zid-sata (`shiftDays`) da bi u noci
              kad se sat pomera i dalje pogadjao isti sat; sat je prostih 60
              minuta stvarnog vremena — vidi komentar u `lib/sky.ts`. */}
          <View className="mt-5 flex-row justify-center gap-2 px-5">
            <Korak label="‹ dan" onPress={() => pomeriDan(-1)} />
            <Korak label="‹ sat" onPress={() => pomeriSat(-1)} />
            <Korak label="sat ›" onPress={() => pomeriSat(1)} />
            <Korak label="dan ›" onPress={() => pomeriDan(1)} />
          </View>

          <View className="mt-3 items-center">
            <Pressable
              onPress={() => setIzabran(null)}
              disabled={!izabran}
              accessibilityRole="button"
              accessibilityLabel="Vrati se na sadašnji trenutak"
              className={cn(
                'rounded-full border px-6 py-2.5',
                izabran ? 'border-foreground active:opacity-60' : 'border-border'
              )}>
              <Text
                variant="label"
                className={cn('text-xs', !izabran && 'text-muted-foreground')}>
                Trenutno
              </Text>
            </Pressable>
          </View>

          {chart.houses.fellBack && (
            <View className="mx-5 mt-4 rounded-lg bg-secondary p-4">
              <Text variant="muted">
                Na geografskoj širini mesta {grad.name} Placidus kuće ne postoje — tačke
                ekliptike koje ih određuju nikad ne izlaze nad horizont. Prikazane
                su Whole Sign kuće.
              </Text>
            </View>
          )}

          {/* Legenda aspekata — ista kao na natalnoj karti. */}
          <View className="mx-5 mt-6 flex-row flex-wrap gap-x-5 gap-y-2">
            <LegendItem color="#C4453A" label="napeti — kvadrat, opozicija" />
            <LegendItem color="#3B6FA8" label="skladni — trigon, sekstil" />
            <LegendItem color="#8A8A8A" label="konjunkcija" dashed />
          </View>

          {/* Uglovi nad gradom iz profila */}
          <View className="mx-5 mt-7 rounded-xl border border-border">
            <RowHead>Uglovi nad mestom {grad.name}</RowHead>
            <Row glyph={chart.ascendantSign.sign.glyph} name="Ascendent"
                 value={chart.ascendantSign.formattedPrecise} />
            <Row glyph={chart.midheavenSign.sign.glyph} name="Medium Coeli"
                 value={chart.midheavenSign.formattedPrecise} last />
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
                value={p.position.formattedPrecise}
                extra={`${p.house}. kuća`}
                retro={p.retrograde}
                last={i === chart.planets.length - 1}
              />
            ))}
          </View>

          {/* Izvedene tacke */}
          <View className="mx-5 mt-4 rounded-xl border border-border">
            <RowHead>Tačke</RowHead>
            {points.map((t, i) => (
              <Row
                key={t.key}
                glyph={t.glyph}
                name={t.name}
                value={t.position.formattedPrecise}
                extra={t.house ? `${t.house}. kuća` : undefined}
                retro={t.retrograde}
                last={i === points.length - 1}
              />
            ))}
          </View>
          <Text variant="muted" className="mx-5 mt-2 text-xs">
            Čvor je pravi (ne srednji), Lilit je srednji apogej. Tačka sreće se
            računa po {sky.dayChart ? 'dnevnoj' : 'noćnoj'} formuli, jer je Sunce
            sada {sky.dayChart ? 'iznad' : 'ispod'} horizonta.
          </Text>

          {/* Aspekti */}
          <View className="mx-5 mt-4 rounded-xl border border-border">
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
          <TabBarSpacer />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/** Jedno dugme za pomeranje vremena. Namerno bez `Button`: traka od cetiri
 *  jednaka, uska dugmeta trazi `flex-1`, a ne visinu od 48px. */
function Korak({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label.replace('‹', 'nazad').replace('›', 'napred')}
      className="flex-1 items-center rounded-lg border border-border py-2.5 active:opacity-60">
      <Text variant="label" className="text-xs">{label}</Text>
    </Pressable>
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
