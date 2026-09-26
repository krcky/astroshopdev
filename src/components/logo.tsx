import * as React from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';

import { Wordmark } from '@/components/wordmark';

/*
 * Logo u traci na vrhu ekrana: animirani krug + natpis ASTROSHOP.
 *
 * Krug je VEKTORSKI Lottie sklopljen iz brend SVG-a (`logo/krug-vektor.svg`)
 * skriptom `scripts/logo/build-krug.py` — tamo su i razlozi i zamke. Originalni
 * brend Lottie je rasterski i na ovoj velicini se raspadao. Animacija je ista:
 * uvodni okret od dve sekunde, zatim jedan krug u minut; lice miruje, zraci se
 * okrecu, znakovi kruze i ostaju uspravni.
 *
 * Proporcije su iz `Logo/Logo.png`: natpis je 0,27 visine kruga, razmak 0,25.
 * Mere: krug 52 (Ivan 26.9.2026: +30% pa +10% na 36), natpis 11 (+10%), razmak 12.
 * Traka je 53pt, krug staje. Natpis je vertikalno na sredini kruga: red ima
 * `items-center`, a glifovi u `woodmark.svg` popunjavaju ceo viewBox (y 0-12),
 * pa nema skrivene margine koja bi ga pomerila.
 *
 * Na vebu `lottie-react-native` trazi dodatni paket, pa `logo.web.tsx` crta
 * staticni krug — vidi tamo.
 *
 * `autoPlay` sam po sebi na iOS-u (nova arhitektura) ume da ne krene — poznata
 * mana biblioteke — pa se `play()` zove i rucno kad se pogled izmeri. Provereno
 * 26.9.2026: sa samim `autoPlay` krug je stajao.
 *
 * Smanjeno kretanje se ovde NAMERNO ne postuje: okret od jednog kruga u minut
 * je jedva pokret, a logo je jedina animacija na ekranu. Ako se doda jos
 * pokreta, ovo je mesto gde se `useReducedMotion` vraca.
 */
export const LOGO_SIZE = 52;
const WORDMARK_HEIGHT = 11;
const GAP = 12;

export function Logo() {
  const krug = React.useRef<LottieView>(null);
  const pusti = React.useCallback(() => krug.current?.play(), []);
  React.useEffect(() => { pusti(); }, [pusti]);

  return (
    <View
      className="flex-row items-center"
      // Traka centrira natpis po sredini svojih 70pt; logo ide 5pt vise, blize
      // statusnoj traci (Ivan, 26.9.2026): krug od 52 tada ima 4pt do vrha trake.
      style={{ gap: GAP, transform: [{ translateY: -5 }] }}
      accessibilityRole="header"
      accessibilityLabel="Astroshop">
      <LottieView
        ref={krug}
        source={require('@/assets/lottie/logo-krug.json')}
        autoPlay
        loop
        resizeMode="contain"
        onLayout={pusti}
        style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
      />
      <Wordmark height={WORDMARK_HEIGHT} />
    </View>
  );
}
