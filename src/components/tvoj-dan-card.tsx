import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Info, Lightbulb, Sparkles, TriangleAlert } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { formatDate } from '@/lib/horoscope';
import type { NatalChart } from '@/lib/natal';
import { useTransitTexts } from '@/lib/transit-texts';
import { prveRecenice, stavkaZaPrikaz, triOdeljka, type Stavka } from '@/lib/tumacenje';
import type { TvojDanPick } from '@/lib/tvoj-dan';
import { dayKey } from '@/lib/transits';
import { useTvojDanLog } from '@/store/tvoj-dan-log';

/** Ikonice odeljaka na kartici: efekat, pazi, savet (Ivan, 28.9.2026). */
const IKONA: Record<string, typeof Sparkles> = { Efekat: Sparkles, Pazi: TriangleAlert, Savet: Lightbulb };



/**
 * "Tvoj dan" — Premium kartica sa najvaznijim tranzitom dana.
 * Izbor i rotacija su u `lib/tvoj-dan.ts`; ovde je samo prikaz.
 *
 * Tekst: podnaslov i tri stavke iz DUGE verzije (Premium je dobija od servera,
 * pravilo 8), sazetak iz kratke. Kad teksta nema, ostaje ono sto se racuna —
 * ime tranzita, ton, trajanje — i nista se ne izmislja.
 */
