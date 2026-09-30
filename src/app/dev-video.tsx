import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Text } from '@/components/ui/text';
import { PricaPozadina } from '@/components/prica/pozadina';
import { Zraci } from '@/components/prica/crtezi';
import { INDIGO } from '@/components/prica/boje';
import { PlatnoVidea, type PlatnoVideaRef } from '@/components/prica/platno-videa';
import { procenat, VideoTrakaSadrzaj } from '@/components/prica/video-traka';
import { pitajZaObavestenje } from '@/components/prica/video-radionica';
import { usePricaDana, type PricaDana } from '@/lib/use-prica';
import { REDOSLED } from '@/lib/prica';
import { PROBNI_BUILD } from '@/store/dev';
import { useVideoPrice } from '@/store/video-price';
import { useProfileStore, type Profile } from '@/store/profile';

/**
 * Slike kojima bez naloga fali tekst (Ide ti / Koči te, savet) — sa PROBNIM recenicama,
 * samo da se vidi raspored i pokret. Nisu tekst astrologa i nikad ne idu korisniku.
 */
function saProbnimTekstovima(p: PricaDana): PricaDana {
  const PROBA = 'Probna rečenica za proveru prikaza, ovo nije tekst astrologa.';
  return {
    ...p,
    slike: [...REDOSLED],
    ideKoci: p.ideKoci ?? { ide: { tekst: PROBA, ime: 'Venera trigon Sunce' }, koci: { tekst: PROBA, ime: 'Mars kvadrat Mesec' } },
    savet: p.savet ?? { tekst: 'Probni savet dana, dovoljno dug da se vidi prelom u tri reda.', ime: 'Sunce kvadrat Uran', kljuc: 'proba' },
    trajanja: { ...p.trajanja, ideKoci: p.trajanja.ideKoci ?? 7000, savet: p.trajanja.savet ?? 6000 },
  };
}

/** Cela prica kao video, sa probnim profilom (bez naloga: uid "proba"), preko prave radionice. */
/** Probni profil za uredjaj bez naloga (emulator) — isti kao u proveri u simulatoru. */
const PROBNI_PROFIL: Profile = {
  name: 'Proba',
  birth: { year: 1990, month: 7, day: 10 },
  time: { hour: 14, minute: 30 },
  cityId: 792680,
  cityName: 'Beograd',
  latitude: 44.804,
  longitude: 20.4651,
  timeZone: 'Europe/Belgrade',
};

function PravaPrica() {
  const p = usePricaDana();
  const imaProfil = useProfileStore((s) => !!s.profile);
  const posao = useVideoPrice();
  const [pocetak, setPocetak] = React.useState<number | null>(null);
  const [trajalo, setTrajalo] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (posao.stanje === 'gotov' && pocetak && trajalo === null) setTrajalo(Date.now() - pocetak);
  }, [posao.stanje, pocetak, trajalo]);
  const v = posao.stanje ? { stanje: posao.stanje, napredak: posao.napredak, uri: posao.uri, sklonjen: false } : null;
  return (
    <View style={{ gap: 10, marginTop: 16 }}>
      <Text className="text-[18px]">Prava prica ({p ? `${p.slike.length} slika: ${p.slike.join(', ')}` : 'nema profila'})</Text>
      {/* Samo kad profila NEMA (emulator bez naloga) — nikad ne prepisuje pravi profil. */}
      {!imaProfil && (
        <Pressable onPress={() => useProfileStore.getState().setProfile(PROBNI_PROFIL)} className="rounded-lg bg-fill-strong p-3">
          <Text>Upiši probni profil (Beograd, 10.7.1990. 14:30)</Text>
        </Pressable>
      )}
      {p && (
        <Pressable
          onPress={() => { setPocetak(Date.now()); setTrajalo(null); useVideoPrice.getState().pokreni('proba', p); void pitajZaObavestenje(); }}
          className="rounded-lg bg-fill-strong p-3">
          <Text>Napravi video price</Text>
        </Pressable>
      )}
      {p && (
        <Pressable
          onPress={() => { setPocetak(Date.now()); setTrajalo(null); useVideoPrice.getState().pokreni('proba', saProbnimTekstovima(p)); }}
          className="rounded-lg bg-fill-strong p-3">
          <Text>Napravi video sa svih 6 slika (probne recenice)</Text>
        </Pressable>
      )}
      <Text selectable>
        {`stanje: ${posao.stanje ?? '-'} ${posao.stanje === 'pravi' ? procenat(posao.napredak) : ''}`}
        {trajalo !== null ? `\nnapravljen za ${(trajalo / 1000).toFixed(1)} s` : ''}
        {posao.uri ? `\n${posao.uri}` : ''}
      </Text>
      {posao.uri && (
        <Pressable onPress={() => router.push('/video-price?proba=1')} className="rounded-lg bg-fill-strong p-3">
          <Text>Otvori list "Tvoj video"</Text>
        </Pressable>
      )}
      {posao.uri && (
        <Pressable onPress={() => Sharing.shareAsync(posao.uri!, { mimeType: 'video/mp4', UTI: 'public.mpeg-4' })} className="rounded-lg bg-fill-strong p-3">
          <Text>Podeli video price</Text>
        </Pressable>
      )}
      {v && (
        <View style={{ height: 56, borderRadius: 28, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, justifyContent: 'center' }}>
          <VideoTrakaSadrzaj v={v} />
        </View>
      )}
    </View>
  );
}

