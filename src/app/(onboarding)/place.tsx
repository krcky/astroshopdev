import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { City } from '@/lib/cities';
import { imeZemlje, useCitySearch } from '@/lib/city-search';
import { useDraft } from '@/store/draft';
import { useT } from '@/i18n';

export default function BirthPlace() {
  const t = useT();
  const draft = useDraft();
  const [query, setQuery] = React.useState('');
  const [city, setCity] = React.useState<City | null>(null);

  const { results, loading } = useCitySearch(city ? '' : query);

  const next = () => {
    if (!city) return;
    draft.set({ city });
    router.push('/reveal');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      icon={MapPin}
      title={t.onboarding.mesto.naslov}
      center={false}
      // Dok se bira, lista treba svaki red iznad tastature — objasnjenje o
      // privatnosti se vrati kad je grad izabran i liste vise nema (Ivan,
      // 29.9.2026: treci grad je bio odsecen). Red koji ide ispod ivice se pretapa.
      note={city ? t.onboarding.korak.privatnost : null}
      pretapanje
      primary={{ label: t.opste.nastavi, onPress: next, disabled: !city }}>

      <Input
        povrsina="siva"
        value={city ? `${city.name}, ${imeZemlje(city)}` : query}
        onChangeText={(v) => { setQuery(v); setCity(null); }}
        placeholder={t.onboarding.pretragaGrada.placeholder}
        autoFocus
        autoCorrect={false}
      />

      <View className="mt-4">
        {!city && results.map((c) => (
          <Pressable
            key={`${c.name}-${c.country}`}
            onPress={() => { setCity(c); setQuery(''); }}
            className="flex-row items-center justify-between border-b border-fill-strong py-3.5 active:opacity-60">
            <Text className="text-base">{c.name}</Text>
            <Text variant="muted">{imeZemlje(c)}</Text>
          </Pressable>
        ))}
        {loading && (
          <Text variant="muted" className="py-3 text-center text-sm">{t.onboarding.pretragaGrada.trazimDalje}</Text>
        )}
      </View>
    </OnboardingStep>
  );
}
