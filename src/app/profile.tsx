import * as React from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Linking, Platform, Pressable, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Camera, ChevronRight, Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Group, GroupHeader, ListRow } from '@/components/ui/list';
import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { SlikaProfila } from '@/components/slika-profila';
import { PREMIUM, otvoriPremium } from '@/components/zakljucano';
import { signOut, useAuthStore, useEntitlement } from '@/store/auth';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { imaSvojuSliku, ukloniSliku, usePromeniSliku, type IshodSlike } from '@/lib/slika-profila';
import { datumRodjenja, formatDatum } from '@/lib/horoscope';
import { chartRulers } from '@/lib/rulers';
import { vratiKupovine } from '@/lib/kupovina';
import { PRIVATNOST, USLOVI } from '@/lib/pravila';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

const pad = (n: number) => String(n).padStart(2, '0');

/** Grupe bez svojih bokova — bokove daje `SheetScroll`. */
const GRUPA = 'mx-0';
const NASLOV = 'ml-0';

/** Pretplate u prodavnici — tu se otkazuje i menja paket (Apple ne da da to radi aplikacija). */
const PRETPLATE = Platform.OS === 'ios'
  ? 'https://apps.apple.com/account/subscriptions'
  : 'https://play.google.com/store/account/subscriptions';

/** Mala kamera u belom krugu, dole desno uz sliku — znak da se slika menja dodirom. */
const ZNACKA = 30;

/**
 * PROFIL — list odozdo do vrha (Ivan, 29.9.2026; do tada unutrasnja strana sa
 * strelicom nazad). Otvara ga dugme gore desno na svim tabovima.
 *
 * Redosled: ko si (slika, ime) -> Premium -> podaci o rodjenju -> nalog -> pravila.
 * Brisanje naloga NIJE ovde nego jedan korak dublje, na listu "Nalog"
 * (Ivan: "ne treba da bude dostupno odmah") — i dalje u aplikaciji, kako Apple
 * trazi (5.1.1(v)), samo ne na dohvat palca.
 */