export function TvojDanCard({ pick, date, isToday }: {
  pick: TvojDanPick;
  date: Date;
  isToday: boolean;
  /** Vise se ne koristi (objasnjenje vladara je u `/tvoj-dan-info`); ostaje da pozivi ne pucaju. */
  chart?: NatalChart;
}) {
  const key = pick.contentKey;
  const kljucevi = React.useMemo(() => [key], [key]);
  const { texts: kratke, loading: l1 } = useTransitTexts(kljucevi, 'short');
  const { texts: duge, loading: l2 } = useTransitTexts(kljucevi, 'long');
  const loading = l1 || l2;
  const record = useTvojDanLog((s) => s.record);

  // Upis prikaza — SAMO za danas; pregled sutrasnjice ne sme da "potrosi" sutrasnji izbor.
  React.useEffect(() => {
    if (isToday) record(dayKey(date), key);
  }, [isToday, date, key, record]);

  const kratka = kratke.get(key);
  const duga = duge.get(key);

  const ime = `${pick.transiting.name} ${pick.aspect.name} ${pick.natal.name}`;
  // Naslov kartice je naslov TEKSTA ("Planovi koji donose uspeh"); ime tranzita je u
  // listu "Na osnovu cega" (Ivan, 28.9.2026). Bez teksta ostaje racunato ime.
  const naslov = duga?.title || kratka?.title || ime;
  const sazetak = kratka?.body ? prveRecenice(kratka.body) : duga?.body ? prveRecenice(duga.body) : '';

  // Tri stavke: iz duge verzije, sledeca pri svakom novom prikazu istog tranzita.
  // Bez duge verzije ostaju jedna recenica kratke (bez rotacije).
  const odeljci = duga ? triOdeljka(duga.sections) : null;
  const stavke: { oznaka: string; s: Stavka | null }[] = [
    { oznaka: 'Efekat', s: odeljci ? stavkaZaPrikaz(odeljci.efekat, pick.shownBefore) : kratka?.positive ? { tekst: kratka.positive } : null },
    { oznaka: 'Pazi', s: odeljci ? stavkaZaPrikaz(odeljci.pazi, pick.shownBefore) : kratka?.challenge ? { tekst: kratka.challenge } : null },
    { oznaka: 'Savet', s: odeljci ? stavkaZaPrikaz(odeljci.savet, pick.shownBefore) : kratka?.advice ? { tekst: kratka.advice } : null },
  ];

  // Bez kartice (Ivan, 28.9.2026): stoji direktno na sivoj pozadini pocetne,
  // kao prvi slajd karusela.
  return (
    <View>
      {/* 1. Datum izabranog dana (Ivan, 28.9.2026) i desno dugme (i): nativni iOS list
          odozdo "Na osnovu cega je ovaj tekst" (`app/tvoj-dan-info.tsx`). */}
      <View className="flex-row items-center justify-between">
        <Text variant="caption">{formatDate(date)} {date.getFullYear()}.</Text>
        <Pressable
          // `day`: izabrani dan, da trajanje u listu bude za taj dan, ne za danas.
          onPress={() => router.push({ pathname: '/tvoj-dan-info', params: { key, day: dayKey(date) } })}
          accessibilityRole="button"
          accessibilityLabel="Na osnovu čega je napisan ovaj tekst"
          // Visoko kao ikonica, da red ne naraste i datum ostane u ravni sa naslovima
          // ostalih slajdova; dodirna povrsina je ipak 44pt preko `hitSlop`.
          hitSlop={14}
          className="h-5 w-5 items-center justify-center active:opacity-60">
          <Info size={20} color={neutral.inkMuted} strokeWidth={2} />
        </Pressable>
      </View>

      {/* 2. Naslov teksta — najveca klasa u sistemu (`display`, Ivan 28.9.2026).
          TON je sklonjen za sada (Ivan, 28.9.2026: "dodacemo ga posle"); racun je u
          `lib/tone.ts`, prikaz u `components/tone-badge.tsx`. */}
      {/* Dok tekst ne stigne — traka, ne racunato ime: ime bi na promeni dana
          bljesnulo pre naslova teksta (Ivan, 28.9.2026). */}
      {loading && !duga?.title && !kratka?.title ? (
        <TextPlaceholder lines={0} title="display" className="mt-1" />
      ) : (
        <Text variant="display" className="mt-1">{naslov}</Text>
      )}

      {/* 5. Sazetak */}
      {!!sazetak && <Text variant="body" className="mt-4">{sazetak}</Text>}
      {!sazetak && loading && <TextPlaceholder lines={3} className="mt-4" />}

      {/* Trajanje (traka) je samo u listu "Na osnovu cega" — sa pocetne izbaceno (Ivan, 28.9.2026). */}

      {/* 7. Efekat, Pazi, Savet + "Saznaj vise" u jednoj kartici; odeljci razdvojeni
          linijama, svaki sa ikonicom (Ivan, 28.9.2026). Kompaktno: manji razmaci,
          naslov stavke u istom redu sa tekstom. To je ovde bezbedno — na kartici je
          obican prored; greska sa odsecanjem (`tumacenje-tekst.tsx`) je dolazila od
          povecanog proreda u tumacenju. */}
      <View className={cn(CARD_SURFACE, 'mt-5')}>
        {stavke.filter((x) => x.s).map(({ oznaka, s }, i) => {
          const Ikona = IKONA[oznaka];
          return (
            <View key={oznaka} className={cn('px-4 py-3', i > 0 && 'border-t border-border')}>
              {/* Ikonica bez kruga, uz oznaku; oznaka verzalom sa razmakom slova 7%
                  (13pt x 0,07 = 0,9pt) (Ivan, 28.9.2026). */}
              <View className="flex-row items-center gap-1.5">
                <Ikona size={14} color={neutral.inkMuted} strokeWidth={2} />
                <Text variant="caption" className="uppercase" style={{ letterSpacing: 13 * 0.07 }}>{oznaka}</Text>
              </View>
              <View className="mt-1">
                <Text variant="default">
                  {s!.naslov ? <Text variant="default" className="font-semibold">{s!.naslov}: </Text> : null}
                  {s!.tekst}
                </Text>
              </View>
            </View>
          );
        })}

        {/* 8. Ceo tekst — "Saznaj više", centrirano, u kartici (Ivan, 28.9.2026) */}
        <View className={cn('items-center px-4 py-3', stavke.some((x) => x.s) && 'border-t border-border')}>
          <Button
            size="compact"
            className="h-auto px-5 py-[10px]"
            onPress={() => router.push({ pathname: '/transit', params: { key } })}>
            <Text className="text-[16px] leading-[20px]">Saznaj više</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
