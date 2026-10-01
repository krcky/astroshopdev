import * as React from 'react';
import { Redirect, router } from 'expo-router';
import { Clock } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { useT } from '@/i18n';
import { useNovaOsoba } from '@/store/nova-osoba';

/**
 * Nova osoba, korak 4: vreme rodjenja. Za tudje rodjenje se vreme cesto ne zna —
 * "Ne znam vreme" je ravnopravan izlaz; karta tada ide po Whole Sign-u, bez
 * podznaka i kuca (pravilo 5), i to se kaze.
 */
export default function NovaOsobaVreme() {
  const t = useT();
  const nacrt = useNovaOsoba();
  const [vreme, setVreme] = React.useState(() => {
    const d = new Date(2000, 0, 1, 12, 0);
    if (nacrt.vreme) { d.setHours(nacrt.vreme.hour); d.setMinutes(nacrt.vreme.minute); }
    return d;
  });
  const [izabrano, setIzabrano] = React.useState(!!nacrt.vreme);

  if (!nacrt.ime || !nacrt.datum) return <Redirect href="/nova-osoba" />;

  const dalje = (v: { hour: number; minute: number } | null) => {
    nacrt.postavi({ vreme: v });
    router.push('/nova-osoba/mesto');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      icon={Clock}
      title={t.profil.rodjenje.vreme}
      subtitle={t.profil.novaOsoba.vremePodnaslov}
      note={t.profil.novaOsoba.napomena}
      primary={{
        label: izabrano ? t.opste.nastavi : t.profil.novaOsoba.izaberiVreme,
        onPress: () => dalje({ hour: vreme.getHours(), minute: vreme.getMinutes() }),
        disabled: !izabrano,
      }}
      secondary={{ label: t.profil.rodjenje.neZnamVreme, onPress: () => dalje(null) }}>
      <WheelPicker mode="time" value={vreme} onChange={(d) => { setVreme(d); setIzabrano(true); }} />
    </OnboardingStep>
  );
}
