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
import { AstrologSlika } from '@/components/astrolog-slika';
import { PodvuceniTabovi } from '@/components/ui/podvuceni-tabovi';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { ASTROLOG, datumPitanja, natpisStatusa, neprocitan, oKome, type Pitanje } from '@/lib/pitanja';
import { useKrediti, useMojaPitanja } from '@/lib/pitanja-api';
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
  const t = useT();
  const [strana, setStrana] = React.useState<Strana>('covek');
  return (
    <Screen label={t.pitaj.tab.naslov} tint="gold" right={<ProfileButton />}>
      <Tabovi strana={strana} onChange={setStrana} />
      {strana === 'covek' ? <PitajCoveka /> : <PitajAI />}
    </Screen>
  );
}

/** Dve strane, podvucena izabrana (`ui/podvuceni-tabovi.tsx`). */
function Tabovi({ strana, onChange }: { strana: Strana; onChange: (s: Strana) => void }) {
  const t = useT().pitaj.tab;
  const strane = [
    { key: 'covek', natpis: t.covek },
    { key: 'ai', natpis: t.ai, oznaka: t.uskoro },
  ] as const;
  return <PodvuceniTabovi stavke={strane} izabrana={strana} onIzbor={onChange} className="mt-2" />;
}

function PitajCoveka() {
  const t = useT().pitaj.tab;
  const pitanja = useMojaPitanja();
  const krediti = useKrediti();
  const brojKredita = krediti.data ?? 0;

  // Odgovor stize bez push-a (jos ga nema) — lista se osvezi pri svakom dolasku na tab.
  const { refetch: osveziPitanja } = pitanja;
  const { refetch: osveziKredite } = krediti;
  useFocusEffect(React.useCallback(() => { osveziPitanja(); osveziKredite(); }, [osveziPitanja, osveziKredite]));

  // Prvo ucitavanje: ni uvod ni lista, da strana ne bljesne uvodom pa predje u listu.
  // SAMO prvo: posle greske (`errorUpdateCount`) ponovni upit vraca status u "pending",
  // pa je strana bila PRAZNA ~2 s pri svakom dolasku na tab dok traju ponavljanja
  // (snimak, 29.9.2026) — tada ostaje uvod dok odgovor ne stigne.
  if (pitanja.isPending && pitanja.fetchStatus === 'fetching' && pitanja.errorUpdateCount === 0) return null;

  const moja = pitanja.data ?? [];
  const kredit = brojKredita > 0 && (
    <Text variant="note" className="mb-3">
      {t.krediti(brojKredita)}
    </Text>
  );

  // Bez ijednog pitanja: uvod je na strani, "Pitaj" otvara odmah polje za pitanje.
  if (moja.length === 0) {
    return (
      <View className="mt-12">
        <PitajUvod />
        <View className="mt-4">
          {kredit}
          {/* Isto dugme kao "Saznaj više" na pocetnoj (Ivan, 29.9.2026), preko cele sirine. */}
          <Button istaknuto onPress={() => router.push('/pitanje-novo')}>
            <Text>{t.pitaj}</Text>
          </Button>
        </View>
      </View>
    );
  }

  // Ima pitanja (Ivan, 29.9.2026): dugme i lista; uvod je prvi korak lista odozdo.
  // Iznad dugmeta astrolog i jedna recenica (Ivan, 1.10.2026: bez toga je strana delovala prazno).
  return (
    <View className="mt-6">
      {/* Slika, naslov i jedan red ko odgovara (Ivan, 1.10.2026: manje teksta nego pre). */}
      <View className="mb-5 items-center">
        <AstrologSlika velicina={64} />
        <Text variant="h2" className="mt-3 text-center">{t.josJednoNaslov}</Text>
        <Text variant="body" className="mt-1 text-center">{t.josJedno(ASTROLOG.ime)}</Text>
      </View>
      {kredit}
      {/* Manje dugme, isto kao "Saznaj više" na pocetnoj, centrirano (Ivan, 1.10.2026). */}
      <View className="self-center">
        <Button
          size="compact"
          istaknuto
          className="h-auto px-5 py-[10px]"
          onPress={() => router.push({ pathname: '/pitanje-novo', params: { korak: 'uvod' } })}>
          <Text className="text-[16px] leading-[20px]">{t.postavi}</Text>
        </Button>
      </View>

      <Text variant="label" className="mb-3 mt-8">{t.mojaPitanja}</Text>
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
  const t = useT().pitaj;
  const novo = neprocitan(p);
  // Nacrt (nije placeno, astrolog ga ne vidi) se izdvaja od poslatih (UX recenzija
  // 1.10.2026): do tada je "Nije poslato" izgledalo isto kao "Odgovoreno", bez akcije.
  const nacrt = p.status === 'draft';
  // Pitanje o drugoj osobi: "Ana" ili "Ja i Ana" ispred stanja (29.9.2026).
  const o = oKome(p);
  return (
    <Pressable
      onPress={() => (p.status === 'draft'
        ? router.push('/pitanje-novo')
        : router.push({ pathname: '/pitanje', params: { id: p.id } }))}
      accessibilityRole="button"
      accessibilityHint={novo ? t.status.noviOdgovor : undefined}
      className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:opacity-60">
      <View className="flex-1">
        <Text variant="row" numberOfLines={2}>{p.tekst}</Text>
        <View className="mt-1 flex-row items-center gap-1.5">
          {novo && <View className="h-2 w-2 rounded-full" style={{ backgroundColor: brand.indigo }} />}
          <Text variant="caption" className={cn((novo || nacrt) && cn('text-foreground', tezina('izabranRed')))}>
            {t.tab.redOpis(o, natpisStatusa(p), datumPitanja(p))}
          </Text>
        </View>
      </View>
      {nacrt && <Text variant="muted" className="text-foreground">{t.tab.zavrsi}</Text>}
      <ChevronRight size={18} color={neutral.inkSubtle} />
    </Pressable>
  );
}

function PitajAI() {
  const t = useT().pitaj.tab;
  return (
    <View className={cn(CARD_SURFACE, 'mt-6 p-5')}>
      <View className="flex-row items-center gap-2">
        <Sparkles size={18} color={neutral.ink} strokeWidth={1.8} />
        <Text variant="h3">{t.ai}</Text>
        <Text variant="caption" className="text-subtle">{t.uskoro}</Text>
      </View>
      <Text variant="body" className="mt-2">
        {t.aiOpis}
      </Text>
    </View>
  );
}
