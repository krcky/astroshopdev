import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, Sparkles } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Screen } from '@/components/screen';
import { ProfileButton } from '@/components/profile-button';
import { PitajUvod } from '@/components/pitaj-uvod';
import { cn } from '@/lib/utils';
import { datumPitanja, natpisStatusa, neprocitan, type Pitanje } from '@/lib/pitanja';
import { useKrediti, useMojaPitanja } from '@/lib/pitanja-api';
import { mnozina } from '@/lib/mnozina';
import { brand, neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

type Strana = 'covek' | 'ai';

/**
 * Tab "Pitaj" (Ivan, 29.9.2026): dve strane — "Pitaj čoveka" (astrolog odgovara
 * glasovnom porukom, placa se jednom po pitanju) i "Pitaj AI" (uskoro).
 *
 * Server: `supabase/pitanja.sql`. Pisanje: list `/pitanje-novo`. Odgovor: `/pitanje`.
 * Uvod (astrolog, uslovi, cena) je `PitajUvod`: na strani dok nema pitanja, a
 * posle toga prvi korak lista. Cena dolazi iz prodavnice (`lib/kupovina.ts`).
 */
export default function AskScreen() {
  const [strana, setStrana] = React.useState<Strana>('covek');
  return (
    <Screen label="Pitaj astrologa" tint="gold" right={<ProfileButton />}>
      <Tabovi strana={strana} onChange={setStrana} />
      {strana === 'covek' ? <PitajCoveka /> : <PitajAI />}
    </Screen>
  );
}

/** Dve strane, podvucena izabrana — isti oblik kao tabovi oblasti na ekranu Mesec. */
function Tabovi({ strana, onChange }: { strana: Strana; onChange: (s: Strana) => void }) {
  const tab = (s: Strana, natpis: string, oznaka?: string) => {
    const aktivna = s === strana;
    return (
      <Pressable
        key={s}
        onPress={() => onChange(s)}
        accessibilityRole="tab"
        accessibilityState={{ selected: aktivna }}
        accessibilityLabel={oznaka ? `${natpis}, ${oznaka}` : natpis}
        className={cn('-mb-px flex-1 flex-row items-center justify-center gap-1.5 pb-3 pt-2', aktivna && 'border-b-2 border-foreground')}>
        <Text variant="row" className={cn(!aktivna && 'text-muted-foreground')}>{natpis}</Text>
        {oznaka && <Text variant="caption" className="text-subtle">{oznaka}</Text>}
      </Pressable>
    );
  };
  return (
    // Linija stoji direktno na sivom, pa `border-fill-strong` (pravilo 17).
    <View accessibilityRole="tablist" className="mt-2 flex-row border-b border-fill-strong">
      {tab('covek', 'Pitaj čoveka')}
      {tab('ai', 'Pitaj AI', 'uskoro')}
    </View>
  );
}

function PitajCoveka() {
  const pitanja = useMojaPitanja();
  const krediti = useKrediti();
  const brojKredita = krediti.data ?? 0;

  // Odgovor stize bez push-a (jos ga nema) — lista se osvezi pri svakom dolasku na tab.
  const { refetch: osveziPitanja } = pitanja;
  const { refetch: osveziKredite } = krediti;
  useFocusEffect(React.useCallback(() => { osveziPitanja(); osveziKredite(); }, [osveziPitanja, osveziKredite]));

  // Prvo ucitavanje: ni uvod ni lista, da strana ne bljesne uvodom pa predje u listu.
  if (pitanja.isPending && pitanja.fetchStatus === 'fetching') return null;

  const moja = pitanja.data ?? [];
  const kredit = brojKredita > 0 && (
    <Text variant="note" className="mb-3">
      {brojKredita === 1
        ? 'Imaš jedno plaćeno pitanje.'
        : `Imaš ${brojKredita} ${mnozina(brojKredita, ['plaćeno pitanje', 'plaćena pitanja', 'plaćenih pitanja'])}.`}
    </Text>
  );

  // Bez ijednog pitanja: uvod je na strani, "Pitaj" otvara odmah polje za pitanje.
  if (moja.length === 0) {
    return (
      <View className="mt-6">
        <PitajUvod />
        <View className="mt-5">
          {kredit}
          {/* Isto dugme kao "Saznaj više" na pocetnoj (Ivan, 29.9.2026), preko cele sirine. */}
          <Button istaknuto onPress={() => router.push('/pitanje-novo')}>
            <Text>Pitaj</Text>
          </Button>
        </View>
      </View>
    );
  }

  // Ima pitanja (Ivan, 29.9.2026): samo dugme i lista; uvod je prvi korak lista odozdo.
  return (
    <View className="mt-6">
      {kredit}
      <Button istaknuto onPress={() => router.push({ pathname: '/pitanje-novo', params: { korak: 'uvod' } })}>
        <Text>Postavi pitanje</Text>
      </Button>

      <Text variant="label" className="mb-3 mt-8">Moja pitanja</Text>
      <View className={CARD_SURFACE}>
        {moja.map((p, i) => (
          <React.Fragment key={p.id}>
            {i > 0 && <View className="h-px bg-border" />}
            <RedPitanja p={p} />
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

/**
 * Red u "Moja pitanja": pocetak pitanja, stanje i datum. Nov odgovor (jos
 * neotvoren) nosi indigo tackicu — istu boju kao broj na tabu. Nacrt otvara
 * pisanje, ostalo detalj.
 */
function RedPitanja({ p }: { p: Pitanje }) {
  const novo = neprocitan(p);
  return (
    <Pressable
      onPress={() => (p.status === 'draft'
        ? router.push('/pitanje-novo')
        : router.push({ pathname: '/pitanje', params: { id: p.id } }))}
      accessibilityRole="button"
      accessibilityHint={novo ? 'Novi odgovor' : undefined}
      className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:opacity-60">
      <View className="flex-1">
        <Text variant="row" numberOfLines={2}>{p.tekst}</Text>
        <View className="mt-1 flex-row items-center gap-1.5">
          {novo && <View className="h-2 w-2 rounded-full" style={{ backgroundColor: brand.indigo }} />}
          <Text variant="caption" className={cn(novo && cn('text-foreground', tezina('izabranRed')))}>
            {natpisStatusa(p)} · {datumPitanja(p)}
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={neutral.inkSubtle} />
    </Pressable>
  );
}

function PitajAI() {
  return (
    <View className={cn(CARD_SURFACE, 'mt-6 p-5')}>
      <View className="flex-row items-center gap-2">
        <Sparkles size={18} color={neutral.ink} strokeWidth={1.8} />
        <Text variant="h3">Pitaj AI</Text>
        <Text variant="caption" className="text-subtle">uskoro</Text>
      </View>
      <Text variant="body" className="mt-2">
        Za kraća pitanja, odgovor odmah — sastavljen iz tekstova astrologa koje već čitaš u aplikaciji. Radimo na tome.
      </Text>
    </View>
  );
}
