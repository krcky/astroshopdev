import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { Text } from '@/components/ui/text';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AUTH_MODE } from '@/lib/auth-mode';
import { completeSignup, routeAfterSignup } from '@/lib/signup';

export default function Account() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [socialNote, setSocialNote] = React.useState(false);

  const emailOk = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email.trim());
  const valid = AUTH_MODE === 'otp' ? emailOk : emailOk && password.length >= 6;

  const submit = async () => {
    if (!valid || busy) return;
    if (!isSupabaseConfigured) { setError('Nalog još nije podešen.'); return; }
    setBusy(true);
    setError(null);
    const mail = email.trim().toLowerCase();

    try {
      if (AUTH_MODE === 'otp') {
        const { error } = await supabase.auth.signInWithOtp({
          email: mail,
          options: { shouldCreateUser: true },
        });
        if (error) {
          setError(/rate|limit|seconds/i.test(error.message)
            ? 'Previše pokušaja. Sačekaj minut pa probaj ponovo.'
            : 'Nismo uspeli da pošaljemo kod. Proveri email i internet.');
          return;
        }
        router.push({ pathname: '/code', params: { email: mail } });
        return;
      }

      // --- lozinka ---
      // Jedan ekran pokriva i registraciju i prijavu: prvo probamo da napravimo
      // nalog, a ako vec postoji, odmah probamo prijavu istom lozinkom.
      let { data, error } = await supabase.auth.signUp({ email: mail, password });

      if (error && /already registered/i.test(error.message)) {
        ({ data, error } = await supabase.auth.signInWithPassword({ email: mail, password }));
        if (error) {
          setError('Nalog sa ovim emailom postoji, ali lozinka nije tačna.');
          return;
        }
      } else if (error) {
        setError(/password/i.test(error.message)
          ? 'Lozinka mora imati bar 6 znakova.'
          : 'Nismo uspeli da napravimo nalog. Proveri podatke i internet.');
        return;
      }

      if (!data.session) {
        // Potvrda emaila je i dalje ukljucena u Supabase-u.
        setError('Potvrda emaila je uključena u Supabase-u. Isključi je u Authentication → Sign In / Providers → Email.');
        return;
      }

      const outcome = await completeSignup(data.session.user.id, mail);
      router.replace(routeAfterSignup(outcome));
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      question={AUTH_MODE === 'otp' ? 'Koji ti je email?' : 'Napravi nalog'}
      note={AUTH_MODE === 'otp'
        ? 'Šaljemo ti kod za prijavu. Bez lozinke, bez reklama, i email ne delimo ni sa kim.'
        : 'Nalog čuva tvoju kartu kad promeniš telefon. Email ne delimo ni sa kim.'}
      primary={{
        label: busy ? 'Trenutak…' : AUTH_MODE === 'otp' ? 'Pošalji mi kod' : 'Nastavi',
        onPress: submit,
        disabled: !valid || busy,
      }}>

      <View className="items-center">
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          placeholder="email@primer.com"
          placeholderTextColor="#9A9A9A"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          autoFocus
          className="w-full border-b border-border pb-3 text-center text-2xl text-foreground"
        />

        {AUTH_MODE === 'password' && (
          <TextInput
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null); }}
            placeholder="lozinka (bar 6 znakova)"
            placeholderTextColor="#9A9A9A"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            className="mt-6 w-full border-b border-border pb-3 text-center text-2xl text-foreground"
          />
        )}

        {error && <Text className="mt-5 text-center text-sm text-destructive">{error}</Text>}

        <Text variant="muted" className="mt-12">Ili nastavi preko</Text>
        <View className="mt-4 flex-row gap-3">
          <SocialButton label="Apple" onPress={() => setSocialNote(true)} />
          <SocialButton label="Google" onPress={() => setSocialNote(true)} />
        </View>

        {socialNote && (
          <Text variant="muted" className="mt-4 px-6 text-center text-xs">
            Prijava preko Apple i Google naloga uključuje se kad napravimo dev build.
          </Text>
        )}
      </View>
    </OnboardingStep>
  );
}

function SocialButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Nastavi preko ${label} naloga`}
      className="h-14 w-28 items-center justify-center rounded-lg border border-border active:opacity-60">
      <Text variant="label" className="text-foreground">{label}</Text>
    </Pressable>
  );
}
