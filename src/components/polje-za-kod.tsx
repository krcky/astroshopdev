import * as React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { useT } from '@/i18n';

/**
 * Koliko cifara ima kod sa mejla. SPREGNUTO sa Supabase-om (pravilo 15): `Email
 * OTP length` mora biti isti broj — prijava (`code.tsx`) i promena emaila (`email.tsx`).
 */
export const DUZINA_KODA = 6;
const LENGTH = DUZINA_KODA;

/* ------------------------------------------------------------------ */
/* POLJE ZA KOD                                                        */
/* ------------------------------------------------------------------ */

/*
 * Bela kapsula sa sest crtica (Ivan, 29.9.2026, po referentnoj prijavi): svaka
 * crtica je mesto za jednu cifru, a trepcuci kursor stoji tamo gde ide sledeca.
 *
 * Kucanje hvata PRAVO polje razvuceno preko cele kapsule, samo nevidljivo —
 * zato rade i dodir, nalepljivanje dugim pritiskom i predlog koda iznad
 * tastature (`oneTimeCode`: iOS ga cita iz Poste i Poruka). Kursor polja je
 * prikovan za kraj (`selection`): dodir u sredinu bi inace umetao cifre izmedju
 * vec unetih, a na ekranu bi stajale redom.
 */
export function PoljeZaKod({ value, onChange }: { value: string; onChange: (kod: string) => void }) {
  const t = useT();
  const [fokus, setFokus] = React.useState(false);

  return (
    // Aktivno stanje kao `ui/input.tsx`: obod u boji teksta dok se kuca (Ivan, 29.9.2026).
    <View
      className={cn(
        'h-16 flex-row items-center justify-center gap-2.5 rounded-pill border bg-card px-7',
        fokus ? 'border-ring' : 'border-transparent'
      )}>
      {Array.from({ length: LENGTH }, (_, i) => {
        const cifra = value[i];
        // Kursor stoji ISPRED mesta koje je na redu; kad su sva puna — iza poslednjeg.
        const kursor = fokus && (i === value.length || (value.length === LENGTH && i === LENGTH - 1));
        return (
          <View key={i} className="h-10 w-6 items-center justify-center">
            {cifra
              ? <Text variant="naslovLista">{cifra}</Text>
              : <View className="h-0.5 w-4 rounded-pill bg-subtle opacity-60" />}
            {kursor && (
              <View
                pointerEvents="none"
                style={[styles.kursorMesto, value.length === LENGTH ? { right: -2 } : { left: -2 }]}>
                <Kursor />
              </View>
            )}
          </View>
        );
      })}

      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, LENGTH))}
        onFocus={() => setFokus(true)}
        onBlur={() => setFokus(false)}
        selection={{ start: value.length, end: value.length }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoFocus
        maxLength={LENGTH}
        caretHidden
        selectionColor="transparent"
        accessibilityLabel={t.onboarding.poljeZaKod}
        style={styles.skrivenoPolje}
      />
    </View>
  );
}

/** Trepce kao sistemski kursor: pola sekunde vidljiv, pola sekunde ne. */
function Kursor() {
  const vidljivost = useSharedValue(1);
  React.useEffect(() => {
    vidljivost.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withDelay(530, withTiming(0, { duration: 0 })),
        withDelay(530, withTiming(1, { duration: 0 })),
      ),
      -1,
    );
    return () => cancelAnimation(vidljivost);
  }, [vidljivost]);
  const stil = useAnimatedStyle(() => ({ opacity: vidljivost.value }));
  return <Animated.View style={[styles.kursor, stil]} />;
}

const styles = StyleSheet.create({
  kursorMesto: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  kursor: { width: 2, height: 30, borderRadius: 1, backgroundColor: neutral.ink },
  // Pravo polje preko cele kapsule, bez vidljivog teksta i kursora.
  skrivenoPolje: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: 'transparent', fontSize: 1 },
});
