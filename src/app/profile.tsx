import * as React from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Linking, Platform, Pressable, Switch, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Camera, ChevronRight, Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { dostupniJezici, IME_JEZIKA, tr, useJezik, useT } from '@/i18n';
import { useJezikStore } from '@/store/jezik';
import { VrednostReda } from '@/components/ui/vrednost-reda';
import { Group, GroupHeader, ListRow } from '@/components/ui/list';
import { TvojiLjudi } from '@/components/tvoji-ljudi';
import { OZNAKA_12 } from '@/components/tvoj-dan-card';
import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { SlikaProfila } from '@/components/slika-profila';
import { PREMIUM, otvoriPremium } from '@/components/zakljucano';
import { signOut, useAuthStore, useEntitlement } from '@/store/auth';
import { PREKIDAC_PRODUCT_ID, PROBNI_BUILD, useDevStore } from '@/store/dev';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { imaSvojuSliku, ukloniSliku, usePromeniSliku, type IshodSlike } from '@/lib/slika-profila';
import { formatDatum } from '@/lib/horoscope';
import { chartRulers } from '@/lib/rulers';
import { vratiKupovine } from '@/lib/kupovina';
import { PRIVATNOST, USLOVI } from '@/lib/pravila';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/** Grupe bez svojih bokova — bokove daje `SheetScroll`. */
const GRUPA = 'mx-0';
/** Naslov sekcije: kao datum na pocetnoj ("TVOJ DAN · …", `oznaka` 12pt — Ivan, 29.9.2026). */
const NASLOV = cn('ml-0', OZNAKA_12);

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
 * Redosled: ko si (slika, ime) -> Tvoji ljudi -> Premium -> nalog
 * (email i podaci o rodjenju su na listu "Nalog", Ivan 29.9.2026). Brisanje naloga NIJE ovde nego jedan korak dublje, na listu "Nalog"
 * (Ivan: "ne treba da bude dostupno odmah") — i dalje u aplikaciji, kako Apple
 * trazi (5.1.1(v)), samo ne na dohvat palca.
 */
/** Adresa podrske — ista kao na sajtu (`web/podrska.html`). */
const PODRSKA = 'podrska@astroshop.rs';

/**
 * Mejl podrsci. Bez mejl aplikacije na telefonu `openURL` pada — tada se adresa
 * pokaze, da korisnik moze da je prepise.
 */
function pisiPodrsci() {
  const telo = `\n\n—\nAstro Shop ${Constants.expoConfig?.version ?? ''} · ${Platform.OS} ${Platform.Version}`;
  Linking.openURL(`mailto:${PODRSKA}?subject=${encodeURIComponent('Astro Shop')}&body=${encodeURIComponent(telo)}`)
    .catch(() => { const tp = tr().profil.profil; Alert.alert(tp.pisiteNam, tp.nemaMejlAplikacije(PODRSKA)); });
}

