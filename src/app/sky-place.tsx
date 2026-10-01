import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Check } from 'lucide-react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { SheetScroll } from '@/components/sheet';
import { CARD_SURFACE } from '@/components/ui/card';
import type { City } from '@/lib/cities';
import { useCitySearch } from '@/lib/city-search';
import { useResolvedProfile } from '@/store/profile';
import { useSkyPlaceStore } from '@/store/sky-place';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/**
 * Izbor mesta odakle se gleda nebo. Od 28.9.2026 LIST ODOZDO (Ivan), sa
 * staklenog dugmeta sa imenom grada na Nebu — `_layout.tsx`. Zatvara se
 * povlacenjem nadole ili izborom grada.
 *
 * Menja SAMO ekran "Trenutno na nebu". Podaci o rodjenju se ne diraju — mesto
 * rodjenja se menja kroz `/edit` i to je jedina stvar koja pomera natalnu
 * kartu. Zato je i tekst na dnu izricit: korisnik mora da zna da ovim nista
 * ne kvari.
 */
export default function SkyPlace() {
  const resolved = useResolvedProfile();
  const izabran = useSkyPlaceStore((s) => s.city);
  const setCity = useSkyPlaceStore((s) => s.setCity);

  const [query, setQuery] = React.useState('');
  const { results, loading } = useCitySearch(query, 8);

  if (!resolved) return <Redirect href="/" />;

  const rodni = resolved.city;
  const aktivan = izabran ?? rodni;

  const izaberi = (c: City | null) => {
    setCity(c);
    router.back();
  };

  return (
    <SheetScroll keyboardShouldPersistTaps="handled">
          {/* Naslov lista kao na ostalim listovima; izabran grad je red sa kvacicom ispod. */}
          <Text variant="naslovLista">Odakle gledaš</Text>
          <Text variant="body" className="mb-6 mt-2">
            Kuće i ascendent zavise od mesta — nebo iznad Beograda i iznad
            Sidneja u istom trenutku nije isto.
          </Text>

          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Traži grad"
            autoCorrect={false}
            returnKeyType="search"
          />

          <View className="mt-4">
            {query.trim().length === 0 ? (
              <>
                {/* Izabran drugi grad stoji iznad grada iz profila — na listu nema
                    velikog imena grada kao nekad na strani, pa se vidi ovde. */}
                {izabran !== null && izabran.id !== rodni.id && (
                  <Izbor naslov={izabran.name} opis={izabran.country} aktivno onPress={() => izaberi(izabran)} />
                )}
                <Izbor
                  naslov={rodni.name}
                  opis="Grad iz tvog profila"
                  aktivno={izabran === null || izabran.id === rodni.id}
                  onPress={() => izaberi(null)}
                />
              </>
            ) : (
              <>
                {results.map((c) => (
                  <Izbor
                    key={c.id}
                    naslov={c.name}
                    opis={c.country}
                    aktivno={c.id === aktivan.id}
                    onPress={() => izaberi(c)}
                  />
                ))}
                {loading && (
                  <Text variant="muted" className="py-3 text-center text-sm">Tražim dalje…</Text>
                )}
                {!loading && results.length === 0 && query.trim().length >= 2 && (
                  <Text variant="muted" className="py-3 text-sm">
                    Nema grada pod tim imenom. Probaj bez kvačica ili napiši
                    veći grad u blizini.
                  </Text>
                )}
              </>
            )}
          </View>

          {izabran !== null && query.trim().length > 0 && (
            <Pressable
              onPress={() => izaberi(null)}
              accessibilityRole="button"
              className={cn(CARD_SURFACE, 'mt-6 self-start rounded-full px-5 py-2.5 active:opacity-60')}>
              <Text variant="label" className="text-xs">Vrati na {rodni.name}</Text>
            </Pressable>
          )}

          <Text variant="muted" className="mt-8 text-xs">
            Ovim se menja samo ekran „Trenutno na nebu“. Tvoja natalna karta
            ostaje računata za mesto rođenja — ono se menja u profilu.
          </Text>
    </SheetScroll>
  );
}

function Izbor({ naslov, opis, aktivno, onPress }: {
  naslov: string; opis: string; aktivno: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={aktivno ? { selected: true } : {}}
      accessibilityLabel={`${naslov}, ${opis}`}
      className="flex-row items-center justify-between border-b border-fill-strong py-3.5 active:opacity-60">
      <View className="flex-1">
        <Text className={cn('text-base', aktivno && tezina('izabranRed'))}>{naslov}</Text>
        <Text variant="muted" className="text-xs">{opis}</Text>
      </View>
      {aktivno && <Check size={17} color={neutral.ink} />}
    </Pressable>
  );
}
