import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import {
  Apple, Briefcase, Carrot, ChevronRight, Droplet, Flame, Flower2,
  Heart, HeartPulse, House, Leaf, Mountain, Sprout, Wind,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Screen } from '@/components/screen';
import { Glyph } from '@/components/ui/glyph';
import { CARD_SURFACE } from '@/components/ui/card';
import { MoonDisc } from '@/components/moon-disc';
import { cn } from '@/lib/utils';
import { moonPhase } from '@/lib/astro';
import { moonDay } from '@/lib/transits';
import { formatDay, formatTime } from '@/lib/horoscope';
import {
  moonState, moonSignAt, moonElement, formatIllumination, phaseDay, LUNAR_AREAS, type LunarArea,
} from '@/lib/moon';
import { SIGN_CASES, signFromLongitude, type Element } from '@/lib/zodiac';
import { useLunarTexts } from '@/lib/lunar-texts';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { useTransitTexts } from '@/lib/transit-texts';
import { useResolvedProfile } from '@/store/profile';
import { neutral } from '@/theme/tokens';

const PLANT_ICON: Record<Element, typeof Apple> = { vatra: Apple, zemlja: Carrot, vazduh: Flower2, voda: Leaf };
const ELEMENT_ICON: Record<Element, typeof Apple> = { vatra: Flame, zemlja: Mountain, vazduh: Wind, voda: Droplet };
const AREA_ICON: Record<LunarArea, typeof Apple> = {
  ljubav: Heart, zdravlje: HeartPulse, karijera: Briefcase, kuca: House, basta: Sprout,
};

/**
 * Ekran Mesec — otvara se sa kartice na pocetnoj. Sve sto se o Mesecu tog dana
 * zna: crtez, faza, procenat, lunarni dan, znak (i do kad), sledeci mlad i pun
 * Mesec, element i deo biljke, saveti po oblastima i Mesecevi tranziti na kartu.
 *
 * `day` je pomeraj dana sa pocetne (-2..2), da ekran prati izabrani dan;
 * `area` je oblast izabrana na pocetnoj, da se otvori bas taj tab.
 * Saveti po oblastima su lunarni kalendar astrologa (`lunar_texts`, 28.9.2026):
 * faza i znak dolaze iz `phaseDay()`, istog izvora kao kartica na pocetnoj. Na
 * dan glavne faze znak je onaj iz TRENUTKA faze, pa ekran kaze na sta se tekst
 * odnosi ("Pun mesec u Biku"). Bez teksta tab to kaze, ne izmislja.
 */
