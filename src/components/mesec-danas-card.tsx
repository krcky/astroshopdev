import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Apple, Carrot, ChevronRight, Flower2, Leaf } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Chip } from '@/components/ui/chip';
import { CARD_SURFACE } from '@/components/ui/card';
import { MoonDisc } from '@/components/moon-disc';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { formatDay, formatTime } from '@/lib/horoscope';
import { SIGN_CASES, signFromLongitude, type Element } from '@/lib/zodiac';
import type { NatalChart } from '@/lib/natal';
import {
  LUNAR_AREAS, PHASE_SUMMARY_PRIVREMENO, PLANT_PART, lunationHouse, phaseDay, type LunarArea,
} from '@/lib/moon';
import { useLunarText } from '@/lib/lunar-texts';
import { useTransitTexts } from '@/lib/transit-texts';
import { moonDay, strongestMoonHit } from '@/lib/transits';
import { lunarneStavke, type Stavka } from '@/lib/tumacenje';

/** Nazivi tabova na kartici (brief). "Ljubav" je u tekstovima "Ljubav i odnosi". */
const TAB: Record<LunarArea, string> = {
  ljubav: 'Ljubav', zdravlje: 'Zdravlje i lepota', karijera: 'Karijera i finansije', kuca: 'Kuća', basta: 'Bašta',
};

const PLANT_ICON: Record<Element, typeof Apple> = { vatra: Apple, zemlja: Carrot, vazduh: Flower2, voda: Leaf };
/** "Dan ploda" — genitiv dela biljke. */
const DAN_BILJKE: Record<Element, string> = { vatra: 'Dan ploda', zemlja: 'Dan korena', vazduh: 'Dan cveta', voda: 'Dan lista' };

/**
 * "Mesec danas" — Premium kartica: faza (ne znak) kao crtez, lunarni savet
 * isti za sve znakove po oblastima, i jedan licni red za Mlad i Pun Mesec.
 * Faza i znak se racunaju u `phaseDay` (`lib/moon.ts`); tekst je astrologov
 * lunarni kalendar po paru faza + znak (`lib/lunar-texts.ts`).
 *
 * Redosled tabova je fiksan: onboarding jos nema korak sa interesovanjima.
 */
