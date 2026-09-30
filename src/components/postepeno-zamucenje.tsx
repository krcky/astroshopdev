import { Platform } from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ViewProps } from 'react-native';

/**
 * Postepeno zamucenje trake — NATIVNI modul `modules/postepeno-zamucenje` (Ivan, 30.9.2026).
 * Postoji SAMO u sopstvenom buildu (Xcode, EAS): Expo Go ga nema, pa je ovde `null` i
 * `Screen` crta dosadasnju traku iz `expo-blur` (sa ostrom donjom ivicom).
 *
 * `intensity` 0—100 kao `expo-blur`; `pocetakPrelaza` je udeo visine do kog je
 * zamucenje puno — ispod bledi do nule.
 */
export type PostepenoZamucenjeProps = ViewProps & { intensity?: number; pocetakPrelaza?: number };

const postoji = Platform.OS === 'ios' && requireOptionalNativeModule('PostepenoZamucenje') != null;

export const PostepenoZamucenje: React.ComponentType<PostepenoZamucenjeProps> | null =
  postoji ? requireNativeView<PostepenoZamucenjeProps>('PostepenoZamucenje') : null;
