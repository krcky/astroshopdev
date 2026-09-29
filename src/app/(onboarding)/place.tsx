import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { MapPin } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { City } from '@/lib/cities';
import { useCitySearch } from '@/lib/city-search';
import { useDraft } from '@/store/draft';

export default function BirthPlace() {
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
      title="Mesto rođenja"
      center={false}
      primary={{ label: 'Nastavi', onPress: next, disabled: !city }}>

      <Input
        povrsina="siva"
        value={city ? `${city.name}, ${city.country}` : query}
        onChangeText={(t) => { setQuery(t); setCity(null); }}
        placeholder="Grad"
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
            <Text variant="muted">{c.country}</Text>
          </Pressable>
        ))}
        {loading && (
          <Text variant="muted" className="py-3 text-center text-sm">Tražim dalje…</Text>
        )}
      </View>
    </OnboardingStep>
  );
}
