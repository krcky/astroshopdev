import * as React from 'react';
import { Pressable, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';

import { ISTAKNUTO_SENKA, SjajCrnogDugmeta } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { trajanjeZvuka } from '@/lib/pitanja';
import { neutral } from '@/theme/tokens';

const BRZINE = [1, 1.5] as const;

/**
 * Glasovni odgovor astrologa: pusti/pauza, traka napretka (dodir premotava),
 * vreme i brzina 1x / 1,5x.
 *
 * `url` je potpisan link iz privatnog skladista (`useLinkZvuka`). Dok ne stigne,
 * dugme je ugaseno. `trajanje` iz baze stoji dok plejer ne procita pravo.
 *
 * Pusta se i kad je telefon na "tiho" (`playsInSilentMode`) — kao glasovne
 * poruke u svakoj aplikaciji za dopisivanje; inace bi korisnik pritisnuo
 * "pusti" i nista ne bi cuo. Kad se list zatvori, plejer se oslobadja sam.
 */
export function GlasovnaPoruka({ url, trajanje, greska }: { url: string | null; trajanje: number | null; greska?: boolean }) {
  const t = useT().pitaj.plejer;
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const [brzina, setBrzina] = React.useState<(typeof BRZINE)[number]>(1);
  const [sirina, setSirina] = React.useState(0);
  const traka = React.useRef<View>(null);

  const ukupno = status.duration > 0 ? status.duration : (trajanje ?? 0);
  const sada = Math.min(status.currentTime, ukupno || status.currentTime);
  const udeo = ukupno > 0 ? Math.min(1, sada / ukupno) : 0;
  const spreman = !!url && status.isLoaded;

  const pusti = async () => {
    if (!spreman) return;
    if (status.playing) { player.pause(); return; }
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    // Posle kraja snimka dugme krece ispocetka.
    if (ukupno > 0 && sada >= ukupno - 0.25) await player.seekTo(0);
    player.play();
    player.setPlaybackRate(brzina);
  };

  const promeniBrzinu = () => {
    const sledeca = brzina === 1 ? 1.5 : 1;
    setBrzina(sledeca);
    player.setPlaybackRate(sledeca);
  };

  const premotajNa = (x: number) => {
    if (!spreman || sirina <= 0 || ukupno <= 0 || !Number.isFinite(x)) return;
    player.seekTo(Math.max(0, Math.min(1, x / sirina)) * ukupno);
  };
  // Telefon daje `locationX` (od leve ivice trake); react-native-web ga nema, pa
  // se tamo racuna iz polozaja trake u prozoru.
  const premotaj = (e: GestureResponderEvent) => {
    const { locationX, pageX } = e.nativeEvent;
    if (Number.isFinite(locationX)) { premotajNa(locationX); return; }
    traka.current?.measureInWindow((x) => premotajNa(pageX - x));
  };

  return (
    <View>
      <View className="flex-row items-center gap-4">
        <Pressable
          onPress={pusti}
          disabled={!spreman}
          accessibilityRole="button"
          accessibilityLabel={status.playing ? t.pauziraj : t.pusti}
          className={cn('h-12 w-12 items-center justify-center rounded-full active:opacity-80', spreman ? 'bg-primary' : 'bg-fill-strong')}
          // Crno dugme kao sva ostala: preliv, sjaj i senka (Ivan, 29.9.2026).
          style={spreman ? ISTAKNUTO_SENKA : undefined}>
          {spreman ? <SjajCrnogDugmeta /> : null}
          {status.playing
            ? <Pause size={20} color={neutral.white} fill={neutral.white} />
            // Trougao je opticki levo teziste — pomeren 1pt udesno.
            : <Play size={20} color={spreman ? neutral.white : neutral.inkSubtle} fill={spreman ? neutral.white : neutral.inkSubtle} style={{ marginLeft: 2 }} />}
        </Pressable>

        {/* Traka: dodir premotava. Visoka meta (44pt), tanka linija u sredini. */}
        <Pressable
          ref={traka}
          onPress={premotaj}
          onLayout={(e: LayoutChangeEvent) => setSirina(e.nativeEvent.layout.width)}
          disabled={!spreman}
          accessibilityRole="adjustable"
          accessibilityLabel={t.napredak}
          accessibilityValue={{ text: t.vremeOd(trajanjeZvuka(sada), trajanjeZvuka(ukupno)) }}
          className="h-11 flex-1 justify-center">
          <View className="h-1 overflow-hidden rounded-full bg-fill-strong">
            <View className="h-1 rounded-full bg-foreground" style={{ width: `${udeo * 100}%` }} />
          </View>
        </Pressable>

        <Pressable
          onPress={promeniBrzinu}
          accessibilityRole="button"
          accessibilityLabel={brzina === 1 ? t.brzinaNormalna : t.brzinaPoIPo}
          hitSlop={8}
          className="h-8 min-w-[44px] items-center justify-center rounded-pill bg-fill px-2.5 active:opacity-60">
          <Text variant="chip">{brzina === 1 ? t.brzina1 : t.brzina15}</Text>
        </Pressable>
      </View>

      <View className="ml-16 mr-[60px] flex-row justify-between">
        <Text variant="caption">{trajanjeZvuka(sada)}</Text>
        <Text variant="caption">{ukupno > 0 ? trajanjeZvuka(ukupno) : '—'}</Text>
      </View>

      {greska && (
        <Text variant="muted" className="mt-3">
          {t.nijeStigao}
        </Text>
      )}
      {!greska && status.error && (
        <Text variant="muted" className="mt-3">
          {t.neMozeDaSePusti}
        </Text>
      )}
    </View>
  );
}
