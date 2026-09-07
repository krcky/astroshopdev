import * as React from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
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
      question="Kako da te zovemo?"
      note="Tako ti se horoskop obraća direktno, umesto kao oglasna tabla."
      primary={{ label: busy ? 'Čuvam…' : 'Nastavi', onPress: next, disabled: !valid || busy }}>
      <View className="items-center">
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="tvoje ime"
          placeholderTextColor="#9A9A9A"
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus
          selectTextOnFocus
          maxLength={60}
          className="w-full border-b border-border pb-3 text-center text-3xl text-foreground"
        />
      </View>
    </OnboardingStep>
  );
}
