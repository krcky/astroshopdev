import * as React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from 'expo-router';
import { useReducedMotion } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { probudi, useBudnost, useUstedaBaterije } from '@/store/budnost';
import { brand } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

/*
 * Logo u traci na vrhu ekrana: animirani krug + natpis "Astro Shop".
 *
 * Krug je VEKTORSKI Lottie sklopljen iz brend SVG-a (`logo/krug-vektor.svg`)
 * skriptom `scripts/logo/build-krug.py` — tamo su i razlozi i zamke. Originalni
 * brend Lottie je rasterski i na ovoj velicini se raspadao. Animacija je ista:
 * uvodni okret od dve sekunde, zatim jedan krug u minut; lice miruje, zraci se
 * okrecu, znakovi kruze i ostaju uspravni.
 *
 * Natpis je OBICAN TEKST "Astro Shop", 24/30 polucrn (Ivan, 26.9.2026),
 * sistemsko pismo, ne SVG wordmark iz brend fajla.
 * Krug je 48 (Ivan, 26.9.2026), centar u liniji sa native dugmadima; razmak 12; red ima `items-center`,
 * pa je tekst na sredini kruga.
 *
 * Na vebu `lottie-react-native` trazi dodatni paket, pa `logo.web.tsx` crta
 * staticni krug — vidi tamo.
 *
 * `autoPlay` sam po sebi na iOS-u (nova arhitektura) ume da ne krene — poznata
 * mana biblioteke — pa se `play()` zove i rucno kad se pogled izmeri. Provereno
 * 26.9.2026: sa samim `autoPlay` krug je stajao. Od 30.9.2026 `autoPlay` nema
 * uopste — vrtenje vodi `useKrugKojiMiruje`.
 *
 * KRUG MIRUJE KAD I KORISNIK (Ivan, 30.9.2026, obe platforme): ukrasni pokret koji
 * traje, kao preliv i okret planete (CLAUDE.md, pravilo 17) — vidi `useKrugKojiMiruje`.
 * Uz "Smanji pokrete" i u ustedi baterije stoji (do tada se "Smanji pokrete" ovde
 * namerno nije postovao, dok je logo bio jedina animacija na ekranu).
 */
export const LOGO_SIZE = 48;
const GAP = 12;

/** Kompozicija punog loga (logo-full.json): sirina, visina i x centra kruga. */
const FULL_W = 1511;
const FULL_H = 400;
const FULL_CX = 809;
const FULL_ASPECT = FULL_W / FULL_H;
/**
 * Krug u punom logu nije na sredini kompozicije (ASTRO je sire od SHOP), pa se
 * ceo logo pomera ulevo za toliko da KRUG bude na sredini strane (Ivan, 26.9.2026).
 */
/** Visina punog loga = precnik kruga u njemu. Po meri je isti kao LOGO_SIZE (kompozicija
 *  je visoka tacno koliko krug), ali na oku deluje manji pored sitnih slova, pa je
 *  malo veci (Ivan, 26.9.2026). */
const FULL_SIZE = 58;
const FULL_SHIFT_X = -((FULL_CX - FULL_W / 2) / FULL_H) * FULL_SIZE;

/**
 * Brend indigo kruga — ista boja koja stoji u `logo-krug.json`.
 *
 * Preboja ide UVEK, i kad je krug u svojoj boji. Na iOS-u `lottie-react-native`
 * prazan `colorFilters` ne vraca boju iz fajla nego zadrzi prethodnu, a Fabric
 * reciklira Lottie poglede izmedju ekrana: krug sa crnog taba je tako stigao na
 * "Danas" i "Natalnu kartu" crn (iOS 26, Ivan 27.9.2026).
 */
const KRUG_INDIGO = brand.indigo;

/** Imena slojeva kruga sa oblicima (iz logo-krug.json) — na njih ide preboja. */
const KRUG_SLOJEVI = [
  'Prsten', 'Lice', 'Zraci',
  ...['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'].map((z) => `znak ${z}`),
];
const KRUG_INDIGO_FILTERI = KRUG_SLOJEVI.map((keypath) => ({ keypath, color: KRUG_INDIGO }));

/** Upravljanje krugom uvoda: `zavrti()` pokrene vrtenje. */
export type LogoKrugRef = { zavrti: () => void };

/**
 * SAMO KRUG, bez natpisa i bez `useFocusEffect` — za uvod pri pokretanju
 * (`components/uvod.tsx`), koji stoji IZNAD navigacije, pa fokusa nema. Crta
 * `logo-krug-uvod.json`: isti krug, ali okret ne staje nego se vrti dok se ceka
 * (`scripts/logo/build-krug-uvod.py`). Miruje na kadru 0 (isti kadar kao
 * sistemski splash) dok ga uvod ne pokrene. `onSpreman` javlja da je animacija
 * ucitana i da se krug vidi.
 */
