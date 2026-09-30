import * as React from 'react';
import { Redirect, router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { NAPOMENA_PODACI } from '@/lib/osobe';
import { useNovaOsoba } from '@/store/nova-osoba';

/** Nova osoba, korak 3: datum rodjenja — isti tockic kao u onboardingu. */
export default function NovaOsobaDatum() {
  const nacrt = useNovaOsoba();
  const [datum, setDatum] = React.useState(() =>
    nacrt.datum ? new Date(nacrt.datum.year, nacrt.datum.month - 1, nacrt.datum.day, 12) : new Date(2000, 0, 1, 12)
  );

  if (!nacrt.ime) return <Redirect href="/nova-osoba" />;

  const dalje = () => {
    nacrt.postavi({ datum: { year: datum.getFullYear(), month: datum.getMonth() + 1, day: datum.getDate() } });
    router.push('/nova-osoba/vreme');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      icon={CalendarDays}
      title="Datum rođenja"
      note={NAPOMENA_PODACI}
      primary={{ label: 'Nastavi', onPress: dalje }}>
      <WheelPicker mode="date" value={datum} onChange={setDatum} maximumDate={new Date()} />
    </OnboardingStep>
  );
}
