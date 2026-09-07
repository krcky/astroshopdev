import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { searchCities, type City } from '@/lib/cities';
import { useDraft } from '@/store/draft';

export default function BirthPlace() {
  const draft = useDraft();
  const [query, setQuery] = React.useState('');
  const [city, setCity] = React.useState<City | null>(null);

  const results = React.useMemo(() => (city ? [] : searchCities(query)), [query, city]);

  const next = () => {
    if (!city) return;
    draft.set({ cityName: city.name });
    router.push('/reveal');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      question="Gde si rođen?"
      center={false}
      primary={{ label: 'Nastavi', onPress: next, disabled: !city }}>

      <TextInput
        value={city ? `${city.name}, ${city.country}` : query}
        onChangeText={(t) => { setQuery(t); setCity(null); }}
        placeholder="grad"
        placeholderTextColor="#9A9A9A"
        autoFocus
        autoCorrect={false}
        className="border-b border-border pb-3 text-center text-3xl text-foreground"
      />

      <View className="mt-4">
        {results.map((c) => (
          <Pressable
            key={`${c.name}-${c.country}`}
            onPress={() => { setCity(c); setQuery(''); }}
            className="flex-row items-center justify-between border-b border-border py-3.5 active:opacity-60">
            <Text className="text-base">{c.name}</Text>
            <Text variant="muted">{c.country}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingStep>
  );
}
