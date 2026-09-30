import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import Svg, { Circle } from 'react-native-svg';
import { Clapperboard, Share, X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { IMA_VIDEO } from '@/components/prica/platno-videa';
import { STARI_IOS } from '@/lib/platform';
import { dayKey } from '@/lib/transits';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useDanas } from '@/store/danas';
import { useVideoDana, useVideoPrice } from '@/store/video-price';
import { tezina } from '@/theme/tipografija';
import { brand, neutral } from '@/theme/tokens';

/**
 * TRAKA VIDEA iznad tabova (Ivan, 30.9.2026): iOS 26 "bottom accessory", kao mini-plejer
 * u Apple Music-u — vidi se na svih pet tabova. Dok se video pravi: napredak; kad je
 * gotov: "Podeli". Dodir na traku otvara list sa videom (`app/video-price.tsx`).
 * Nestaje kad se video podeli ili skloni (X), i sutra.
 *
 * Na iOS-u < 26 i Androidu sistem je ne crta; tamo do videa vode obavestenje i
 * "Podeli" u prici.
 */

/** Koliko traka zauzme iznad trake tabova (sa razmakom) — za prostor na dnu ekrana (`screen.tsx`). */
export const TRAKA_VIDEA_VISINA = 56;

/** Video danas za ovaj nalog, ako traka treba da stoji (samo iOS 26 je crta). */
export function useTrakaVidea() {
  const uid = useAuthStore((s) => s.user?.id ?? null);
  const dan = dayKey(useDanas());
  const v = useVideoDana(uid, dan);
  if (!IMA_VIDEO || STARI_IOS || !v) return null;
  if (v.stanje === 'pravi') return v;
  return v.sklonjen ? null : v;
}

/** Sistemski meni za deljenje; traka posle toga nestaje (video ostaje do kraja dana). */
export async function podeliVideo(uri: string) {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'video/mp4', UTI: 'public.mpeg-4', dialogTitle: 'Podeli svoj dan' });
    }
    useVideoPrice.getState().skloni();
  } catch { /* otkazano deljenje */ }
}

/** Procenat kao u aplikaciji: "42 %". */
export const procenat = (x: number) => `${Math.round(Math.max(0, Math.min(1, x)) * 100)} %`;

/** Krug napretka (kao traka price, samo okrugao). */
export function KrugNapretka({ napredak, velicina = 30, boja = brand.indigo, podloga = neutral.fillStrong }: {
  napredak: number; velicina?: number; boja?: string; podloga?: string;
}) {
  const r = velicina / 2 - 2;
  const O = 2 * Math.PI * r;
  return (
    <Svg width={velicina} height={velicina}>
      <Circle cx={velicina / 2} cy={velicina / 2} r={r} stroke={podloga} strokeWidth={3} fill="none" />
      <Circle
        cx={velicina / 2}
        cy={velicina / 2}
        r={r}
        stroke={boja}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={[O, O]}
        strokeDashoffset={O * (1 - Math.max(0.03, napredak))}
        transform={`rotate(-90 ${velicina / 2} ${velicina / 2})`}
      />
    </Svg>
  );
}

export function VideoTraka() {
  const v = useTrakaVidea();
  return v ? <VideoTrakaSadrzaj v={v} /> : null;
}

/** Sadrzaj trake (sistem crta staklenu kapsulu oko njega). Izdvojen i za `/dev-video`. */
export function VideoTrakaSadrzaj({ v }: { v: NonNullable<ReturnType<typeof useVideoDana>> }) {
  const pravi = v.stanje === 'pravi';
  const gotov = v.stanje === 'gotov';
  const naslov = pravi ? 'Pravimo tvoj video' : gotov ? 'Tvoj video je spreman' : 'Video nije uspeo';
  const podnaslov = pravi ? `Priča dana · ${procenat(v.napredak)}` : gotov ? 'Priča dana' : 'Pokušaj ponovo iz priče.';
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 6 }}>
      <Pressable
        onPress={() => router.push('/video-price')}
        accessibilityRole="button"
        accessibilityLabel={`${naslov}. ${podnaslov}`}
        className="flex-1 flex-row items-center gap-3 active:opacity-60"
        style={{ minHeight: 44 }}>
        {pravi ? <KrugNapretka napredak={v.napredak} velicina={28} /> : <Clapperboard size={22} color={neutral.ink} strokeWidth={1.8} />}
        <View style={{ flex: 1 }}>
          <Text className={cn('text-[15px] leading-[19px]', tezina('row'))} numberOfLines={1}>{naslov}</Text>
          <Text className="text-[12px] leading-[16px] text-muted-foreground" numberOfLines={1}>{podnaslov}</Text>
        </View>
      </Pressable>
      {gotov && v.uri && (
        <Pressable
          onPress={() => podeliVideo(v.uri!)}
          accessibilityRole="button"
          accessibilityLabel="Podeli video"
          hitSlop={6}
          className="h-11 w-11 items-center justify-center active:opacity-60">
          <Share size={21} color={neutral.ink} strokeWidth={2} />
        </Pressable>
      )}
      {!pravi && (
        <Pressable
          onPress={() => useVideoPrice.getState().skloni()}
          accessibilityRole="button"
          accessibilityLabel="Skloni traku"
          hitSlop={6}
          className="h-11 w-11 items-center justify-center active:opacity-60">
          <X size={19} color={neutral.inkMuted} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
