import * as React from 'react';
import { ActivityIndicator, Linking, Pressable, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Check, Download, Share } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { dnoLista } from '@/components/sheet';
import { Text } from '@/components/ui/text';
import { sacuvajUFotografije } from '@/components/prica/platno-videa';
import { KrugNapretka, podeliVideo, procenat } from '@/components/prica/video-traka';
import { dayKey } from '@/lib/transits';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useDanas } from '@/store/danas';
import { PROBNI_BUILD } from '@/store/dev';
import { useVideoDana } from '@/store/video-price';
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
  // Probni build: `?proba=1` pokazuje video napravljen na `/dev-video` (bez naloga).
  const { proba } = useLocalSearchParams<{ proba?: string }>();
  const nalog = useAuthStore((s) => s.user?.id ?? null);
  const uid = PROBNI_BUILD && proba === '1' ? 'proba' : nalog;
  const dan = dayKey(useDanas());
  const v = useVideoDana(uid, dan);
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();
  const visina = Math.min(460, H * 0.52);

  return (
    // Dno kao svaki list visine sadrzaja (`dnoLista`): sistem vec ostavlja umetak ispod.
    <View style={[{ paddingTop: 28, paddingHorizontal: 20, alignItems: 'center' }, dnoLista(insets.bottom)]}>
      <Text className={cn('text-center text-[22px] leading-[28px]', tezina('naslovStrane'))}>Tvoj video</Text>
      {v?.stanje === 'gotov' && v.uri ? (
        <>
          <Pregled uri={v.uri} visina={visina} />
          <Button onPress={() => podeliVideo(v.uri!)} className="mt-6 self-stretch" accessibilityLabel="Podeli video">
            <View className="flex-row items-center gap-2">
              <Share size={19} color={neutral.white} strokeWidth={2} />
              <Text>Podeli video</Text>
            </View>
          </Button>
          <Sacuvaj uri={v.uri} />
          <Text className="mt-3 text-center text-[13px] leading-[18px] text-muted-foreground">
            U aplikaciji je do kraja dana, a u Fotografijama ostaje.
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
              ? 'Video nije uspeo. Otvori priču dana i pokušaj ponovo: dugme „Podeli“, pa „Cela priča, video“.'
              : 'Danas još nema videa. Napravićeš ga iz priče dana: dugme „Podeli“, pa „Cela priča, video“.'}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Trajna kopija u Fotografije — samo dozvola za dodavanje (`modules/video-price`). */
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
          Astro Shop nema dozvolu da dodaje u Fotografije.
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
          <Text>{sacuvano ? 'Sačuvano u Fotografijama' : 'Sačuvaj u Fotografije'}</Text>
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
