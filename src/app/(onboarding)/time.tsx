import * as React from 'react';
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { useDraft } from '@/store/draft';

export default function BirthTime() {
  const draft = useDraft();
  const [value, setValue] = React.useState(() => {
    const d = new Date(2000, 0, 1, 12, 0, 0);
    if (draft.time) { d.setHours(draft.time.hour); d.setMinutes(draft.time.minute); }
    return d;
  });

  const next = () => {
    draft.set({ time: { hour: value.getHours(), minute: value.getMinutes() }, timeSkipped: false });
    router.push('/place');
  };

  // Preskakanje je legitimno — mnogi ne znaju tacno vreme. Karta tada prelazi
  // na Whole Sign, a ascendent se ne prikazuje kao da je pouzdan.
  const skip = () => {
    draft.set({ time: null, timeSkipped: true });
    router.push('/place');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      question="U koliko sati?"
      primary={{ label: 'Nastavi', onPress: next }}
      secondary={{ label: 'Ne znam vreme', onPress: skip }}>
      <WheelPicker mode="time" value={value} onChange={setValue} />
    </OnboardingStep>
  );
}
