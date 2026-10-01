import * as React from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Check, Download, Share } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { dnoLista } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { MOZE_CUVANJE, sacuvajUFotografije } from '@/components/prica/platno-videa';
import { KrugNapretka, podeliVideo, procenat, useKljucVidea } from '@/components/prica/video-traka';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { PROBNI_BUILD } from '@/store/dev';
import { useVideo, type VrstaVidea } from '@/store/video-price';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/**
 * TVOJ VIDEO (Ivan, 30.9.2026): list odozdo — sa trake iznad tabova, iz obavestenja i iz
 * price ("Podeli" -> "Pogledaj video"), pa je video tu ceo dan, i posle deljenja.
 * Gotov video se vrti bez zvuka (zvuka ni nema), ispod je "Podeli" — sistemski meni
 * (Instagram, WhatsApp, Viber) — i "Sačuvaj u Fotografije": aplikacija ga cuva samo do
 * kraja dana, a trajna kopija je u Fotografijama. Dok se pravi: napredak; uz "Smanji
 * pokrete" video ne krece sam.
 */
export default function VideoPriceEkran() {
  // `?vrsta=znak` — video price o znaku (1.10.2026); bez nje dnevni.
  // Probni build: `?proba=1` pokazuje video napravljen na `/dev-video` (bez naloga).
  const { proba, vrsta: v0 } = useLocalSearchParams<{ proba?: string; vrsta?: string }>();
  const vrsta: VrstaVidea = v0 === 'znak' ? 'znak' : 'dan';
  const nalog = useAuthStore((s) => s.user?.id ?? null);
  const uid = PROBNI_BUILD && proba === '1' ? 'proba' : nalog;
  const v = useVideo(uid, vrsta, useKljucVidea(vrsta));
  const dnevni = vrsta === 'dan';
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const visina = Math.min(460, H * 0.52);

  return (
    // Dno kao svaki list visine sadrzaja (`dnoLista`): sistem vec ostavlja umetak ispod.
    <View style={[{ paddingTop: 28, paddingHorizontal: 20, alignItems: 'center' }, dnoLista(insets.bottom)]}>
      <Text className={cn('text-center text-[22px] leading-[28px]', tezina('naslovStrane'))}>Tvoj video</Text>
      <Text className="mt-0.5 text-center text-[14px] leading-[19px] text-muted-foreground">{dnevni ? 'Priča dana' : 'Priča o tvom znaku'}</Text>
      {v?.stanje === 'gotov' && v.uri ? (
        <>
          <Pregled uri={v.uri} visina={visina} />
          <Button onPress={() => podeliVideo(v.uri!, vrsta)} className="mt-6 self-stretch" accessibilityLabel="Podeli video">
            <View className="flex-row items-center gap-2">
              <Share size={19} color={neutral.white} strokeWidth={2} />
              <Text>Podeli video</Text>
            </View>
          </Button>
          {MOZE_CUVANJE && <Sacuvaj uri={v.uri} />}
          <Text className="mt-3 text-center text-[13px] leading-[18px] text-muted-foreground">
            {dnevni
              ? (MOZE_CUVANJE ? `U aplikaciji je do kraja dana, a u ${GALERIJA_U} ostaje.` : 'U aplikaciji je do kraja dana.')
              : (MOZE_CUVANJE ? `U aplikaciji je dok ne napraviš nov, a u ${GALERIJA_U} ostaje.` : 'U aplikaciji je dok ne napraviš nov.')}
          </Text>
        </>
      ) : v?.stanje === 'pravi' ? (
        <View style={{ height: visina * 0.6, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <KrugNapretka napredak={v.napredak} velicina={56} />
          <Text className={cn('text-[17px] leading-[22px]', tezina('row'))}>{`Pravimo tvoj video · ${procenat(v.napredak)}`}</Text>
          <Text className="px-6 text-center text-[14px] leading-[20px] text-muted-foreground">
            Za to vreme koristi aplikaciju. Ako izađeš iz nje, pravljenje kreće ispočetka kad se vratiš.
          </Text>
        </View>
      ) : (
        <View style={{ paddingVertical: 36 }}>
          <Text className="px-4 text-center text-[15px] leading-[22px] text-muted-foreground">
            {v?.stanje === 'greska'
              ? `Video nije uspeo. Otvori ${dnevni ? 'priču dana' : 'priču o znaku'} i pokušaj ponovo: dugme „Podeli“, pa „Cela priča, video“.`
              : dnevni
                ? 'Danas još nema videa. Napravićeš ga iz priče dana: dugme „Podeli“, pa „Cela priča, video“.'
                : 'Video znaka još nije napravljen. Napravićeš ga iz priče o znaku (tab „Ti“): dugme „Podeli“, pa „Cela priča, video“.'}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Ime mesta za slike kako ga telefon zove: iOS "Fotografije", Android "Galerija". */
const GALERIJA_AK = Platform.OS === 'ios' ? 'Fotografije' : 'Galeriju';
const GALERIJA_U = Platform.OS === 'ios' ? 'Fotografijama' : 'Galeriji';

/**
 * Trajna kopija: iOS u Fotografije (samo dozvola za dodavanje), Android u Galeriju
 * (Movies/Astro Shop, od Androida 10 bez dozvole) — `modules/video-price`.
 */
function Sacuvaj({ uri }: { uri: string }) {
  const [stanje, setStanje] = React.useState<'ceka' | 'cuva' | 'sacuvano' | 'bez-dozvole' | 'greska'>('ceka');
  const cuvaj = async () => {
    setStanje('cuva');
    try {
      setStanje(await sacuvajUFotografije(uri));
    } catch {
      setStanje('greska');
    }
  };
  if (stanje === 'bez-dozvole') {
    return (
      <View className="mt-3 items-center self-stretch">
        <Text className="text-center text-[13px] leading-[18px] text-muted-foreground">
          {`Astro Shop nema dozvolu da dodaje u ${GALERIJA_AK}.`}
        </Text>
        <Pressable
          onPress={() => Linking.openSettings()}
          accessibilityRole="button"
          className="h-11 items-center justify-center active:opacity-60">
          <Text className={cn('text-[15px] leading-[20px]', tezina('dugme'))}>Otvori Podešavanja</Text>
        </Pressable>
      </View>
    );
  }
  const sacuvano = stanje === 'sacuvano';
  return (
    <>
      <Button variant="secondary" onPress={cuvaj} disabled={stanje === 'cuva' || sacuvano} className="mt-2.5 self-stretch">
        <View className="flex-row items-center gap-2">
          {stanje === 'cuva'
            ? <ActivityIndicator size="small" color={neutral.ink} />
            : sacuvano
              ? <Check size={19} color={neutral.inkMuted} strokeWidth={2.2} />
              : <Download size={19} color={neutral.ink} strokeWidth={2} />}
          <Text>{sacuvano ? `Sačuvano u ${GALERIJA_U}` : `Sačuvaj u ${GALERIJA_AK}`}</Text>
        </View>
      </Button>
      {stanje === 'greska' && (
        <Text className="mt-2 text-center text-[13px] leading-[18px] text-destructive">Video nije sačuvan. Pokušaj ponovo.</Text>
      )}
    </>
  );
}

function Pregled({ uri, visina }: { uri: string; visina: number }) {
  const bezPokreta = useReducedMotion();
  const plejer = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    if (!bezPokreta) p.play();
  });
  return (
    <View
      className="mt-5 overflow-hidden rounded-xl bg-fill-strong"
      style={{ height: visina, width: (visina * 9) / 16 }}>
      <VideoView
        player={plejer}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={bezPokreta}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        accessibilityLabel="Video priče dana"
      />
    </View>
  );
}