export default function ProfileSheet() {
  const t = useT();
  const tp = t.profil.profil;
  const jezik = useJezik();
  const izaberiJezikUStore = useJezikStore((s) => s.izaberi);
  // Imena jezika su na SVOM jeziku ("English", "Srpski") i ne prevode se.
  const izaberiJezik = () => {
    const jezici = dostupniJezici();
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...jezici.map((j) => IME_JEZIKA[j]), t.opste.otkazi], cancelButtonIndex: jezici.length },
        (i) => { if (i < jezici.length) izaberiJezikUStore(jezici[i]); },
      );
    } else {
      Alert.alert(tp.jezik, undefined, [
        ...jezici.map((j) => ({ text: IME_JEZIKA[j], onPress: () => izaberiJezikUStore(j) })),
        { text: t.opste.otkazi, style: 'cancel' as const },
      ]);
    }
  };
  const hydrated = useProfileStore((s) => s.hydrated);
  const { user, loading } = useAuthStore();
  const entitlement = useEntitlement();
  const naServeru = useAuthStore((s) => s.entitlement?.active ?? false);
  const premiumRucno = useDevStore((s) => s.premiumRucno);
  const setPremiumRucno = useDevStore((s) => s.setPremiumRucno);
  const resolved = useResolvedProfile();
  const promeniSliku = usePromeniSliku();
  const [radiSlika, setRadiSlika] = React.useState(false);
  const [odjava, setOdjava] = React.useState(false);

  if (loading || !hydrated) return <View className="flex-1 bg-grouped" />;
  if (!resolved) return <Redirect href="/" />;

  const { profile, chart, timeUnknown } = resolved;
  // Bez slike: vladar horoskopa (tradicionalni vladar podznaka, `lib/rulers.ts`).
  // Bez vremena rodjenja podznaka nema, pa ni vladara — tada Sunce (pravilo 5).
  const vladar = chartRulers(chart, timeUnknown)[0] ?? 'sun';

  const posleSlike = (ishod: IshodSlike) => {
    if (ishod === 'bez-dozvole') {
      Alert.alert(tp.nemaPristupaNaslov, tp.nemaPristupaTekst);
    } else if (ishod === 'greska') {
      Alert.alert(tp.slikaNijeSacuvanaNaslov, tp.slikaNijeSacuvanaTekst);
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
        { options: [tp.izaberiDruguSliku, tp.ukloniSliku, tp.odustani], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (i) => { if (i === 0) izaberi(); else if (i === 1) ukloni(); },
      );
    } else {
      Alert.alert(tp.slikaProfila, undefined, [
        { text: tp.izaberiDruguSliku, onPress: izaberi },
        { text: tp.ukloniSliku, style: 'destructive', onPress: ukloni },
        { text: tp.odustani, style: 'cancel' },
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

  const premium = entitlement?.active ?? false;
  const istice = entitlement?.expiresAt ? formatDatum(new Date(entitlement.expiresAt)) : null;

  const saPrekidaca = entitlement?.productId === PREKIDAC_PRODUCT_ID;
  const izProdavnice = premium && entitlement?.productId !== 'poklon' && !saPrekidaca;

  const vrati = async () => {
    const ishod = await vratiKupovine();
    if (ishod === 'nedostupno') Alert.alert(tp.josNijeMoguceNaslov, tp.josNijeMoguceTekst);
    else if (ishod === 'nema') Alert.alert(tp.nemaPretplateNaslov, tp.nemaPretplateTekst);
    else if (ishod === 'greska') Alert.alert(tp.proveraNijeUspelaNaslov, tp.proveraNijeUspelaTekst);
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
          accessibilityLabel={imaSvojuSliku(user) ? tp.promeniSliku : tp.dodajSliku}
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

      {/* Druge osobe — PRVA stvar u meniju (Ivan, 29.9.2026): spisak i dodavanje. */}
      <TvojiLjudi className="mt-6" izLista />

      {/* Pretplata: stanje, upravljanje (samo kupljena — poklon se ne otkazuje u
          prodavnici) i vracanje kupovina za besplatne. */}
      {premium ? (
        <>
          <GroupHeader variant="oznaka" className={NASLOV}>{tp.pretplata}</GroupHeader>
          <Group className={GRUPA}>
            <ListRow
              title={tp.premium}
              subtitle={
                saPrekidaca
                  ? tp.ukljucenTestom
                  : entitlement?.productId === 'poklon'
                    ? tp.poklon(istice)
                    : istice ? tp.aktivanObnavljaSe(istice) : tp.aktivan
              }
            />
            {izProdavnice && (
              <ListRow
                title={tp.upravljajPretplatom}
                onPress={() => Linking.openURL(PRETPLATE)}
              />
            )}
          </Group>
        </>
      ) : (
        <>
          <GroupHeader variant="oznaka" className={NASLOV}>{tp.pretplata}</GroupHeader>
          {/* Jedan NAGLASEN red umesto kartice (Ivan, 29.9.2026: "da bude manji"):
              pun indigo (boja Premium-a svuda, pravilo 2) i beo tekst. */}
          <Group className={GRUPA}>
            <Pressable
              onPress={() => otvoriPremium(true)}
              accessibilityRole="button"
              accessibilityLabel={tp.otkljucajPremium}
              style={{ backgroundColor: PREMIUM }}
              className="min-h-row flex-row items-center gap-3 px-gutter py-3 active:opacity-80">
              <Lock size={18} color={neutral.white} strokeWidth={2.2} />
              <View className="flex-1">
                <Text variant="row" className={tezina('naslovUTekstu')} style={{ color: neutral.white }}>{tp.otkljucajPremium}</Text>
                <Text variant="caption" style={{ color: neutral.white, opacity: 0.8 }}>{tp.otkljucajPremiumIspod}</Text>
              </View>
              <ChevronRight size={20} color={neutral.white} strokeWidth={2.2} />
            </Pressable>
            <ListRow title={tp.vratiKupovine} chevron={false} onPress={vrati} />
          </Group>
        </>
      )}

      {/* TEST PREKIDAC (Ivan, 30.9.2026: "samo za test") — samo u probnom buildu
          (`PROBNI_BUILD`: razvoj, build iz Xcode-a sa `.env`, EAS development/preview).
          Menja samo prikaz; duge tekstove salje samo server (pravilo 8). */}
      {PROBNI_BUILD && (
        <>
          <GroupHeader variant="oznaka" className={NASLOV}>{tp.test}</GroupHeader>
          <Group className={GRUPA}>
            <ListRow
              title={tp.placeniKorisnik}
              subtitle={
                premiumRucno === null
                  ? tp.pratiServer(naServeru)
                  : tp.rucno
              }
              trailing={
                <Switch
                  value={premium}
                  onValueChange={setPremiumRucno}
                  accessibilityLabel={tp.prekidacOpis}
                />
              }
            />
            {premiumRucno !== null && (
              <ListRow title={tp.vratiNaServer} chevron={false} onPress={() => setPremiumRucno(null)} />
            )}
            {/* Jezik (pravilo 26): samo u probnom buildu dok korpus nije preveden. */}
            <ListRow
              title={tp.jezik}
              subtitle={tp.jezikIspod}
              trailing={<VrednostReda>{IME_JEZIKA[jezik]}</VrednostReda>}
              onPress={izaberiJezik}
            />
          </Group>
        </>
      )}

      {/* Nalog: email i odjava. Brisanje je na listu "Nalog". */}
      <GroupHeader variant="oznaka" className={NASLOV}>{tp.nalog}</GroupHeader>
      <Group className={GRUPA}>
        <ListRow title={tp.nalog} subtitle={tp.nalogIspod} onPress={() => router.push('/nalog')} />
        <ListRow
          title={tp.odjaviSe}
          // Crno, ne crveno (Ivan, 29.9.2026): odjava nista ne brise.
          chevron={false}
          onPress={odjava ? undefined : doSignOut}
          trailing={odjava ? <ActivityIndicator color={neutral.inkSubtle} /> : undefined}
        />
      </Group>

      {/* Pomoc (B10 iz UX recenzije, Ivan 1.10.2026): mejl podrsci, sa verzijom aplikacije i
          telefona u telu poruke. Adresa je ista kao na sajtu (`web/podrska.html`). Obavestenja
          dolaze ovde kad push postoji. */}
      <GroupHeader variant="oznaka" className={NASLOV}>{tp.pomoc}</GroupHeader>
      <Group className={GRUPA}>
        {/* PRIVREMENO (Ivan, 1.10.2026): samo red, ne radi nista — prava podesavanja kad stigne
            push. Zapisano u CLAUDE.md, "Jos nije uradjeno" (Push notifikacije). */}
        <ListRow title={tp.obavestenja} subtitle={tp.obavestenjaUskoro} chevron={false} />
        <ListRow title={tp.pisiteNam} subtitle={PODRSKA} onPress={pisiPodrsci} />
      </Group>

      {/* Pravila na sajtu — isti linkovi kao na paywall-u. */}
      <GroupHeader variant="oznaka" className={NASLOV}>{tp.pravila}</GroupHeader>
      <Group className={GRUPA}>
        <ListRow title={tp.pravilaPrivatnosti} onPress={() => WebBrowser.openBrowserAsync(PRIVATNOST)} />
        <ListRow title={tp.usloviKoriscenja} onPress={() => WebBrowser.openBrowserAsync(USLOVI)} />
      </Group>

      <Text variant="caption" className="mt-6 text-center">
        {tp.verzija(t.opste.imeAplikacije, Constants.expoConfig?.version ?? '')}
      </Text>
    </SheetScroll>
  );
}
