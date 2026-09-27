import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { STARI_IOS } from '@/lib/platform';
import { neutral } from '@/theme/tokens';

/*
 * NATIVE traka tabova (UITabBarController na iOS-u, Liquid Glass na iOS-u 26;
 * Material na Androidu) umesto rucno crtane lebdece trake (Ivan, 26.9.2026).
 * Sistem sam crta staklo, animacije i skrivanje na skrol.
 *
 * Tabovi (Ivan, 26.9.2026): Danas · Tranziti · Pitaj · Ti · Nebo. "Ti" je
 * natalna karta — ono sto se ne menja; "Nebo" je stanje neba sada; "Pitaj" je
 * pitanje astrologu. Profil NIJE tab — otvara se dugmetom gore desno
 * (`app/profile.tsx`, u korenskom Stack-u). Ekrani u kodu zadrzavaju stara
 * imena fajlova (daily, chart, sky). Ikone: SF Symbols na iOS-u (obicna
 * kad tab nije izabran, ispunjena kad jeste), Material ikone (`md`) na Androidu —
 * bez `md` Android ostaje BEZ ikona.
 *
 * Razmak na dnu ekrana ispod trake pravi `TabBarSpacer` u `Screen` — nas
 * skrol ne dozvoljava sistemu da mu sam podesi umetke (vidi tamo).
 */
/**
 * iOS 18 i stariji: klasicna traka je na "ivici skrola" potpuno PROVIDNA (UIKit
 * `scrollEdgeAppearance`), a nas skrol ima `contentInsetAdjustmentBehavior="never"`,
 * pa UIKit misli da je sadrzaj uvek na dnu — traka ostane providna i tekst ide
 * kroz ikone (iOS 18.6 simulator, Ivan 27.9.2026). Ovim traka uvek nosi belu
 * podlogu. Na iOS-u 26 je traka staklo i ovo ne treba.
 */

/** Boja izabranog taba. PROBA (Ivan, 27.9.2026): svetla lila umesto indiga iz loga (`brand.indigo`). */
const IZABRANI = '#B39DDB';

/*
 * `disableAutomaticContentInsets` na SVAKOM tabu: bez njega react-native-screens
 * prvom skrolu ekrana prepise `contentInsetAdjustmentBehavior` sa "never" na
 * "automatic", pa iOS doda umetak za statusnu traku (i zaglavlje) PREKO naseg
 * `insets.top + headerBar.height` — prva kartica odskoci ~115pt od loga.
 * Pojavilo se kad je skrol postao dovoljno plitak da ga sistem nadje (vidi
 * `belina` u `Screen`); provereno u iOS 26.5 simulatoru, Ivan 27.9.2026.
 */
export default function TabsLayout() {
  return (
    <NativeTabs
      // Boje za OBA stanja eksplicitno, bez `tintColor`: neaktivni u tercijarnoj sivoj
      // (#9C9C9D, `inkSubtle`), izabrani u `IZABRANI` (Ivan, 27.9.2026;
      // do tada `ink`). `tintColor` bi na nivou UITabBar-a mogao da preboji i
      // neaktivne, pa ga nema.
      iconColor={{ default: neutral.inkSubtle, selected: IZABRANI }}
      labelStyle={{ default: { color: neutral.inkSubtle }, selected: { color: IZABRANI } }}
      // iOS 26: traka se NE skuplja pri skrolu (Ivan, 27.9.2026). Sistem ume samo
      // da je sazme u jedno dugme, a trazeno je blago smanjenje kao na Instagramu —
      // to sistemska traka nema. Skupljanje radi (vidi `belina` u `Screen`) ako se vrati.
      minimizeBehavior="never"
      // Bela podloga: Android (Material 3) i iOS 18 i stariji (vidi `STARI_IOS`).
      // Siva kapsula iza izabrane ikone i siv talas na dodir su samo Android.
      backgroundColor={neutral.white}
      disableTransparentOnScrollEdge={STARI_IOS}
      indicatorColor={neutral.fillStrong}
      rippleColor={neutral.fill}
      // Android: natpis ispod SVAKE ikone, ne samo izabrane (Ivan, 27.9.2026).
      // Material podrazumevano ("auto") sa 4+ tabova prikaze samo izabrani.
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="home" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Danas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="daily" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
        <NativeTabs.Trigger.Label>Tranziti</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ask" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'ellipsis.message', selected: 'ellipsis.message.fill' }} md="sms" />
        <NativeTabs.Trigger.Label>Pitaj</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chart" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'circle.circle', selected: 'circle.circle.fill' }} md="adjust" />
        <NativeTabs.Trigger.Label>Ti</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sky" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'moon.stars', selected: 'moon.stars.fill' }} md="nights_stay" />
        <NativeTabs.Trigger.Label>Nebo</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
