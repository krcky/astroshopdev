import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { ChevronLeft, X, type LucideIcon } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { GlassBubble, GlassIconButton } from '@/components/ui/glass-button';
import { Text } from '@/components/ui/text';
import { ScreenBackdrop, VRH_ANDROID } from '@/components/screen';
import { STARI_IOS } from '@/lib/platform';
import { FONT } from '@/theme/font';
import { neutral } from '@/theme/tokens';

/**
 * Zajednicki okvir svih koraka onboardinga.
 *
 * Svi koraci imaju isti raspored: izlaz gore levo, "Preskoči" gore desno kad
 * korak nije obavezan, zaglavlje, sadrzaj, glavno dugme, po potrebi sporedna
 * radnja ispod. Drzi se na jednom mestu da se ekrani ne raziđu.
 *
 * DUGMAD GORE su na iOS-u 26 NATIVE STAVKE TRAKE (`unstable_headerLeftItems` /
 * `unstable_headerRightItems`), isto kao kalendar i profil na pocetnoj — pravo
 * sistemsko staklo (Ivan, 29.9.2026: `GlassView` "lici na Apple glass, nije
 * to"). Traku pali `(onboarding)/_layout.tsx`. Android i stariji iOS: nasa
 * dugmad u redu ispod (`GlassIconButton`, `GlassBubble`).
 *
 * ZAGLAVLJE (Ivan, 29.9.2026, po referentnoj prijavi emailom): ikonica u krugu,
 * naslov, siv podnaslov — sve centrirano, na vrhu. Koraci sa poljem za unos
 * imaju sadrzaj odmah ispod; tockici stoje na sredini preostalog prostora.
 * Objasnjenje ide u podnaslov, pa iznad dugmeta obicno ne stoji nista — sa
 * otvorenom tastaturom tu i nema mesta.
 * Stari oblik (sivo pitanje, `question`) ostaje za korake bez naslova.
 */

/** `ucitava`: spiner u dugmetu dok se ceka (vidi `ui/button.tsx`) — natpis se ne menja. */
type Action = { label: string; onPress: () => void; disabled?: boolean; ucitava?: boolean };

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
  /**
   * Dno sadrzaja se pretapa u pozadinu — za listu koja ide ispod ivice (gradovi,
   * Ivan 29.9.2026): delimicno vidljiv red se tada cita kao "ima jos", ne kao odsecen.
   */
  pretapanje?: boolean;
};

/** Visina pretapanja na dnu sadrzaja (`pretapanje`). */
const PRETAPANJE = 32;

/**
 * Sadrzaj se skuplja iznad tastature, pa glavno dugme ostaje vidljivo. iOS:
 * `KeyboardAvoidingView`. ANDROID (Ivan, 30.9.2026, Xiaomi 11T): aplikacija je
 * edge-to-edge, pa sistemski `adjustResize` vise ne smanjuje prozor — dugme je ostajalo
 * ISPOD tastature. Zato razmak na dnu prati visinu tastature (`useAnimatedKeyboard`, kao
 * `pitanje-novo.tsx`), umanjen za donji umetak koji `SafeAreaView` vec daje. Klase na
 * Reanimated-ovom `Animated.View` ne stizu (NativeWind) — zato samo `style`.
 */
function IznadTastature({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const tastatura = useAnimatedKeyboard();
  const razmak = useAnimatedStyle(() => ({
    paddingBottom: Math.max(tastatura.height.value - insets.bottom, 0),
  }));
  if (Platform.OS === 'ios') {
    return <KeyboardAvoidingView className="flex-1" behavior="padding">{children}</KeyboardAvoidingView>;
  }
  return <Animated.View style={[{ flex: 1 }, razmak]}>{children}</Animated.View>;
}

/** Native traka postoji samo na iOS-u 26 (vidi `(onboarding)/_layout.tsx`). */
const NATIVE_TRAKA = Platform.OS === 'ios' && !STARI_IOS;

export const PRIVACY_NOTE =
  'Koristimo ovo da izračunamo tvoju natalnu kartu. Ne delimo i ne prodajemo tvoje podatke.';

export function OnboardingStep({
  exit, skip, icon, title, subtitle, question, children, note = PRIVACY_NOTE, primary, secondary, center = true,
  pretapanje = false,
}: Props) {
  return (
    <View className="flex-1 bg-grouped">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <IznadTastature>

          {NATIVE_TRAKA && (
            <Stack.Screen
              options={{
                unstable_headerLeftItems: () => exit ? [{
                  type: 'button',
                  label: exit.kind === 'cancel' ? 'Odustani' : 'Nazad',
                  icon: { type: 'sfSymbol', name: exit.kind === 'cancel' ? 'xmark' : 'chevron.left' },
                  accessibilityLabel: exit.kind === 'cancel' ? 'Odustani' : 'Nazad',
                  onPress: exit.onPress,
                }] : [],
                unstable_headerRightItems: () => skip ? [{
                  type: 'button',
                  label: skip.label,
                  labelStyle: { fontFamily: FONT.medium, fontSize: 17, color: neutral.ink },
                  disabled: skip.disabled,
                  onPress: skip.onPress,
                }] : [],
              }}
            />
          )}

          {/* Na iOS-u 26 ovaj red je samo razmak ispod native trake. Android: malo nize
              od statusne trake, kao traka ostalih ekrana (`VRH_ANDROID`). */}
          <View className="h-14 flex-row items-center px-5" style={{ marginTop: VRH_ANDROID }}>
            {!NATIVE_TRAKA && exit && (
              <GlassIconButton
                onPress={exit.onPress}
                accessibilityLabel={exit.kind === 'cancel' ? 'Odustani' : 'Nazad'}>
                {exit.kind === 'cancel'
                  ? <X size={20} color={neutral.ink} />
                  : <ChevronLeft size={22} color={neutral.ink} />}
              </GlassIconButton>
            )}
            {!NATIVE_TRAKA && skip && (
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
            <View className="flex-1">
              <ScrollView
                className="flex-1"
                contentContainerClassName="flex-grow px-5 pb-4"
                contentContainerStyle={pretapanje ? { paddingBottom: PRETAPANJE } : undefined}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Zaglavlje icon={icon} title={title} subtitle={subtitle} />
                <View className={center ? 'flex-1 justify-center' : 'pt-7'}>{children}</View>
              </ScrollView>
              {pretapanje && (
                <LinearGradient
                  pointerEvents="none"
                  colors={[`${neutral.grouped}00`, neutral.grouped]}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: PRETAPANJE }}
                />
              )}
            </View>
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
            <Button size="lg" disabled={primary.disabled} ucitava={primary.ucitava} onPress={primary.onPress}>
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
        </IznadTastature>
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
