import * as React from 'react';
import { Image, Platform, View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { BellRing } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OnboardingStep } from '@/components/onboarding-step';
import { usePremium } from '@/store/auth';
import { AstrologSlika } from '@/components/astrolog-slika';
import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { ASTROLOG } from '@/lib/pitanja';
import { shadow } from '@/theme/tokens';

const IKONICA = require('../../../assets/images/ikonica-obavestenja.png');

/**
 * Ukljucivanje obavestenja (Ivan, 29.9.2026, po referentnom "Get Notified"):
 * "Preskoči" gore desno, zvonce, naslov, pa obris telefona sa tri primera
 * obavestenja preko njega — korisnik vidi STA ce dobijati pre nego sto
 * sistem pita.
 *
 * Primeri pokazuju samo ono sto zaista planiramo da saljemo: jutarnji
 * horoskop i odgovor astrologa (CLAUDE.md, pravilo 21 — push jos ne postoji).
 */
export default function Push() {
  const t = useT();
  const [busy, setBusy] = React.useState(false);

  // Obavestenja dolaze POSLE prve price dana (`prva-prica.tsx`, Ivan 30.9.2026): korisnik
  // je upravo video sta ce mu jutarnje obavestenje donositi. Posle njih Premium kao
  // poslednji korak (`ponuda.tsx`) — osim za onoga ko ga vec ima (poklon); on ide na kapiju.
  const premium = usePremium();
  const done = () => router.replace(premium ? '/' : '/ponuda');

  const ask = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Sistemski upit se moze prikazati SAMO JEDNOM. Zato ga tražimo ovde,
      // posle objasnjenja zasto — a ne pri prvom pokretanju, gde bi vecina
      // odbila iz refleksa i vise se ne bi mogla pitati.
      const current = await Notifications.getPermissionsAsync();
      if (current.status === 'undetermined') {
        await Notifications.requestPermissionsAsync();
      }
    } catch {
      // Na vebu i u nekim okruzenjima ovo ne postoji — nije razlog da tok stane.
    }
    setBusy(false);
    done();
  };

  return (
    <OnboardingStep
      skip={{ label: t.opste.preskoci, onPress: done, disabled: busy }}
      icon={BellRing}
      // Naslov (Ivan, 30.9.2026; ranije "Da ti javimo?").
      title={t.onboarding.push.naslov}
      subtitle={Platform.OS === 'web'
        ? t.onboarding.push.podnaslovWeb
        : t.onboarding.push.podnaslov}
      center={false}
      note={null}
      primary={{ label: t.onboarding.push.ukljuci, onPress: ask, ucitava: busy }}>

      <PrimeriObavestenja />
    </OnboardingStep>
  );
}

/* ------------------------------------------------------------------ */
/* ILUSTRACIJA                                                         */
/* ------------------------------------------------------------------ */

/** Obris telefona iza kartica: sirina, visina (do polovine trece kartice), debljina ivice. */
const TELEFON = { sirina: 250, visina: 280, ivica: 10 };
/** Koliko obrisa telefona viri iznad prve kartice. */
const IZNAD_KARTICA = 92;

/*
 * Obris je BEO, a ne svetlosiv kao na referenci: stoji na sivoj pozadini, gde
 * bi se siva ivica izgubila (isto obrtanje kao polje i krug ikonice).
 * Ukras je — citac ekrana cita samo kartice.
 */
function PrimeriObavestenja() {
  const recnik = useT();
  const t = recnik.onboarding.push;
  // Primer tranzita iz recnika (imena planeta i aspekta), istim oblikom kao "Tvoj dan".
  const { tela, aspekti } = recnik.nebo;
  const primerTranzit = recnik.danas.tranzit.imeNatalni(tela.venus, aspekti.trine, tela.sun);
  return (
    <View className="mt-6">
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="absolute top-0 items-center self-center border-card"
        style={{
          width: TELEFON.sirina,
          height: TELEFON.visina,
          borderWidth: TELEFON.ivica,
          borderBottomWidth: 0,
          borderTopLeftRadius: 48,
          borderTopRightRadius: 48,
        }}>
        {/* Ostrvo na vrhu ekrana. */}
        <View className="mt-3 h-7 w-24 rounded-pill bg-card" />
      </View>

      <View className="gap-3" style={{ marginTop: IZNAD_KARTICA }}>
        <Obavestenje
          redosled={0}
          slika={<IkonicaAplikacije />}
          naslov={t.primerDanNaslov}
          tekst={t.primerDanTekst}
          vreme={t.sada}
        />
        <Obavestenje
          redosled={1}
          slika={<AstrologSlika velicina={SLIKA} />}
          naslov={ASTROLOG.ime}
          tekst={t.primerOdgovorTekst}
          vreme={t.preSat}
        />
        <Obavestenje
          redosled={2}
          slika={<IkonicaAplikacije />}
          naslov={t.primerDanNaslov}
          tekst={primerTranzit}
          vreme={t.juce}
        />
      </View>
    </View>
  );
}

/** Jedno obavestenje kao na zakljucanom ekranu. Kartice ulaze jedna za drugom, jednom. */
function Obavestenje({ redosled, slika, naslov, tekst, vreme }: {
  redosled: number;
  slika: React.ReactNode;
  naslov: string;
  tekst: string;
  vreme: string;
}) {
  return (
    // Ulazak nosi Reanimated omotac, izgled obican `View` — NativeWind klase na
    // `Animated.View` iz Reanimated-a nisu nigde provereno da stizu.
    <Animated.View entering={FadeInDown.delay(200 + redosled * 120).duration(450)}>
      <View style={shadow.soft} className="flex-row items-center gap-3 rounded-xl bg-card px-4 py-3.5">
        {slika}
        <View className="flex-1">
          <View className="flex-row items-baseline gap-2">
            <Text variant="row" numberOfLines={1} className="flex-1">{naslov}</Text>
            <Text variant="caption" className="text-subtle">{vreme}</Text>
          </View>
          <Text variant="body" numberOfLines={1}>{tekst}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/** Ista mera kao slika astrologa u drugoj kartici — `h-10` bi bio 35pt (NativeWind rem = 14). */
const SLIKA = 40;

function IkonicaAplikacije() {
  return (
    <Image
      source={IKONICA}
      accessibilityIgnoresInvertColors
      style={{ width: SLIKA, height: SLIKA }}
      className="rounded-tile border border-border"
    />
  );
}
