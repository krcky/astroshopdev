import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import type { City } from '@/lib/cities';
import { useCitySearch } from '@/lib/city-search';
import { useResolvedProfile } from '@/store/profile';
import { useSkyPlaceStore } from '@/store/sky-place';
import { cn } from '@/lib/utils';

/**
 * Izbor mesta odakle se gleda nebo.
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
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center gap-2 px-5 pb-2 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={14}
                     accessibilityRole="button" accessibilityLabel="Nazad">
            <ChevronLeft size={26} color="#141414" />
          </Pressable>
          <Text variant="label">Odakle gledaš</Text>
        </View>

        <ScrollView contentContainerClassName="px-5 pb-16" keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
          <Text variant="display" className="pb-1 pt-2">{aktivan.name}</Text>
          <Text variant="muted" className="mb-6">
            Kuće i ascendent zavise od mesta — nebo iznad Beograda i iznad
            Sidneja u istom trenutku nije isto.
          </Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="traži grad"
            placeholderTextColor="#9A9A9A"
            autoCorrect={false}
            className="border-b border-border pb-3 text-2xl text-foreground"
          />

          <View className="mt-4">
            {query.trim().length === 0 ? (
              <Izbor
                naslov={rodni.name}
                opis="Grad iz tvog profila"
                aktivno={izabran === null}
                onPress={() => izaberi(null)}
              />
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
              className="mt-6 self-start rounded-full border border-border px-5 py-2.5 active:opacity-60">
              <Text variant="label" className="text-xs">Vrati na {rodni.name}</Text>
            </Pressable>
          )}

          <Text variant="muted" className="mt-8 text-xs">
            Ovim se menja samo ekran „Trenutno na nebu". Tvoja natalna karta
            ostaje računata za mesto rođenja — ono se menja u profilu.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
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
      className="flex-row items-center justify-between border-b border-border py-3.5 active:opacity-60">
      <View className="flex-1">
        <Text className={cn('text-base', aktivno && 'font-semibold')}>{naslov}</Text>
        <Text variant="muted" className="text-xs">{opis}</Text>
      </View>
      {aktivno && <Check size={17} color="#141414" />}
    </Pressable>
  );
}