export default function MoonScreen() {
  const { day, area } = useLocalSearchParams<{ day?: string; area?: string }>();
  const resolved = useResolvedProfile();
  // Otvara se na oblasti koja je bila izabrana na pocetnoj.
  const [oblast, setOblast] = React.useState<LunarArea>(
    LUNAR_AREAS.some((a) => a.key === area) ? (area as LunarArea) : 'ljubav'
  );

  const date = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (Number(day) || 0));
    return d;
  }, [day]);
  const dan = React.useMemo(
    () => (resolved ? moonDay(resolved.chart, date, resolved.timeUnknown) : null),
    [resolved, date]
  );
  const stanje = React.useMemo(() => moonState(date), [date]);
  const kljucevi = React.useMemo(() => (dan ? dan.hits.map((h) => h.contentKey) : []), [dan]);
  const { texts } = useTransitTexts(kljucevi);
  const faza = React.useMemo(() => phaseDay(date), [date]);
  const lunarniZnak = signFromLongitude(faza.moonLongitude).sign;
  const { texts: lunarni, loading: lunarniLoading } = useLunarTexts(faza.textPhase, lunarniZnak.key);

  if (!resolved || !dan) return <Redirect href="/" />;

  const znak = moonSignAt(dan, date);
  const { element, plant } = moonElement(znak);
  const BiljkaIkona = PLANT_ICON[znak.element];
  const ElementIkona = ELEMENT_ICON[znak.element];
  const uZnaku = dan.ingress
    ? `u ${SIGN_CASES[dan.sign.key].loc} do ${formatTime(dan.ingress.at)}, zatim u ${SIGN_CASES[dan.ingress.sign.key].loc}`
    : `u ${SIGN_CASES[dan.sign.key].loc}`;
  const mena = [
    { naziv: 'Mlad Mesec', kad: stanje.nextNew },
    { naziv: 'Pun Mesec', kad: stanje.nextFull },
  ].sort((a, b) => a.kad.getTime() - b.kad.getTime());
  const savet = lunarni.get(oblast);

  return (
    <Screen
      label="Mesec"
      // Izuzetak od unutrasnjih strana: Mesec zadrzava ljubicasti preliv (Ivan, 27.9.2026).
      tint="purple"
      tabBarSpace={false}
      pushed>
      <View className="items-center pt-4">
        <MoonDisc angle={stanje.angle} size={160} />
        <Text variant="title" className="mt-5">{moonPhase(date).name}</Text>
        <Text variant="muted" className="mt-1 text-center">
          {formatIllumination(stanje.illumination)} · {stanje.lunarDay}. lunarni dan
        </Text>
        <Text variant="muted" className="text-center">{uZnaku}</Text>
        <View className="mt-4 flex-row gap-2">
          {mena.map((m) => (
            <View key={m.naziv} className="rounded-full bg-card px-3 py-1.5">
              <Text variant="caption">{m.naziv} {formatDay(m.kad, date)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Cetiri podatka, kao u starom lunarnom kalendaru (Ivan, 27.9.2026). */}
      <View className={cn(CARD_SURFACE, 'mt-8 flex-row px-2 py-5')}>
        <Stat label="Mesec" value={formatIllumination(stanje.illumination)}>
          <MoonDisc angle={stanje.angle} size={26} />
        </Stat>
        <Stat label="Znak" value={znak.name}>
          <Glyph size={22} className="text-foreground">{znak.glyph}</Glyph>
        </Stat>
        <Stat label="Biljka" value={plant}>
          <BiljkaIkona size={22} color={neutral.ink} strokeWidth={1.8} />
        </Stat>
        <Stat label="Element" value={element}>
          <ElementIkona size={22} color={neutral.ink} strokeWidth={1.8} />
        </Stat>
      </View>

      {/* Saveti po oblastima — tabovi kao u starom lunarnom kalendaru. */}
      <View className={cn(CARD_SURFACE, 'mt-4 px-4 pb-5 pt-2')}>
        <View className="flex-row border-b border-border">
          {LUNAR_AREAS.map((a) => {
            const Ikona = AREA_ICON[a.key];
            const aktivna = a.key === oblast;
            return (
              <Pressable
                key={a.key}
                onPress={() => setOblast(a.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: aktivna }}
                className={cn('flex-1 items-center gap-1 pb-2 pt-2', aktivna && 'border-b-2 border-foreground')}>
                <Ikona size={20} color={aktivna ? neutral.ink : neutral.inkSubtle} strokeWidth={1.8} />
                <Text variant="caption" className={cn('text-[11px]', aktivna && 'text-foreground')}>{a.name}</Text>
              </Pressable>
            );
          })}
        </View>
        {savet ? (
          <View className="mt-4 gap-3">
            <Text variant="caption">{faza.name} u {SIGN_CASES[lunarniZnak.key].loc}</Text>
            <TumacenjeTekst tekst={savet} />
          </View>
        ) : (
          <Text variant="muted" className="mt-4">
            {lunarniLoading ? 'Učitavam…' : 'Saveti za ovu oblast još nisu stigli.'}
          </Text>
        )}
      </View>

      {/* Mesecevi tranziti na kartu tog dana, po satu. */}
      {dan.hits.length > 0 && (
        <View className="mt-9">
          <Text variant="label" className="mb-3">Za tebe danas</Text>
          <View className={CARD_SURFACE}>
            {dan.hits.map((h, i) => {
              const tekst = texts.get(h.contentKey);
              const ime = `${h.transiting.name} ${h.aspect.name} natalni ${h.natal.name}`;
              return (
                <React.Fragment key={h.contentKey}>
                  {i > 0 && <View className="h-px bg-border" />}
                  <Pressable
                    disabled={!tekst}
                    onPress={() => router.push({ pathname: '/transit', params: { key: h.contentKey } })}
                    accessibilityRole={tekst ? 'button' : undefined}
                    className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:opacity-60">
                    <View className="flex-1">
                      <Text variant="row">{tekst?.title || ime}</Text>
                      <Text variant="caption">
                        {[tekst?.title ? ime : null, `tačan u ${formatTime(h.exactAt)}`].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    {tekst && <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} />}
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      )}
    </Screen>
  );
}

function Stat({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-fill">{children}</View>
      <Text variant="caption" className="mt-2 font-semibold uppercase text-foreground">{label}</Text>
      <Text variant="muted">{value}</Text>
    </View>
  );
}
