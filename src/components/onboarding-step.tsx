import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, X, type LucideIcon } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { GlassBubble, GlassIconButton } from '@/components/ui/glass-button';
import { Text } from '@/components/ui/text';
import { ScreenBackdrop } from '@/components/screen';
import { neutral } from '@/theme/tokens';

/**
 * Zajednicki okvir svih koraka onboardinga.
 *
 * Svi koraci imaju isti raspored: izlaz gore levo (stakleni krug, kao dugme
 * profila), zaglavlje, sadrzaj, glavno dugme, po potrebi sporedna radnja
 * ispod. Drzi se na jednom mestu da se ekrani ne raziđu.
 *
 * ZAGLAVLJE (Ivan, 29.9.2026, po referentnoj prijavi emailom): ikonica u krugu,
 * naslov, siv podnaslov — sve centrirano, na vrhu. Koraci sa poljem za unos
 * imaju sadrzaj odmah ispod; tockici stoje na sredini preostalog prostora.
 * Objasnjenje ide u podnaslov, pa iznad dugmeta obicno ne stoji nista — sa
 * otvorenom tastaturom tu i nema mesta.
 * Stari oblik (sivo pitanje, `question`) ostaje za korake bez naslova.
 */

type Action = { label: string; onPress: () => void; disabled?: boolean };

type Props = {
  /** Prvi korak nudi izlaz (X), ostali strelicu nazad. */
  exit?: { kind: 'cancel' | 'back'; onPress: () => void };
  /** Staklena kapsula gore desno ("Preskoči") — za korak koji nije obavezan. */
  skip?: Action;
  /** Ikonica u krugu iznad naslova (lucide). */
  icon?: LucideIcon;
  /** Naslov koraka. Kad postoji, `question` se ne crta. */
  title?: string;
  /** Siv tekst ispod naslova; moze da sadrzi i podebljan deo (email u koraku sa kodom). */
  subtitle?: React.ReactNode;
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
  exit, skip, icon, title, subtitle, question, children, note = PRIVACY_NOTE, primary, secondary, center = true,
}: Props) {
  return (
    <View className="flex-1 bg-grouped">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View className="h-14 flex-row items-center px-5">
            {exit && (
              <GlassIconButton
                onPress={exit.onPress}
                accessibilityLabel={exit.kind === 'cancel' ? 'Odustani' : 'Nazad'}>
                {exit.kind === 'cancel'
                  ? <X size={20} color={neutral.ink} />
                  : <ChevronLeft size={22} color={neutral.ink} />}
              </GlassIconButton>
            )}
            {skip && (
              <GlassBubble style={{ marginLeft: 'auto' }} interaktivno={!skip.disabled}>
                <Pressable
                  onPress={skip.onPress}
                  disabled={skip.disabled}
                  accessibilityRole="button"
                  className="h-full justify-center px-4 active:opacity-60">
                  <Text variant="row">{skip.label}</Text>
                </Pressable>
              </GlassBubble>
            )}
          </View>

          {question && !title && (
            <View className="px-8 pb-2 pt-4">
              <Text variant="question">{question}</Text>
            </View>
          )}

          {title ? (
            <ScrollView
              className="flex-1"
              contentContainerClassName="flex-grow px-5 pb-4"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Zaglavlje icon={icon} title={title} subtitle={subtitle} />
              <View className={center ? 'flex-1 justify-center' : 'pt-7'}>{children}</View>
            </ScrollView>
          ) : (
            <ScrollView
              className="flex-1"
              contentContainerClassName={center ? 'flex-grow justify-center px-5' : 'px-5 pt-6'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          )}

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
      {/* Samo preliv: sadrzaj ovde ne klizi ispod trake (dugme je prikovano za
          dno), pa zamucenje nema sta da zamuti. Bez ovoga bi se pri prelasku sa
          pocetnog ekrana boja na vrhu iskljucila i korak bi izgledao kao druga
          aplikacija. */}
      <ScreenBackdrop />
    </View>
  );
}

/**
 * Ikonica u krugu, naslov, podnaslov. Krug je BEO jer stoji na sivoj pozadini
 * (na referentnoj beloj strani je siv — isto obrtanje kao kod polja, `ui/input`).
 */
function Zaglavlje({ icon: Ikona, title, subtitle }: Pick<Props, 'icon' | 'title' | 'subtitle'>) {
  return (
    <View className="items-center px-3 pt-2">
      {Ikona && (
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-pill bg-card">
          <Ikona size={30} strokeWidth={1.5} color={neutral.inkMuted} />
        </View>
      )}
      <Text variant="naslovLista" className="text-center">{title}</Text>
      {subtitle ? <Text variant="body" className="mt-2 text-center">{subtitle}</Text> : null}
    </View>
  );
}
