import * as React from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TabBarSpacer } from '@/components/floating-tab-bar';
import { deleteAccount, signOut, useAuthStore, useEntitlement } from '@/store/auth';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { DEV_TOOLS_ENABLED, useDevStore } from '@/store/dev';
import { cn } from '@/lib/utils';

const MESECI = ['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];
const pad = (n: number) => String(n).padStart(2, '0');

export default function ProfileTab() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const { user, loading } = useAuthStore();
  const entitlement = useEntitlement();
  const serverEntitlement = useAuthStore((s) => s.entitlement);
  const override = useDevStore((s) => s.entitlementOverride);
  const setOverride = useDevStore((s) => s.setEntitlementOverride);
  const resolved = useResolvedProfile();
  const [busy, setBusy] = React.useState(false);

  if (loading || !hydrated) return <View className="flex-1 bg-background" />;
  if (!resolved) return <Redirect href="/" />;

  const { profile, city, timeUnknown } = resolved;
  const b = profile.birth;

  const doSignOut = async () => {
    setBusy(true);
    await signOut();
    setBusy(false);
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
            setBusy(true);
            const { error } = await deleteAccount();
            setBusy(false);
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
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-5" showsVerticalScrollIndicator={false}>

          <View className="pt-4 pb-7">
            <Text variant="label">Profil</Text>
            <Text variant="display" className="mt-1">{profile.name}</Text>
            {user?.email && <Text variant="muted" className="mt-1.5">{user.email}</Text>}
          </View>

          {/* Podaci o rodjenju */}
          <Pressable
            onPress={() => router.push('/edit')}
            accessibilityRole="button"
            className="rounded-xl border border-border active:opacity-60">
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <Text variant="label">Podaci o rođenju</Text>
              <ChevronRight size={16} color="#9A9A9A" />
            </View>
            <View className="px-4 py-3.5">
              <Text className="text-sm">
                {b.day}. {MESECI[b.month - 1]} {b.year}
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
          <View className="mt-4 rounded-xl border border-border">
            <View className="border-b border-border px-4 py-3">
              <Text variant="label">Pristup</Text>
            </View>
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <Text className="text-sm">Plaćeni sadržaj</Text>
              <Text className={cn('text-sm', entitlement?.active ? 'text-foreground' : 'text-muted-foreground')}>
                {entitlement?.active ? 'aktivan' : 'nije aktivan'}
              </Text>
            </View>
            {entitlement?.expiresAt && (
              <View className="flex-row items-center justify-between border-t border-border px-4 py-3.5">
                <Text className="text-sm">Ističe</Text>
                <Text variant="muted" className="text-sm">
                  {new Date(entitlement.expiresAt).toLocaleDateString('sr-Latn-RS')}
                </Text>
              </View>
            )}
          </View>

          {/* Test prekidac — postoji samo u razvoju (__DEV__). U release bildu
              se ni ne renderuje, a override se ni ne primenjuje. */}
          {DEV_TOOLS_ENABLED && (
            <View className="mt-4 rounded-xl border border-dashed border-border">
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

          <Button variant="ghost" className="mt-8" disabled={busy} onPress={doSignOut}>
            <Text className="text-destructive">{busy ? 'Odjavljujem…' : 'Odjavi se'}</Text>
          </Button>

          <Pressable
            onPress={doDelete}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Obriši nalog i sve podatke"
            className="mt-2 items-center py-3 active:opacity-60">
            <Text variant="muted" className="text-xs">Obriši nalog</Text>
          </Pressable>
          <TabBarSpacer />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
