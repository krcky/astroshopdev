import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';

/**
 * Kapija. Jedino mesto koje odlucuje gde korisnik ide pri pokretanju.
 *
 *   nema sesije            -> welcome (nista se ne vidi bez naloga)
 *   sesija ali nema karte  -> unos podataka o rodjenju
 *   sve postoji            -> aplikacija
 */
export default function Gate() {
  const authLoading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const hydrated = useProfileStore((s) => s.hydrated);
  const profile = useProfileStore((s) => s.profile);

  // Prazan ekran dok se ne zna stanje — inace bi kratko bljesnuo pogresan ekran.
  if (authLoading || !hydrated) return <View className="flex-1 bg-background" />;

  if (!user) return <Redirect href="/welcome" />;
  if (!profile) return <Redirect href="/date" />;
  return <Redirect href="/home" />;
}
