import { NativeTabs } from 'expo-router/unstable-native-tabs';

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
export default function TabsLayout() {
  return (
    <NativeTabs
      // Boje za OBA stanja eksplicitno, bez `tintColor`: neaktivni u tercijarnoj sivoj
      // (#9C9C9D, `inkSubtle`), izabrani u `ink` (Ivan, 26.9.2026). `tintColor` bi na
      // nivou UITabBar-a mogao da preboji i neaktivne, pa ga nema.
      iconColor={{ default: neutral.inkSubtle, selected: neutral.ink }}
      labelStyle={{ default: { color: neutral.inkSubtle }, selected: { color: neutral.ink } }}
      // iOS 26: traka se sazme pri skrolu nadole.
      minimizeBehavior="onScrollDown"
      // Android (Material 3 traka): bela podloga, siva kapsula iza izabrane ikone i
      // siv talas na dodir — iste boje kao nasa nekadasnja traka. iOS ovo ignorise.
      backgroundColor={neutral.white}
      indicatorColor={neutral.fillStrong}
      rippleColor={neutral.fill}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Danas</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="daily">
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
        <NativeTabs.Trigger.Label>Tranziti</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ask">
        <NativeTabs.Trigger.Icon sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }} md="chat_bubble" />
        <NativeTabs.Trigger.Label>Pitaj</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chart">
        <NativeTabs.Trigger.Icon sf={{ default: 'circle.circle', selected: 'circle.circle.fill' }} md="adjust" />
        <NativeTabs.Trigger.Label>Ti</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sky">
        <NativeTabs.Trigger.Icon sf={{ default: 'moon.stars', selected: 'moon.stars.fill' }} md="nights_stay" />
        <NativeTabs.Trigger.Label>Nebo</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
