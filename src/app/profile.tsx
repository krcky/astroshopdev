import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { Screen } from '@/components/screen';
import { deleteAccount, signOut, useAuthStore, useEntitlement } from '@/store/auth';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { DEV_TOOLS_ENABLED, useDevStore } from '@/store/dev';
import { cn } from '@/lib/utils';
import { datumRodjenja, formatDatum } from '@/lib/horoscope';
import { neutral } from '@/theme/tokens';

const pad = (n: number) => String(n).padStart(2, '0');

export default function ProfileTab() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const { user, loading } = useAuthStore();
  const entitlement = useEntitlement();
  const serverEntitlement = useAuthStore((s) => s.entitlement);
  const override = useDevStore((s) => s.entitlementOverride);
  const setOverride = useDevStore((s) => s.setEntitlementOverride);
  const resolved = useResolvedProfile();
  // Sta se ceka: odjava vrti spiner u svom dugmetu, brisanje u svom (Ivan, 29.9.2026).
  const [busy, setBusy] = React.useState<'odjava' | 'brisanje' | null>(null);

  if (loading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved) return <Redirect href="/" />;

  const { profile, city, timeUnknown } = resolved;
  const b = profile.birth;

  const doSignOut = async () => {
    setBusy('odjava');
    await signOut();
    setBusy(null);
    router.replace('/');
  };

  // Dva koraka namerno. Brisanje je nepovratno i brise podatke o rodjenju,
  // koje je korisnik unosio kroz ceo onboarding — jedan pogresan dodir
  // ne sme da ih odnese.
  const doDelete = () => {
    Alert.alert(
      'Obrisati nalog?',
      'Briše se nalog, ime i svi podaci o rođenju. Ovo se ne može poništiti.\n\n' +
        'Pretplata se ovim NE otkazuje — nju otkazuješ u podešavanjima Apple ili Google naloga.',
      [
        { text: 'Odustani', style: 'cancel' },
        {
          text: 'Obriši nalog',
          style: 'destructive',
          onPress: async () => {
            setBusy('brisanje');
            const { error } = await deleteAccount();
            setBusy(null);
            if (error) {
              Alert.alert('Nije uspelo', 'Nalog nije obrisan. Proveri internet pa probaj ponovo.');
              return;
            }
            router.replace('/');
          },
        },
      ],
    );
  };

  return (
    <Screen
      // Profil nije tab (Ivan, 26.9.2026): otvara se dugmetom gore desno. Zaglavlje
      // je zajednicko za unutrasnje strane — nazad + ime, bez preliva (27.9.2026).
      label="Profil"
      tabBarSpace={false}
      pushed>
      <View className="pb-7 pt-6">
        <Text variant="display">{profile.name}</Text>
        {user?.email && <Text variant="muted" className="mt-1.5">{user.email}</Text>}
      </View>

      {/* Podaci o rodjenju */}
      <Pressable
        onPress={() => router.push('/edit')}
        accessibilityRole="button"
        className={cn(CARD_SURFACE, 'active:opacity-60')}>
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text variant="label">Podaci o rođenju</Text>
          <ChevronRight size={16} color={neutral.inkSubtle} />
        </View>
        <View className="px-4 py-3.5">
          <Text className="text-sm">
            {datumRodjenja(b)}
            {profile.time ? ` u ${pad(profile.time.hour)}:${pad(profile.time.minute)}` : ''}
          </Text>
          <Text variant="muted" className="mt-1 text-sm">{city.name}, {city.country}</Text>
          {timeUnknown && (
            <Text variant="muted" className="mt-2 text-xs">
              Vreme nije uneto — ascendent i kuće nisu pouzdani. Dodirni da dopuniš.
            </Text>
          )}
        </View>
      </Pressable>

      {/* Pristup */}
      <View className={cn(CARD_SURFACE, 'mt-4')}>
        <View className="border-b border-border px-4 py-3">
          <Text variant="label">Pristup</Text>
        </View>
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <Text className="text-sm">Plaćeni sadržaj</Text>
          <Text className={cn('text-sm', entitlement?.active ? 'text-foreground' : 'text-muted-foreground')}>
            {entitlement?.active ? (entitlement.productId === 'poklon' ? 'aktivan, poklon' : 'aktivan') : 'nije aktivan'}
          </Text>
        </View>
        {entitlement?.expiresAt && (
          <View className="flex-row items-center justify-between border-t border-border px-4 py-3.5">
            <Text className="text-sm">Ističe</Text>
            <Text variant="muted" className="text-sm">
              {formatDatum(new Date(entitlement.expiresAt))}
            </Text>
          </View>
        )}
      </View>

      {/* Test prekidac — postoji samo u razvoju (__DEV__). U release bildu
          se ni ne renderuje, a override se ni ne primenjuje. */}
      {DEV_TOOLS_ENABLED && (
        <View className={cn(CARD_SURFACE, 'mt-4 border-dashed border-border')}>
          <View className="border-b border-border px-4 py-3">
            <Text variant="label">Test (samo razvoj)</Text>
          </View>

          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-1 pr-3">
              <Text className="text-sm">Plaćeni korisnik</Text>
              <Text variant="muted" className="mt-0.5 text-xs">
                {override === null
                  ? `prati server (${serverEntitlement?.active ? 'plaćen' : 'nije plaćen'})`
                  : 'ručno postavljeno'}
              </Text>
            </View>
            <Switch
              value={entitlement?.active ?? false}
              onValueChange={setOverride}
              accessibilityLabel="Test prekidač: plaćeni korisnik"
            />
          </View>

          {override !== null && (
            <Pressable
              onPress={() => setOverride(null)}
              accessibilityRole="button"
              className="border-t border-border px-4 py-3 active:opacity-60">
              <Text variant="muted" className="text-xs">Vrati na pravo stanje sa servera</Text>
            </Pressable>
          )}
        </View>
      )}

      <Button variant="ghost" className="mt-8" disabled={busy === 'brisanje'} ucitava={busy === 'odjava'} onPress={doSignOut}>
        <Text className="text-destructive">Odjavi se</Text>
      </Button>

      <Pressable
        onPress={doDelete}
        disabled={busy !== null}
        accessibilityState={{ disabled: busy !== null, busy: busy === 'brisanje' }}
        accessibilityRole="button"
        accessibilityLabel="Obriši nalog i sve podatke"
        className="mt-2 items-center py-3 active:opacity-60">
        {busy === 'brisanje'
          ? <ActivityIndicator color={neutral.inkSubtle} />
          : <Text variant="muted" className="text-xs">Obriši nalog</Text>}
      </Pressable>
    </Screen>
  );
}
