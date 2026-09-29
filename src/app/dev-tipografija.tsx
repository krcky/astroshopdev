import * as React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Lightbulb, Minus, Plus, Sparkles } from 'lucide-react-native';

import { Screen } from '@/components/screen';
import { Text } from '@/components/ui/text';
import { NaslovSekcije } from '@/components/naslov-sekcije';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Group, GroupHeader, ListRow } from '@/components/ui/list';
import { CARD_SURFACE } from '@/components/ui/card';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { PlanetaIkona, PLANETA_POTEZ } from '@/components/planeta-ikona';
import { AspektIkona } from '@/components/aspekt-ikona';
import { OcenaTackice } from '@/components/ocena-oblasti';
import { OblastIkona } from '@/components/oblast-ikona';
import { cn } from '@/lib/utils';
import { tezina, TEZINE, type Uloga } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';
import { DEV_TOOLS_ENABLED } from '@/store/dev';
import { NatalWheel } from '@/components/natal-wheel';
import { kartaSaAscendentom } from '@/lib/test-karta';

const KARTA = kartaSaAscendentom('pisces');

type Varijanta = React.ComponentProps<typeof Text>['variant'];

const VARIJANTE: { v: NonNullable<Varijanta>; u: Uloga; mera: string }[] = [
  { v: 'display', u: 'display', mera: '32/38' },
  { v: 'title', u: 'title', mera: '21/26' },
  { v: 'section', u: 'section', mera: '20/25' },
  { v: 'nav', u: 'nav', mera: '18/23' },
  { v: 'h3', u: 'h3', mera: '17/22' },
  { v: 'row', u: 'row', mera: '17/22' },
  { v: 'label', u: 'label', mera: '17/22 sivo' },
  { v: 'question', u: 'question', mera: '17/22 sivo' },
  { v: 'reading', u: 'reading', mera: '17/26 sivo' },
  { v: 'default', u: 'default', mera: '15/20' },
  { v: 'body', u: 'body', mera: '15/20 sivo' },
  { v: 'muted', u: 'muted', mera: '15/20 sivo' },
  { v: 'chip', u: 'chip', mera: '15/20' },
  { v: 'caption', u: 'caption', mera: '13/18 sivo' },
  { v: 'tab', u: 'tab', mera: '11/13 sivo' },
];

const TUMACENJE = `Ovaj tranzit donosi jasniji pogled na odnose i novac. Lakše ćeš videti šta ti zaista odgovara.

• Iskrenost u odnosima – Otvoren razgovor sada daje više nego ćutanje.
• Mudre kupovine – Odloži velike troškove za nekoliko dana.`;

/**
 * SAMO ZA RAZVOJ: uzorak svih uloga teksta i tipicnih kompozicija, da se
 * debljine iz `theme/tipografija.ts` ocene zajedno. Otvara se: /dev-tipografija.
 */
