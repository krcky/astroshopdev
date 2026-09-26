import { Platform } from 'react-native';
import { Stack } from 'expo-router';

/**
 * Pocetna je u SVOM native Stack-u samo zbog zaglavlja: na iOS-u native traka
 * (UINavigationBar) daje pravi UIMenu sa zamucenjem na dodir i Liquid Glass
 * dugmad (`unstable_headerRightItems` u index.tsx). Traka je providna i bez
 * naslova, a nas `Screen` ispod nje i dalje crta preliv, zamucenje i logo.
 * Ostali tabovi ostaju bez native zaglavlja (Ivan, 26.9.2026).
 */
export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        // Native zaglavlje sluzi samo iOS stavkama (meni, profil); Android ih nema
        // (dobija nas meni u `Screen`), pa mu prazna traka ne treba.
        headerShown: Platform.OS === 'ios',
        // PROVIDNA: neprovidna traka gura ceo nas ekran (preliv, logo) ispod sebe.
        // Cena: sistemski "scroll edge" efekat se onda veze samo za statusnu traku,
        // pa zamucenje ispod nase trake crta `Screen` sam (provereno 26.9.2026).
        headerTransparent: true,
        headerTitle: '',
        headerShadowVisible: false,
        headerBackVisible: false,
      }}
    />
  );
}