/**
 * SAMO PROBNI BUILD: merenje snimanja kadrova za video price (Ivan, 30.9.2026).
 * Kartica 360 × 640 sa pokretom koji zavisi od sata; broj kadra je upisan krupno,
 * pa se iz MP4 vidi da li je svaki kadar tacan (nijedan preskocen ni ponovljen).
 */
const ACircle = Animated.createAnimatedComponent(Circle);
const ATextInput = Animated.createAnimatedComponent(TextInput);
const O = 2 * Math.PI * 80;
const FPS = 30;

const dvaKadra = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

export default function DevVideo() {
  const platno = React.useRef<PlatnoVideaRef>(null);
  const sat = useSharedValue(0);
  const [van, setVan] = React.useState(true);
  const [izvestaj, setIzvestaj] = React.useState('');
  const [uri, setUri] = React.useState<string | null>(null);
  const radi = React.useRef(false);

  const kutija = useAnimatedStyle(() => ({ transform: [{ translateX: ((sat.get() / 1000) * 150) % 300 }] }));
  const krug = useAnimatedProps(() => ({ strokeDashoffset: O * (1 - Math.min(1, sat.get() / 3000)) }));
  const broj = useAnimatedProps(() => {
    const n = String(Math.round((sat.get() * FPS) / 1000));
    return { text: n, defaultValue: n } as any;
  });

  const snimi = async (nacin: 'hijerarhija' | 'sloj', kadrova: number) => {
    if (!platno.current || radi.current) return;
    radi.current = true;
    setIzvestaj(`${nacin}: snima…`);
    const fajl = new File(Paths.cache, `proba-${nacin}.mp4`);
    try {
      await platno.current.pocni(fajl.uri, 1080, 1920, FPS, 6_000_000);
      const t0 = Date.now();
      let crtanje = 0;
      for (let f = 0; f < kadrova; f++) {
        sat.set((f * 1000) / FPS);
        await dvaKadra();
        crtanje += await platno.current.kadar(f, nacin);
      }
      const gotov = await platno.current.zavrsi();
      const ukupno = Date.now() - t0;
      setUri(gotov);
      setIzvestaj(`${nacin}, ${van ? 'van ekrana' : 'na ekranu'}: ${kadrova} kadrova za ${(ukupno / 1000).toFixed(1)} s = ${(ukupno / kadrova).toFixed(0)} ms/kadar (crtanje ${(crtanje / kadrova).toFixed(1)} ms)\n${gotov}`);
    } catch (e) {
      setIzvestaj(`${nacin}: greska ${String(e)}`);
    } finally {
      radi.current = false;
    }
  };

  if (!PROBNI_BUILD) return <Redirect href="/" />;
  if (!PlatnoVidea) return <Text className="p-8">Nema nativnog modula (Expo Go).</Text>;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 80, gap: 12 }}>
        <Text className="text-[22px]">Video: proba kadrova</Text>
        <Pressable onPress={() => setVan((v) => !v)} className="rounded-lg bg-fill-strong p-3">
          <Text>{van ? 'Platno VAN ekrana (dodir: na ekran)' : 'Platno NA ekranu (dodir: van)'}</Text>
        </Pressable>
        <Pressable onPress={() => snimi('hijerarhija', 90)} className="rounded-lg bg-fill-strong p-3"><Text>Snimi 90 — hijerarhija</Text></Pressable>
        <Pressable onPress={() => snimi('sloj', 90)} className="rounded-lg bg-fill-strong p-3"><Text>Snimi 90 — sloj</Text></Pressable>
        <Pressable onPress={() => snimi('hijerarhija', 300)} className="rounded-lg bg-fill-strong p-3"><Text>Snimi 300 — hijerarhija</Text></Pressable>
        {uri && (
          <Pressable onPress={() => Sharing.shareAsync(uri, { mimeType: 'video/mp4', UTI: 'public.mpeg-4' })} className="rounded-lg bg-fill-strong p-3">
            <Text>Podeli poslednji</Text>
          </Pressable>
        )}
        <Text testID="izvestaj" selectable>{izvestaj}</Text>
        <PravaPrica />
      </ScrollView>
      <View pointerEvents="none" style={{ position: 'absolute', left: van ? -2000 : 20, bottom: van ? 0 : 20, transform: van ? [] : [{ scale: 0.4 }], transformOrigin: 'left bottom' }}>
        <PlatnoVidea ref={platno} style={{ width: 360, height: 640, backgroundColor: INDIGO }} collapsable={false}>
          <PricaPozadina nijansa="noc" sirina={360} visina={640} />
          <View style={{ position: 'absolute', left: -170, top: -40 }}>
            <Zraci velicina={700} />
          </View>
          <Animated.View style={[{ position: 'absolute', top: 120, left: 20, width: 40, height: 40, borderRadius: 8, backgroundColor: '#F8B3C3' }, kutija]} />
          <Svg width={200} height={200} style={{ position: 'absolute', top: 200, left: 80 }}>
            <ACircle cx={100} cy={100} r={80} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray={[O, O]} animatedProps={krug} transform="rotate(-90 100 100)" />
          </Svg>
          <ATextInput
            editable={false}
            defaultValue="0"
            animatedProps={broj}
            style={{ position: 'absolute', top: 440, left: 0, right: 0, textAlign: 'center', fontSize: 96, color: '#fff', padding: 0 }}
          />
        </PlatnoVidea>
      </View>
    </View>
  );
}