export default function DevTipografija() {
  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;
  return (
    <Screen label="Tipografija" tabBarSpace={false} pushed>
      {/* 1. Sve varijante, jedna ispod druge */}
      <View className="pt-4">
        {VARIJANTE.map(({ v, u, mera }) => (
          <View key={v} className="mb-3">
            <Text variant={v}>Venera u tvojoj petoj kući</Text>
            <Text className="text-[11px] leading-[13px] text-subtle">{v} · {mera} · {TEZINE[u]}</Text>
          </View>
        ))}
      </View>

      {/* 2. Pocetna — naslov strane i "Tvoj dan" */}
      <Text variant="label" className="mb-2 mt-8">Početna — Tvoj dan</Text>
      <Text className={cn('text-[24px] leading-[30px] tracking-[-0.3px]', tezina('naslovStrane'))}>Tranziti</Text>
      <Text variant="caption" className="mt-4">Ponedeljak, 28. septembar 2026.</Text>
      <Text variant="display" className="mt-1">Planovi koji donose uspeh</Text>
      <Text variant="body" className="mt-4">Dan je dobar za dogovore i za ono što dugo odlažeš. Kreni od najtežeg.</Text>
      <View className={cn(CARD_SURFACE, 'mt-5')}>
        {[{ o: 'Efekat', I: Sparkles }, { o: 'Savet', I: Lightbulb }].map(({ o, I }, i) => (
          <View key={o} className={cn('flex-row gap-3 p-4', i > 0 && 'border-t border-border')}>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-fill">
              <I size={18} color={neutral.ink} strokeWidth={1.8} />
            </View>
            <View className="flex-1">
              <Text variant="caption">{o}</Text>
              <Text variant="default" className="mt-0.5">
                <Text variant="default" className={tezina('naslovUTekstu')}>Jasni ciljevi: </Text>
                Lakše ti je da kažeš šta želiš i da to i dobiješ.
              </Text>
            </View>
          </View>
        ))}
        <View className="items-center border-t border-border p-4">
          <Button size="compact" istaknuto className="h-auto px-5 py-[10px]"><Text className="text-[16px] leading-[20px]">Saznaj više</Text></Button>
        </View>
      </View>

      {/* 3. Danas ukratko — ocene + ide ti / koci te */}
      <Text variant="display" className="mb-4 mt-10">Danas ukratko</Text>
      <View className={CARD_SURFACE}>
        <View className="py-3.5 pl-4 pr-[22px]">
          {(['ljubav', 'zdravlje', 'karijera', 'kuca'] as const).map((k, i) => (
            <View key={k} className="flex-row items-center gap-2 py-1">
              <OblastIkona oblast={k} size={16} />
              <Text variant="default" className={cn('flex-1 text-foreground', tezina('oblast'))}>
                {['Ljubav', 'Zdravlje i lepota', 'Karijera i finansije', 'Kuća i bašta'][i]}
              </Text>
              <OcenaTackice ocena={[5, 3, 4, 2][i]} />
            </View>
          ))}
        </View>
        <View className="h-px bg-border" />
        {[{ n: 'Ide ti', I: Plus, b: '#7ACCEA' }, { n: 'Koči te', I: Minus, b: '#F8B3C3' }].map(({ n, I, b }, i) => (
          <View key={n} className={cn('px-4 py-4', i > 0 && 'border-t border-border')}>
            <View className="mb-1 flex-row items-center gap-1.5">
              <I size={16} color={b} strokeWidth={3} />
              <Text variant="h3">{n}</Text>
            </View>
            <Text variant="default" className="py-1.5">Razgovor sa bliskom osobom teče lakše nego inače.</Text>
            <Text variant="default" className="py-1.5">Novac: dobar dan za pregled računa.</Text>
          </View>
        ))}
      </View>

      {/* 4b. Sve ikonice planeta i tacaka */}
      <Text variant="label" className="mb-2 mt-8">Ikonice planeta</Text>
      <View className="flex-row flex-wrap gap-2">
        {(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northNode', 'chiron', 'ascendant', 'midheaven'] as const).map((k) => (
          <PlanetaIkona key={k} planeta={k} size={40} />
        ))}
      </View>
      <View className="mt-3 flex-row gap-4">
        {(['conjunction', 'sextile', 'square', 'trine', 'opposition'] as const).map((k) => (
          <AspektIkona key={k} aspekt={k} size={24} potez={PLANETA_POTEZ * 40} />
        ))}
      </View>
      <Text variant="caption" className="mt-2">Kartica tranzita: /dev-tranziti</Text>

      {/* 5. Tumacenje (list /transit): display naslov, odeljci kroz `NaslovSekcije` (h2) sa linijom */}
      <Text variant="label" className="mb-2 mt-8">List tumačenja</Text>
      <View className="rounded-xl bg-background p-5">
        <Text variant="label">Venera konjunkcija natalni MC</Text>
        <Text variant="display" className="mb-5 mt-1">Pozitivne tendencije</Text>
        <TumacenjeTekst tekst={TUMACENJE.split('\n\n')[0]} />
        <View className="mt-7">
          <NaslovSekcije ikona={<Sparkles size={20} color={neutral.inkSubtle} />}>Pozitivni efekti</NaslovSekcije>
          <TumacenjeTekst tekst={TUMACENJE.split('\n\n')[1]} />
        </View>
      </View>

      {/* 5b. Zaglavlje kartice/lista: h2 + muted, pa h3 u kutiji */}
      <Text variant="label" className="mb-2 mt-8">Zaglavlja (h2, h3)</Text>
      <View className={cn(CARD_SURFACE, 'p-5')}>
        <Text variant="h2">Pun Mesec u Ovnu</Text>
        <Text variant="muted" className="mt-0.5">Osvetljenost 98% · raste</Text>
        <Text variant="body" className="mt-4">Energija raste, pa se lakše gradi i započinje.</Text>
        <View className="mt-5 rounded-lg bg-fill p-4">
          <Text variant="h3">Tranzit tvog vladara</Text>
          <Text variant="body" className="mt-2">Jupiter je vladar tvog Ascendenta u Ribama.</Text>
        </View>
      </View>

      {/* 5c. Tocak natalne karte — test karta */}
      <Text variant="label" className="mb-2 mt-8">Točak karte</Text>
      <View className="items-center">
        <NatalWheel chart={KARTA} size={340} />
      </View>

      {/* 6. Lista i kapsule (profil, Mesec) */}
      <GroupHeader className="ml-0">Podaci o rođenju</GroupHeader>
      <Group className="mx-0">
        <ListRow title="Datum rođenja" subtitle="10. jul 1990." onPress={() => {}} />
        <ListRow title="Mesto" subtitle="Beograd" onPress={() => {}} />
        <ListRow title="Obriši nalog" destructive onPress={() => {}} />
      </Group>
      <View className="mt-5 flex-row flex-wrap gap-2">
        <Chip label="Ljubav" selected onPress={() => {}} />
        <Chip label="Zdravlje i lepota" onPress={() => {}} />
        <Chip label="Karijera" onPress={() => {}} />
      </View>
      <View className="mt-5 flex-row gap-6">
        {['Mesec', 'Znak', 'Element'].map((l, i) => (
          <View key={l}>
            <Text variant="h3">{['98%', 'Ovan', 'Vatra'][i]}</Text>
            <Text variant="caption" className={cn('mt-2 uppercase text-foreground', tezina('statOznaka'))}>{l}</Text>
          </View>
        ))}
      </View>

      {/* 7. Onboarding korak */}
      <Text variant="label" className="mb-2 mt-8">Onboarding</Text>
      <Text variant="question">Datum rođenja</Text>
      <Text variant="display" className="mt-2 text-center">10. jul 1990.</Text>
      <Text variant="note" className="mb-3 mt-6">Tačan datum je dovoljan za znak i Mesec.</Text>
      <Button><Text>Nastavi</Text></Button>
      <Button variant="secondary" className="mb-10 mt-3"><Text>Ne znam tačno vreme</Text></Button>
    </Screen>
  );
}
