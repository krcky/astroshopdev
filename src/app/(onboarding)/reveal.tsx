import * as React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { CelestialOrb } from '@/components/celestial-orb';
import { useDraft } from '@/store/draft';
import { resolveProfile } from '@/store/profile';
import { traitsForSign } from '@/lib/traits';

export default function Reveal() {
  const draft = useDraft();

  const resolved = React.useMemo(() => {
    if (!draft.date || !draft.cityName) return null;
    return resolveProfile({
      name: '',
      birth: draft.date,
      time: draft.time,
      cityName: draft.cityName,
    });
  }, [draft.date, draft.time, draft.cityName]);

  // Ako je draft izgubljen (npr. ponovo ucitana aplikacija), pocinje se ispocetka.
  if (!resolved) return <Redirect href="/welcome" />;

  const sun = resolved.chart.planets.find((p) => p.key === 'sun')!;
  const moon = resolved.chart.planets.find((p) => p.key === 'moon')!;
  const asc = resolved.chart.ascendantSign.sign;
  const traits = traitsForSign(sun.position.sign.key);

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      note="Pozicije računamo iz podataka o kretanju planeta, za tvoj tačan trenutak i mesto rođenja."
      primary={{ label: 'Nastavi', onPress: () => router.push('/account') }}>

      <View className="items-center">
        <CelestialOrb size={200} />

        <View className="mt-10 flex-row items-center gap-3">
          <Placement glyph="☉︎" label={sun.position.sign.name} />
          <Placement glyph="☽︎" label={moon.position.sign.name} />
          <Placement glyph="↑" label={resolved.timeUnknown ? '—' : asc.name} muted={resolved.timeUnknown} />
        </View>

        <View className="mt-10 items-center">
          {traits.map((t) => (
            <Text key={t} variant="display" className="py-1 text-center text-3xl">{t}</Text>
          ))}
        </View>

        {resolved.timeUnknown && (
          <Text variant="muted" className="mt-8 px-4 text-center text-xs">
            Bez vremena rođenja ascendent se ne može izračunati. Dopunićeš ga kasnije u profilu.
          </Text>
        )}
      </View>
    </OnboardingStep>
  );
}

function Placement({ glyph, label, muted }: { glyph: string; label: string; muted?: boolean }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Glyph size={14} className={muted ? 'text-muted-foreground' : 'text-foreground'}>{glyph}</Glyph>
      <Text variant="label" className={muted ? '' : 'text-foreground'}>{label}</Text>
    </View>
  );
}
