import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * Zajednicki okvir svih koraka onboardinga.
 *
 * Svi koraci imaju isti raspored: izlaz gore levo, pitanje u razmaknutim
 * verzalima, sadrzaj, objasnjenje o privatnosti, glavno dugme, po potrebi
 * sporedna radnja ispod. Drzi se na jednom mestu da se ekrani ne raziđu.
 */

type Action = { label: string; onPress: () => void; disabled?: boolean };

type Props = {
  /** Prvi korak nudi izlaz ("Odustani"), ostali strelicu nazad. */
  exit?: { kind: 'cancel' | 'back'; onPress: () => void };
  question?: string;
  children?: React.ReactNode;
  /** Recenica iznad dugmeta. Podrazumevano objasnjenje o privatnosti. */
  note?: string | null;
  primary: Action;
  secondary?: Action;
  /** Sadrzaj centriran po visini (tockici) ili poravnat na vrh (unos, liste). */
  center?: boolean;
};

export const PRIVACY_NOTE =
  'Koristimo ovo da izračunamo tvoju natalnu kartu. Ne delimo i ne prodajemo tvoje podatke.';

export function OnboardingStep({
  exit, question, children, note = PRIVACY_NOTE, primary, secondary, center = true,
}: Props) {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View className="h-12 justify-center px-5">
            {exit && (
              <Pressable
                onPress={exit.onPress}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel={exit.kind === 'cancel' ? 'Odustani' : 'Nazad'}
                className="self-start active:opacity-60">
                {exit.kind === 'cancel'
                  ? <Text variant="label" className="text-foreground">Odustani</Text>
                  : <ChevronLeft size={26} color="#141414" />}
              </Pressable>
            )}
          </View>

          {question && (
            <View className="px-8 pb-2 pt-4">
              <Text variant="question">{question}</Text>
            </View>
          )}

          <ScrollView
            className="flex-1"
            contentContainerClassName={center ? 'flex-grow justify-center px-5' : 'px-5 pt-6'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>

          <View className="px-5 pb-2 pt-4">
            {note && <Text variant="note" className="mb-5 px-2">{note}</Text>}
            <Button size="lg" disabled={primary.disabled} onPress={primary.onPress}>
              <Text>{primary.label}</Text>
            </Button>
            {secondary && (
              <Pressable
                onPress={secondary.onPress}
                disabled={secondary.disabled}
                accessibilityRole="button"
                className="mt-4 items-center py-2 active:opacity-60">
                <Text variant="label" className="text-foreground underline">
                  {secondary.label}
                </Text>
              </Pressable>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