export default function ProfileSheet() {
  const hydrated = useProfileStore((s) => s.hydrated);
  const { user, loading } = useAuthStore();
  const entitlement = useEntitlement();
  const resolved = useResolvedProfile();
  const promeniSliku = usePromeniSliku();
  const [radiSlika, setRadiSlika] = React.useState(false);
  const [odjava, setOdjava] = React.useState(false);

  if (loading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved) return <Redirect href="/" />;

  const { profile, city, chart, timeUnknown } = resolved;
  // Bez slike: vladar horoskopa (tradicionalni vladar podznaka, `lib/rulers.ts`).
  // Bez vremena rodjenja podznaka nema, pa ni vladara — tada Sunce (pravilo 5).
  const vladar = chartRulers(chart, timeUnknown)[0] ?? 'sun';

  const posleSlike = (ishod: IshodSlike) => {
    if (ishod === 'bez-dozvole') {
      Alert.alert('Nema pristupa fotografijama', 'Dozvoli pristup u podešavanjima telefona, pa probaj ponovo.');
    } else if (ishod === 'greska') {
      Alert.alert('Slika nije sačuvana', 'Proveri internet pa probaj ponovo.');
    }
  };

  const izaberi = async () => {
    setRadiSlika(true);
    posleSlike(await promeniSliku());
    setRadiSlika(false);
  };

  const ukloni = async () => {
    setRadiSlika(true);
    if (!(await ukloniSliku())) posleSlike('greska');
    setRadiSlika(false);
  };

  const meniSlike = () => {
    if (!imaSvojuSliku(user)) { izaberi(); return; }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Izaberi drugu sliku', 'Ukloni sliku', 'Odustani'], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (i) => { if (i === 0) izaberi(); else if (i === 1) ukloni(); },
      );
    } else {
      Alert.alert('Slika profila', undefined, [
        { text: 'Izaberi drugu sliku', onPress: izaberi },
        { text: 'Ukloni sliku', style: 'destructive', onPress: ukloni },
        { text: 'Odustani', style: 'cancel' },
      ]);
    }
  };

  const doSignOut = async () => {
    setOdjava(true);
    await signOut();
    setOdjava(false);
    router.dismissAll();
    router.replace('/');
  };

  const vreme = profile.time ? ` u ${pad(profile.time.hour)}:${pad(profile.time.minute)}` : '';
  const premium = entitlement?.active ?? false;
  const istice = entitlement?.expiresAt ? formatDatum(new Date(entitlement.expiresAt)) : null;

  const izProdavnice = premium && entitlement?.productId !== 'poklon';

  const vrati = async () => {
    const ishod = await vratiKupovine();
    if (ishod === 'nedostupno') Alert.alert('Još nije moguće', 'Kupovina u aplikaciji još nije uključena.');
    else if (ishod === 'nema') Alert.alert('Nema pretplate', 'Na ovom nalogu prodavnice nema pretplate za Astroshop.');
    else if (ishod === 'greska') Alert.alert('Provera nije uspela', 'Pokušaj ponovo za koji trenutak.');
  };

  return (
    // Bokove daje `SheetScroll` (24pt, kao svi listovi) — grupe zato bez svog
    // `mx-screen`, inace je bilo 44pt od ivice (Ivan, 29.9.2026: "paddinzi su preveliki").
    <SheetScroll siva>
      {/* Ko si */}
      <View className="items-center">
        <Pressable
          onPress={meniSlike}
          disabled={radiSlika}
          accessibilityRole="button"
          accessibilityLabel={imaSvojuSliku(user) ? 'Promeni ili ukloni sliku profila' : 'Dodaj sliku profila'}
          className="active:opacity-80">
          <SlikaProfila ime={profile.name} vladar={vladar} />
          <View
            className="absolute items-center justify-center rounded-full border-2 border-grouped bg-card"
            style={{ width: ZNACKA, height: ZNACKA, right: -2, bottom: -2 }}>
            {radiSlika
              ? <ActivityIndicator size="small" color={neutral.inkSubtle} />
              : <Camera size={15} color={neutral.ink} strokeWidth={2.2} />}
          </View>
        </Pressable>
        <Text variant="naslovLista" className="mt-4 text-center">{profile.name}</Text>
      </View>

      {/* Pretplata: stanje, upravljanje (samo kupljena — poklon se ne otkazuje u
          prodavnici) i vracanje kupovina za besplatne. */}
      {premium ? (
        <>
          <GroupHeader className={NASLOV}>Pretplata</GroupHeader>
          <Group className={GRUPA}>
            <ListRow
              title="Premium"
              subtitle={
                entitlement?.productId === 'poklon'
                  ? `Poklon${istice ? `, do ${istice}` : ''}`
                  : istice ? `Aktivan, obnavlja se ${istice}` : 'Aktivan'
              }
            />
            {izProdavnice && (
              <ListRow
                title="Upravljaj pretplatom"
                onPress={() => Linking.openURL(PRETPLATE)}
              />
            )}
          </Group>
        </>
      ) : (
        <>
          <GroupHeader className={NASLOV}>Pretplata</GroupHeader>
          {/* Jedan NAGLASEN red umesto kartice (Ivan, 29.9.2026: "da bude manji"):
              pun indigo (boja Premium-a svuda, pravilo 2) i beo tekst. */}
          <Group className={GRUPA}>
            <Pressable
              onPress={() => otvoriPremium(true)}
              accessibilityRole="button"
              accessibilityLabel="Otključaj Premium"
              style={{ backgroundColor: PREMIUM }}
              className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:opacity-80">
              <Lock size={18} color={neutral.white} strokeWidth={2.2} />
              <View className="flex-1">
                <Text variant="row" className={tezina('naslovUTekstu')} style={{ color: neutral.white }}>Otključaj Premium</Text>
                <Text variant="caption" style={{ color: neutral.white, opacity: 0.8 }}>Svi tranziti, ceo tekst i drugi dani</Text>
              </View>
              <ChevronRight size={20} color={neutral.white} strokeWidth={2.2} />
            </Pressable>
            <ListRow title="Vrati kupovine" chevron={false} onPress={vrati} />
          </Group>
        </>
      )}

      {/* Podaci o rodjenju */}
      <GroupHeader className={NASLOV}>Podaci o rođenju</GroupHeader>
      <Group className={GRUPA}>
        <ListRow
          title={`${datumRodjenja(profile.birth)}${vreme}`}
          subtitle={`${city.name}, ${city.country}`}
          onPress={() => leaveSheetTo('/edit')}
        />
      </Group>
      {timeUnknown && (
        <Text variant="caption" className="mt-2 px-gutter">
          Vreme rođenja nije uneto, pa podznak i kuće nisu pouzdani. Dodirni da dopuniš.
        </Text>
      )}

      {/* Nalog: email i odjava. Brisanje je na listu "Nalog". */}
      <GroupHeader className={NASLOV}>Nalog</GroupHeader>
      <Group className={GRUPA}>
        <ListRow title="Nalog" subtitle={user?.email ?? undefined} onPress={() => router.push('/nalog')} />
        <ListRow
          title="Odjavi se"
          destructive
          chevron={false}
          onPress={odjava ? undefined : doSignOut}
          trailing={odjava ? <ActivityIndicator color={neutral.inkSubtle} /> : undefined}
        />
      </Group>

      {/* Pravila na sajtu — isti linkovi kao na paywall-u. */}
      <GroupHeader className={NASLOV}>Pravila</GroupHeader>
      <Group className={GRUPA}>
        <ListRow title="Pravila privatnosti" onPress={() => WebBrowser.openBrowserAsync(PRIVATNOST)} />
        <ListRow title="Uslovi korišćenja" onPress={() => WebBrowser.openBrowserAsync(USLOVI)} />
      </Group>

      <Text variant="caption" className="mt-6 text-center">
        Astro Shop {Constants.expoConfig?.version ?? ''}
      </Text>
    </SheetScroll>
  );
}
