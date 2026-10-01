import * as React from 'react';
import { router } from 'expo-router';
import { UserRound } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { Input } from '@/components/ui/input';
import { useT } from '@/i18n';
import { useNovaOsoba } from '@/store/nova-osoba';

/**
 * Nova osoba, korak 1: ime. Tok je kao onboarding (Ivan, 29.9.2026) — jedno
 * pitanje po ekranu, isti okvir (`OnboardingStep`); na server ide tek u pregledu.
 * X zatvara ceo tok.
 */
export default function NovaOsobaIme() {
  const t = useT();
  const nacrt = useNovaOsoba();
  const [ime, setIme] = React.useState(nacrt.ime);
  const valid = ime.trim().length > 0 && ime.trim().length <= 60;

  const dalje = () => {
    if (!valid) return;
    nacrt.postavi({ ime: ime.trim() });
    router.push('/nova-osoba/odnos');
  };

  return (
    <OnboardingStep
      exit={{ kind: 'cancel', onPress: () => router.back() }}
      icon={UserRound}
      title={t.profil.novaOsoba.imeNaslov}
      subtitle={t.profil.novaOsoba.imePodnaslov}
      center={false}
      note={null}
      primary={{ label: t.opste.nastavi, onPress: dalje, disabled: !valid }}>
      <Input
        povrsina="siva"
        value={ime}
        onChangeText={setIme}
        placeholder={t.profil.rodjenje.imeIliNadimak}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={dalje}
        autoFocus
        maxLength={60}
      />
    </OnboardingStep>
  );
}
