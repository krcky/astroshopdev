import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TabBackground } from '@/components/ambient-gradient';
import { signOut, useAuthStore } from '@/store/auth';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { cn } from '@/lib/utils';

const MESECI = ['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];
const pad = (n: number) => String(n).padStart(2, '0');

export default function ProfileTab() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const { user, entitlement, loading } = useAuthStore();
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

  return (
    <View className="flex-1 bg-background">
      <TabBackground tab="profile" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}>

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

          <Button variant="ghost" className="mt-8" disabled={busy} onPress={doSignOut}>
            <Text className="text-destructive">{busy ? 'Odjavljujem…' : 'Odjavi se'}</Text>
          </Button>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