export function LogoKrug({ ref, size, onSpreman }: {
  ref?: React.Ref<LogoKrugRef>;
  size: number;
  onSpreman?: () => void;
}) {
  const lottie = React.useRef<LottieView>(null);
  React.useImperativeHandle(ref, () => ({ zavrti: () => lottie.current?.play() }), []);
  return (
    <LottieView
      ref={lottie}
      source={require('@/assets/lottie/logo-krug-uvod.json')}
      autoPlay={false}
      loop={false}
      resizeMode="contain"
      onAnimationLoaded={onSpreman}
      colorFilters={KRUG_INDIGO_FILTERI}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * Vrtenje kruga loga kao UKRASNI POKRET KOJI TRAJE (CLAUDE.md, pravilo 17; Ivan,
 * 30.9.2026): samo na ekranu u fokusu, 20 s posle poslednjeg dodira stane
 * (`useBudnost`), a prvi dodir ga pusti dalje odakle je stao. Uz "Smanji pokrete" i u
 * ustedi baterije stoji na kadru 0. Do tada se vrteo bez kraja (`loop`), pa je
 * telefon crtao svaki kadar i kad niko ne dira ekran (Xiaomi 11T: 614 kadrova za 5 s
 * mirovanja, na 120 Hz). Vraca `pusti` za `onLayout` (iOS, vidi gore) — pusta samo
 * kad krug sme da se vrti, inace bi krenuo i krug skrivenog taba.
 */
function useKrugKojiMiruje(krug: React.RefObject<LottieView | null>) {
  const budan = useBudnost((s) => s.budan);
  const usteda = useUstedaBaterije();
  const bezPokreta = useReducedMotion();
  const miruje = usteda || bezPokreta;
  const sme = React.useRef(false);

  // Svaki put kad ekran dodje u fokus (promena taba, povratak sa drugog ekrana)
  // krug krece ISPOCETKA, sa uvodnim okretom (Ivan, 26.9.2026). Tabovi ostaju
  // montirani, pa bez ovoga animacija samo nastavlja gde je bila.
  useFocusEffect(
    React.useCallback(() => {
      probudi();
      krug.current?.reset();
      sme.current = !miruje;
      if (!miruje) krug.current?.play();
      return () => { sme.current = false; krug.current?.pause(); };
    }, [krug, miruje])
  );
  // Mirovanje: stane gde je bio, na prvi dodir nastavi.
  useFocusEffect(
    React.useCallback(() => {
      if (miruje) return;
      sme.current = budan;
      if (budan) krug.current?.resume();
      else krug.current?.pause();
    }, [krug, miruje, budan])
  );

  return React.useCallback(() => { if (sme.current) krug.current?.play(); }, [krug]);
}

/**
 * SAMO KRUG LOGA, onaj iz zaglavlja: pri svakom fokusu ekrana uvodni okret, pa
 * jedan krug u minut dok korisnik nesto radi (`useKrugKojiMiruje`). Koriste ga
 * zaglavlje (`Logo`) i dobrodoslica, iznad naslova (Ivan, 29.9.2026). Ukras je —
 * ime cita natpis pored ili ispod njega.
 */
export function KrugLoga({ size = LOGO_SIZE, color }: { size?: number; color?: string }) {
  const krug = React.useRef<LottieView>(null);
  const pusti = useKrugKojiMiruje(krug);

  return (
    // Omotac nosi skrivanje od citaca ekrana — LottieView ta svojstva ne prima.
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LottieView
        ref={krug}
        source={require('@/assets/lottie/logo-krug.json')}
        loop
        resizeMode="contain"
        onLayout={pusti}
        colorFilters={KRUG_SLOJEVI.map((keypath) => ({ keypath, color: color ?? KRUG_INDIGO }))}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

/**
 * `title` — ime strane umesto "Astro Shop"; isti krug, drugi natpis.
 * `full` — PUN logo (ASTRO, krug, SHOP) iz `logo-full.json`, centriran u traci.
 * `color` — preboja kruga (npr. `ink` na ekranima ciji preliv nije ljubicast,
 * Ivan 26.9.2026); bez nje krug je brend indigo (`KRUG_INDIGO`). Ide kroz Lottie
 * `colorFilters` po imenu sloja, pa JSON ostaje jedan.
 */
export function Logo({ title: naslov, full = false, color }: { title?: string; full?: boolean; color?: string }) {
  const t = useT();
  const title = naslov ?? t.opste.imeAplikacije;
  // Pun logo ima svoj Lottie; krug sam (`KrugLoga`) vodi svoje okretanje. Kuka je
  // ovde bezuslovna (pravilo kuka), a bez punog loga ref je prazan pa ne radi nista.
  const krug = React.useRef<LottieView>(null);
  const pusti = useKrugKojiMiruje(krug);

  if (full) {
    return (
      <View
        className="flex-1 items-center"
        // Pun logo ide 4pt NIZE od sredine trake (Ivan, 26.9.2026), i ulevo
        // koliko treba da krug bude na sredini strane.
        style={{ transform: [{ translateX: FULL_SHIFT_X }, { translateY: 4 }] }}
        accessibilityRole="header"
        accessibilityLabel={t.opste.imeAplikacije}>
        <LottieView
          ref={krug}
          source={require('@/assets/lottie/logo-full.json')}
          loop
          resizeMode="contain"
          onLayout={pusti}
          style={{ width: FULL_SIZE * FULL_ASPECT, height: FULL_SIZE }}
        />
      </View>
    );
  }

  return (
    <View
      className="flex-row items-center"
      // Traka je 53pt (centar 26,5); logo ide 5pt vise da mu centar bude na 22pt
      // ispod statusne trake, u liniji sa native dugmadima iOS trake (44pt).
      style={{ gap: GAP, transform: [{ translateY: -5 }] }}
      accessibilityRole="header"
      accessibilityLabel={title}>
      <KrugLoga color={color} />
      <Text className={cn('text-[24px] leading-[30px] tracking-[-0.3px]', tezina('naslovStrane'))} numberOfLines={1}>{title}</Text>
    </View>
  );
}