export function MesecDanasCard({ date, offset, chart, timeUnknown, name, excludeKey = null }: {
  date: Date;
  offset: number;
  chart: NatalChart;
  timeUnknown: boolean;
  name: string;
  /** Tranzit vec prikazan u "Tvom danu" — ne ponavlja se ovde. */
  excludeKey?: string | null;
}) {
  const faza = React.useMemo(() => phaseDay(date), [date]);
  const znak = signFromLongitude(faza.moonLongitude).sign;
  const [oblast, setOblast] = React.useState<LunarArea>('ljubav');
  const { body, loading } = useLunarText(faza.textPhase, znak.key, oblast);
  const s = body ? lunarneStavke(body) : null;
  const smer = faza.waxing ? 'raste' : 'opada';
  const naslov = `${faza.name} u ${SIGN_CASES[znak.key].loc}`;

  // LICNI DEO (Ivan, 28.9.2026): kako Mesec danas utice na tebe — najjaci
  // Mesecev aspekt na natalnu kartu koji postaje tacan tog dana (`moonDay`),
  // isti ceo dan. Bez njega (0—9 dana godisnje) red se ne prikazuje.
  const dan = React.useMemo(() => moonDay(chart, date, timeUnknown), [chart, date, timeUnknown]);
  const hit = strongestMoonHit(dan.hits, excludeKey);
  const kljucevi = React.useMemo(() => (hit ? [hit.contentKey] : []), [hit?.contentKey]);
  const { texts } = useTransitTexts(kljucevi);
  const hitTekst = hit ? texts.get(hit.contentKey) : undefined;
  const hitIme = hit ? `${hit.transiting.name} ${hit.aspect.name} natalni ${hit.natal.name}` : '';

  const kuca = lunationHouse(faza, chart, timeUnknown);
  // Tekst "faza u kuci" jos ne postoji; red se ne prikazuje dok ga astrolog ne posalje.
  const licniTekst: string | null = null;

  const BiljkaIkona = PLANT_ICON[znak.element];

  return (
    <View className={CARD_SURFACE}>
      <View className="p-5">
        <Text variant="caption">Za sve znakove</Text>

        <View className="mt-3 flex-row items-center gap-4">
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${faza.name}, osvetljenost ${faza.illuminationPct} posto, ${smer}`}>
            <MoonDisc angle={faza.angle} size={64} />
          </View>
          <View className="flex-1">
            <Text variant="h2">{naslov}</Text>
            <Text variant="muted" className="mt-0.5">Osvetljenost {faza.illuminationPct}% · {smer}</Text>
          </View>
        </View>

        {/* PRIVREMENA recenica faze dok astrolog ne posalje prave (`PHASE_SUMMARY_PRIVREMENO`). */}
        <Text variant="body" className="mt-4">{PHASE_SUMMARY_PRIVREMENO[faza.key]}</Text>
        <Text variant="muted" className="mt-1">Sledeća faza: {faza.next.name}, {formatDay(faza.next.at, date)}</Text>
      </View>

      {/* Oblasti — vodoravni niz kapsula, da duzi nazivi i Dynamic Type ne lome red. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        contentContainerClassName="gap-2 px-5">
        {LUNAR_AREAS.map((a) => (
          <Chip key={a.key} label={TAB[a.key]} selected={a.key === oblast} onPress={() => setOblast(a.key)} />
        ))}
      </ScrollView>

      <View className="px-5 pb-5 pt-4">
        {oblast === 'basta' && (
          <View className="mb-3 flex-row items-center gap-2">
            <BiljkaIkona size={18} color={neutral.ink} strokeWidth={1.8} />
            <Text variant="row" accessibilityLabel={`Odgovarajući deo biljke: ${PLANT_PART[znak.element].toLowerCase()}`}>
              {DAN_BILJKE[znak.element]}
            </Text>
          </View>
        )}
        {s && oblast === 'basta' ? (
          <>
            <Lista naslov="Uradi" stavke={s.uradi} />
            <Lista naslov="Izbegavaj" stavke={s.izbegavaj} className="mt-3" />
          </>
        ) : s && s.stavke.length ? (
          <Lista stavke={s.stavke} />
        ) : loading ? (
          <Text variant="muted">…</Text>
        ) : (
          <Text variant="muted">Saveti za ovu oblast još nisu stigli.</Text>
        )}
      </View>

      {(hit || (kuca && licniTekst)) && (
        <>
          <View className="h-px bg-border" />
          <View className="px-5 pt-5">
            <Text variant="caption">Za tebe, {name}</Text>
          </View>
          {kuca && licniTekst && (
            <View className="px-5 pt-1">
              <Text variant="row">{faza.name} pada u tvoju {kuca.house}. kuću: {kuca.theme}.</Text>
              <Text variant="body" className="mt-1">{licniTekst}</Text>
            </View>
          )}
          {hit && (
            // Red vodi na tumacenje tek kad tekst postoji; bez teksta ostaje racunato ime.
            <Pressable
              disabled={!hitTekst}
              onPress={() => router.push({ pathname: '/transit', params: { key: hit.contentKey } })}
              accessibilityRole={hitTekst ? 'button' : undefined}
              accessibilityLabel={`${hitTekst?.title ?? ''} ${hitIme}, tačan u ${formatTime(hit.exactAt)}`.trim()}
              className="flex-row items-center gap-3 px-5 pb-5 pt-2 active:opacity-60">
              <View className="flex-1">
                <Text variant="row">{hitTekst?.title || hitIme}</Text>
                {!!hitTekst?.body && <Text variant="body" className="mt-1" numberOfLines={3}>{hitTekst.body}</Text>}
                <Text variant="muted" className="mt-1">
                  {[hitTekst?.title ? hitIme : null, `tačan u ${formatTime(hit.exactAt)}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {hitTekst && <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />}
            </Pressable>
          )}
          {!hit && <View className="h-5" />}
        </>
      )}

      <View className="h-px bg-border" />
      <Pressable
        onPress={() => router.push({ pathname: '/moon', params: { day: String(offset), area: oblast } })}
        accessibilityRole="button"
        className="flex-row items-center justify-between px-5 py-4 active:opacity-60">
        <Text variant="row">Saznaj više</Text>
        <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function Lista({ naslov, stavke, className }: { naslov?: string; stavke: Stavka[]; className?: string }) {
  if (stavke.length === 0) return null;
  return (
    <View className={cn('gap-2', className)}>
      {naslov && <Text variant="caption">{naslov}</Text>}
      {stavke.map((x, i) => (
        <View key={i} className="flex-row gap-2">
          <Text variant="body">•</Text>
          <Text variant="default" className="flex-1">
            {x.naslov ? <Text variant="default" className="font-semibold">{x.naslov} – </Text> : null}
            {x.tekst}
          </Text>
        </View>
      ))}
    </View>
  );
}
