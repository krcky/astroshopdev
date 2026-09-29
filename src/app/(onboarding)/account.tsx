import * as React from 'react';
import { Keyboard, LayoutAnimation, Platform, TextInput, type KeyboardEvent } from 'react-native';
import { Mail } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { OnboardingStep } from '@/components/onboarding-step';
import { useTurnstile } from '@/components/turnstile';
import { Input } from '@/components/ui/input';
import { PrijavaDugme } from '@/components/prijava-dugme';
import { Text } from '@/components/ui/text';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AUTH_MODE } from '@/lib/auth-mode';
import { completeSignup, routeAfterSignup } from '@/lib/signup';
import { pullProfile } from '@/lib/sync';
import { signOut } from '@/store/auth';

export default function Account() {
  // `nov` = dolazi se iz "Napravi nalog" (posle reveal-a); `zauzet` = email koji vec
  // ima kartu, vraca ga ekran sa kodom (`lib/signup.ts`).
  const { nov, zauzet } = useLocalSearchParams<{ nov?: string; zauzet?: string }>();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [socialNote, setSocialNote] = React.useState(false);
  const captcha = useTurnstile();
  const lozinka = React.useRef<TextInput>(null);
  const tastatura = useTastaturaOtvorena();

  const emailOk = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email.trim());
  const valid = AUTH_MODE === 'otp' ? emailOk : emailOk && password.length >= 6;
  const poruka = error ?? (zauzet && email.trim().toLowerCase() === zauzet
    ? 'Ovaj email već ima nalog. Unesi drugi.'
    : null);

  const submit = async () => {
    if (!valid || busy) return;
    if (!isSupabaseConfigured) { setError('Nalog još nije podešen.'); return; }
    setBusy(true);
    setError(null);
    const mail = email.trim().toLowerCase();

    try {
      // Token je jednokratan i vazi oko pet minuta — trazi se ovde, neposredno
      // pre poziva. Bez podesenog site key-a vraca undefined i nista se ne menja.
      let captchaToken: string | undefined;
      try {
        captchaToken = await captcha.getToken();
      } catch {
        setError('Nismo uspeli da potvrdimo da nisi robot. Proveri internet pa probaj ponovo.');
        return;
      }

      if (AUTH_MODE === 'otp') {
        const { error } = await supabase.auth.signInWithOtp({
          email: mail,
          options: { shouldCreateUser: true, captchaToken },
        });
        if (error) {
          setError(/rate|limit|seconds/i.test(error.message)
            ? 'Previše pokušaja. Sačekaj minut pa probaj ponovo.'
            : 'Nismo uspeli da pošaljemo kod. Proveri email i internet.');
          return;
        }
        router.push({ pathname: '/code', params: nov ? { email: mail, nov } : { email: mail } });
        return;
      }

      // --- lozinka ---
      // Jedan ekran pokriva i registraciju i prijavu: prvo probamo da napravimo
      // nalog, a ako vec postoji, odmah probamo prijavu istom lozinkom.
      let { data, error } = await supabase.auth.signUp({ email: mail, password, options: { captchaToken } });

      if (error && /already registered/i.test(error.message)) {
        // Prvi token je potrosen na signUp — za drugi poziv treba nov.
        const retryToken = await captcha.getToken().catch(() => undefined);
        ({ data, error } = await supabase.auth.signInWithPassword({
          email: mail, password, options: { captchaToken: retryToken },
        }));
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

      if (nov && (await pullProfile(data.session.user.id))) {
        await signOut('local');
        setError('Ovaj email već ima nalog. Unesi drugi.');
        return;
      }
      const outcome = await completeSignup(data.session.user.id, mail);
      router.replace(routeAfterSignup(outcome));
    } catch {
      setError('Nismo uspeli da učitamo nalog. Proveri internet pa probaj ponovo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingStep
      exit={{ kind: 'back', onPress: () => router.back() }}
      icon={tastatura ? undefined : Mail}
      title={AUTH_MODE === 'otp' ? 'Koji ti je email?' : 'Napravi nalog'}
      subtitle={AUTH_MODE === 'otp'
        ? 'Šaljemo ti kod za prijavu. Bez lozinke, bez reklama, i email ne delimo ni sa kim.'
        : 'Nalog čuva tvoju kartu kad promeniš telefon. Email ne delimo ni sa kim.'}
      center={false}
      note={null}
      primary={{
        label: AUTH_MODE === 'otp' ? 'Pošalji mi kod' : 'Nastavi',
        onPress: submit,
        disabled: !valid,
        ucitava: busy,
      }}>

      <Input
        povrsina="siva"
        value={email}
        onChangeText={(t) => { setEmail(t); setError(null); }}
        placeholder="Email adresa"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType={AUTH_MODE === 'otp' ? 'send' : 'next'}
        onSubmitEditing={AUTH_MODE === 'otp' ? submit : () => lozinka.current?.focus()}
        autoFocus
      />

      {AUTH_MODE === 'password' && (
        <Input
          ref={lozinka}
          povrsina="siva"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          placeholder="Lozinka (bar 6 znakova)"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          returnKeyType="go"
          onSubmitEditing={submit}
          className="mt-3"
        />
      )}

      {poruka && <Text className="mt-4 px-2 text-center text-sm text-destructive">{poruka}</Text>}

      {/* Odmah ispod polja, jedno ispod drugog (Ivan, 29.9.2026). Zajedno sa poljem
          moraju da stanu iznad tastature — zato zaglavlje gubi ikonicu dok je ona otvorena. */}
      <PrijavaDugme vrsta="apple" onPress={() => setSocialNote(true)} className="mt-3" />
      <PrijavaDugme vrsta="google" onPress={() => setSocialNote(true)} className="mt-3" />

      {socialNote && (
        <Text variant="muted" className="mt-4 px-6 text-center text-xs">
          Prijava preko Apple i Google naloga uključuje se kad napravimo dev build.
        </Text>
      )}

      {captcha.gate}

    </OnboardingStep>
  );
}

/**
 * Da li je tastatura otvorena. Na iOS-u stize PRE njenog pokreta (`Will`), pa
 * zaglavlje menja oblik zajedno sa njom; Android javlja tek posle (`Did`).
 * Svoj `configureNext` postavlja POSLE KeyboardAvoidingView-a (on se pretplati
 * pri montiranju, pre ekrana), pa vazi za oba — i nestanak ikonice je glatko.
 */
function useTastaturaOtvorena() {
  const [otvorena, setOtvorena] = React.useState(() => Keyboard.isVisible());
  React.useEffect(() => {
    const ios = Platform.OS === 'ios';
    const promena = (vidljiva: boolean) => (e: KeyboardEvent) => {
      if (ios && e.duration) {
        const tip = { type: e.easing || LayoutAnimation.Types.keyboard, property: LayoutAnimation.Properties.opacity };
        LayoutAnimation.configureNext({ duration: e.duration, update: { type: tip.type }, create: tip, delete: tip });
      }
      setOtvorena(vidljiva);
    };
    const pokaz = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', promena(true));
    const skriv = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', promena(false));
    return () => { pokaz.remove(); skriv.remove(); };
  }, []);
  return otvorena;
}
