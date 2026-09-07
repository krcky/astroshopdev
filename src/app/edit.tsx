import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { searchCities, cityByName, type City } from '@/lib/cities';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { useAuthStore } from '@/store/auth';
import { pushProfile } from '@/lib/sync';

/**
 * Izmena podataka o rodjenju — SVE na jednom ekranu, ne kroz cetiri koraka.
 * Onboarding vodi kroz korake jer korisnik tada ne zna sta ga ceka; kod izmene
 * zna tacno sta menja i hoce da stigne do toga u jednom dodiru.
 */
export default function EditBirthData() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const user = useAuthStore((s) => s.user);
  const resolved = useResolvedProfile();

  const [name, setName] = React.useState(profile?.name ?? '');
  const [date, setDate] = React.useState(() =>
    profile ? new Date(profile.birth.year, profile.birth.month - 1, profile.birth.day, 12) : new Date(2000, 0, 1, 12)
  );
  const [time, setTime] = React.useState(() => {
    const d = new Date(2000, 0, 1, 12, 0);
    if (profile?.time) { d.setHours(profile.time.hour); d.setMinutes(profile.time.minute); }
    return d;
  });
  const [timeKnown, setTimeKnown] = React.useState(Boolean(profile?.time));
  const [city, setCity] = React.useState<City | null>(profile ? cityByName(profile.cityName) ?? null : null);
  const [query, setQuery] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  if (!profile || !resolved) return <Redirect href="/" />;

  const valid = name.trim().length > 0 && city !== null;

  const save = async () => {
    if (!valid || !city || busy) return;
    setBusy(true);
    const updated = {
      name: name.trim(),
      birth: { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() },
      time: timeKnown ? { hour: time.getHours(), minute: time.getMinutes() } : null,
      cityName: city.name,
    };
    setProfile(updated);
    if (user) await pushProfile(user.id, updated);
    setBusy(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable onPress={() => router.back()} hitSlop={14}
                     accessibilityRole="button" accessibilityLabel="Nazad">
            <ChevronLeft size={26} color="#141414" />
          </Pressable>
          <Text variant="label">Podaci o rođenju</Text>
        </View>

        <ScrollView contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
          <Section title="Ime">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="tvoje ime"
              placeholderTextColor="#9A9A9A"
              autoCapitalize="words"
              maxLength={60}
              className="border-b border-border pb-2 text-center text-2xl text-foreground"
            />
          </Section>

          <Section title="Datum">
            <WheelPicker mode="date" value={date} onChange={setDate} maximumDate={new Date()} />
          </Section>

          <Section title="Vreme">
            {timeKnown ? (
              <WheelPicker mode="time" value={time} onChange={setTime} />
            ) : (
              <Text variant="muted" className="py-4 text-center">
                Vreme nije uneto — ascendent i kuće nisu pouzdani.
              </Text>
            )}
            <Pressable
              onPress={() => setTimeKnown(!timeKnown)}
              accessibilityRole="button"
              className="mt-2 items-center py-2 active:opacity-60">
              <Text variant="label" className="text-foreground underline">
                {timeKnown ? 'Ne znam vreme' : 'Znam vreme, hoću da ga unesem'}
              </Text>
            </Pressable>
          </Section>

          <Section title="Mesto">
            <TextInput
              value={city ? `${city.name}, ${city.country}` : query}
              onChangeText={(t) => { setQuery(t); setCity(null); }}
              placeholder="grad"
              placeholderTextColor="#9A9A9A"
              autoCorrect={false}
              className="border-b border-border pb-2 text-center text-2xl text-foreground"
            />
            {!city && (
              <View className="mt-3">
                {searchCities(query, 6).map((c) => (
                  <Pressable
                    key={`${c.name}-${c.country}`}
                    onPress={() => { setCity(c); setQuery(''); }}
                    className="flex-row items-center justify-between border-b border-border py-3 active:opacity-60">
                    <Text className="text-base">{c.name}</Text>
                    <Text variant="muted">{c.country}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Section>

          <Button className="mt-8" size="lg" disabled={!valid || busy} onPress={save}>
            <Text>{busy ? 'Čuvam…' : 'Sačuvaj'}</Text>
          </Button>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-7">
      <Text variant="label" className="mb-3">{title}</Text>
      {children}
    </View>
  );
}
