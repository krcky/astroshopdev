import * as React from 'react';
import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';

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
  // Tockic pocinje na 1. 1. 2000 — "Nastavi" se pali tek kad ga korisnik pomeri, inace bi
  // brz dodir dao kartu za izmisljen datum, bez ijedne poruke (UX recenzija 1.10.2026).
  const [izabran, setIzabran] = React.useState(!!draft.date);

  const next = () => {
    draft.set({
      date: { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() },
    });
    router.push('/time');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'cancel', onPress: () => router.replace('/welcome') }}
      icon={CalendarDays}
      title="Datum rođenja"
      primary={{ label: izabran ? 'Nastavi' : 'Izaberi datum', onPress: next, disabled: !izabran }}>
      <WheelPicker mode="date" value={value} onChange={(d) => { setValue(d); setIzabran(true); }} maximumDate={new Date()} />
    </OnboardingStep>
  );
}
