import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { UmeciTaba } from '@/components/umeci';
import { STARI_IOS } from '@/lib/platform';

/**
 * Native Stack svakog taba — SAMO zbog zaglavlja (`(tabs)/<tab>/_layout.tsx`).
 *
 * Na iOS-u 26 native traka (UINavigationBar) daje pravo sistemsko staklo za
 * dugmad gore (`unstable_headerRightItems`: profil, kalendar na pocetnoj) i
 * pravi UIMenu. `GlassView` samo lici na to (Ivan, 29.9.2026: "nije to" —
 * CLAUDE.md, pravilo 17). Traka je providna i bez naslova, a nas `Screen` ispod
 * nje i dalje crta preliv, zamucenje i natpis.
 *
 * Do 29.9.2026 ovo je imala samo pocetna; sada svi tabovi, da profil gore desno
 * bude isto dugme na svakom.
 *
 * `UmeciTaba`: bez njega svaki tab pri prvom prikazu bljesne — vidi tamo.
 */
export function TabStack() {
  return (
    <UmeciTaba>
      <Stack
        screenOptions={{
          // Native zaglavlje sluzi samo iOS stavkama; Android ih nema (dobija nasa
          // dugmad u `Screen`), pa mu prazna traka ne treba. Isto i iOS pre 26: tamo
          // crtamo svoje stavke, a prazna providna traka bi im jela dodir.
          headerShown: Platform.OS === 'ios' && !STARI_IOS,
          // PROVIDNA: neprovidna traka gura ceo nas ekran (preliv, logo) ispod sebe.
          // Cena: sistemski "scroll edge" efekat se onda veze samo za statusnu traku,
          // pa zamucenje ispod nase trake crta `Screen` sam (provereno 26.9.2026).
          headerTransparent: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerBackVisible: false,
        }}
      />
    </UmeciTaba>
  );
}
