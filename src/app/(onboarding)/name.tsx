import * as React from 'react';
import { router } from 'expo-router';
import { UserRound } from 'lucide-react-native';

import { OnboardingStep } from '@/components/onboarding-step';
import { Input } from '@/components/ui/input';
import { useProfileStore } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { pushProfile } from '@/lib/sync';

export default function Name() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const user = useAuthStore((s) => s.user);

  // Prefilovano: iz emaila sada, iz Apple/Google naloga kad ih povezemo.
  const [name, setName] = React.useState(profile?.name ?? '');
  const [busy, setBusy] = React.useState(false);

  const valid = name.trim().length > 0 && name.trim().length <= 60;

  const next = async () => {
    if (!valid || !profile || busy) return;
    setBusy(true);
    const updated = { ...profile, name: name.trim() };
    setProfile(updated);
    if (user) await pushProfile(user.id, updated);
    setBusy(false);
    router.replace('/push');
  };

  return (
    <OnboardingStep
      icon={UserRound}
      title="Kako da te zovemo?"
      subtitle="Tako ti se horoskop obraća direktno, umesto kao oglasna tabla."
      center={false}
      note={null}
      primary={{ label: 'Nastavi', onPress: next, disabled: !valid, ucitava: busy }}>
      <Input
        povrsina="siva"
        value={name}
        onChangeText={setName}
        placeholder="Tvoje ime"
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="done"
        onSubmitEditing={next}
        autoFocus
        selectTextOnFocus
        maxLength={60}
      />
    </OnboardingStep>
  );
}
