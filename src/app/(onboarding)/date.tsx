import * as React from 'react';
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { useDraft } from '@/store/draft';

const DEFAULT = new Date(2000, 0, 1, 12, 0, 0);

export default function BirthDate() {
  const draft = useDraft();
  const [value, setValue] = React.useState(() =>
    draft.date
      ? new Date(draft.date.year, draft.date.month - 1, draft.date.day, 12, 0, 0)
      : DEFAULT
  );

  const next = () => {
    draft.set({
      date: { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() },
    });
    router.push('/time');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'cancel', onPress: () => router.replace('/welcome') }}
      question="Kad si rođen?"
      primary={{ label: 'Nastavi', onPress: next }}>
      <WheelPicker mode="date" value={value} onChange={setValue} maximumDate={new Date()} />
    </OnboardingStep>
  );
}
