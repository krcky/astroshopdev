import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { NativeStackHeaderItem } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { ELEMENT_BOJA } from '@/components/znak-ikona';
import { useT } from '@/i18n';
import { ZNAK_OBLIK } from '@/lib/znak-oblici';
import {
  PODZNAK_U_KRUGU, ZNAK_U_KRUGU, postavkaZnaka, rasporedAvatara, znakAvatar, type Krug,
} from '@/lib/znak-avatar';
import type { ZodiacSign } from '@/lib/zodiac';
import { useResolvedProfile } from '@/store/profile';
import { brand, neutral } from '@/theme/tokens';

/**
 * Avatar profila (Ivan, 13.10.2026), umesto ikonice osobe gore desno: znak SUNCA u krugu boje
 * elementa, a dole desno mali beo krug sa indigo znakom PODZNAKA (Ascendenta). Geometrija i
 * centriranje znaka su u `lib/znak-avatar.ts` — znak ide u sredinu kruga po stvarnim granicama
 * putanje, a veliki krug u sredinu balona.
 *
 * Bez tacnog vremena rodjenja nema podznaka (pravilo 5), pa mali krug ne postoji. Bez pouzdane
 * zone (rodjenje na granici znaka, pravilo 4) ne tvrdimo ni znak Sunca: tada je stara ikonica osobe.
 */

export type Znaci = { sunce: ZodiacSign; podznak: ZodiacSign | null };

function useZnaci(): Znaci | null {
  const r = useResolvedProfile();
  return React.useMemo(() => {
    if (!r || r.zoneUnreliable) return null;
    const sunce = r.chart.planets.find((p) => p.key === 'sun')?.position.sign;
    if (!sunce) return null;
    return { sunce, podznak: r.timeUnknown ? null : r.chart.ascendantSign.sign };
  }, [r]);
}

/** `translate(krug) scale(r) translate(-sredina znaka)` — znak ide oko svoje sredine, ne oko ugla ikonice. */
function postavka(znak: string, krug: Krug, udeo: number): string {
  const p = postavkaZnaka(znak, krug, udeo);
  const z = znakAvatar(znak);
  return `translate(${p.translateX} ${p.translateY}) scale(${p.razmera}) translate(${-z.cx} ${-z.cy})`;
}

function Znak({ znak, krug, udeo, boja }: { znak: ZodiacSign; krug: Krug; udeo: number; boja: string }) {
  const o = ZNAK_OBLIK[znak.key];
  return (
    <G transform={postavka(znak.key, krug, udeo)}>
      <Path d={o.d} fill={boja} fillRule={o.evenodd ? 'evenodd' : 'nonzero'} />
    </G>
  );
}

/** Mali beo krug sa indigo znakom podznaka, precnika `d` (u svom SVG-u, sa 1 pt vazduha za obrub). */
function PodznakKrug({ znak, d }: { znak: ZodiacSign; d: number }) {
  const krug: Krug = { cx: d / 2, cy: d / 2, r: d / 2 - 1 };
  return (
    <Svg width={d} height={d} viewBox={`0 0 ${d} ${d}`}>
      <Circle cx={krug.cx} cy={krug.cy} r={krug.r} fill={neutral.white} stroke="rgba(0,0,0,0.14)" strokeWidth={0.6} />
      <Znak znak={znak} krug={krug} udeo={PODZNAK_U_KRUGU} boja={brand.indigo} />
    </Svg>
  );
}

/**
 * Avatar u kvadratu strane `size` (pt), mali krug UNUTAR kvadrata (dole desno) — za staklene krugove
 * Androida i iOS-a pre 26. `uzorak` zadaje znake rucno (razvojni ekran `/dev-avatar`); bez njega
 * se citaju iz profila. `bezPodznaka`: samo veliki krug (kad mali crta stavka trake van njega).
 */
export function ProfilAvatar({ size, uzorak, bezPodznaka = false }: { size: number; uzorak?: Znaci; bezPodznaka?: boolean }) {
  const izProfila = useZnaci();
  const znaci = uzorak ?? izProfila;
  if (!znaci) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <UserRound size={Math.round(size * 0.66)} color={neutral.ink} />
      </View>
    );
  }
  const a = rasporedAvatara(size);
  const d = a.podznak.r * 2 + 2;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={a.sunce.cx} cy={a.sunce.cy} r={a.sunce.r} fill={ELEMENT_BOJA[znaci.sunce.element]} />
        <Znak znak={znaci.sunce} krug={a.sunce} udeo={ZNAK_U_KRUGU} boja={neutral.white} />
      </Svg>
      {znaci.podznak && !bezPodznaka && (
        <View style={{ position: 'absolute', left: a.podznak.cx - d / 2, top: a.podznak.cy - d / 2 }}>
          <PodznakKrug znak={znaci.podznak} d={d} />
        </View>
      )}
    </View>
  );
}

/** Opis za citac ekrana: "Profil. Sunce: Lav. Podznak: Ribe." (bez podznaka samo Sunce). */
export function useProfilOpis(): string {
  const t = useT();
  const znaci = useZnaci();
  return znaci ? t.profil.avatarOpis(znaci.sunce.name, znaci.podznak?.name) : t.profil.dugmeProfil;
}

export const otvoriProfil = () => router.push('/profile');

/**
 * Strana avatara kad je stavka native trake (iOS 26): sistem oko njega crta staklo. Do 36 pt balon
 * ostaje KRUG od 44 pt; sa 40 pt sistem dodaje po 4 pt sa strane i balon postaje ovalan.
 */
export const AVATAR_U_TRACI = 36;

/**
 * Stavka je `custom` sa nasim avatarom, a balon crta SISTEM (`hidesSharedBackground` ostaje ugasen) — isto
 * staklo i odziv na dodir kao kalendar uz njega. PROBANO I ODBACENO (13.10.2026, simulator iOS 26.5): mali
 * krug koji VIRI van balona. (1) Sistemski balon isece sve van okvira stavke (krug je bio odsecen ravno).
 * (2) Sopstveno staklo u vecem okviru sa `hidesSharedBackground: true` radi samo posle Fast Refresh-a; na
 * hladnom startu se stavka postavlja 22 pt nize i van desne ivice ekrana (isto sa SwiftUI staklom i sa
 * `GlassView`), pa se na to ne oslanjati. Zato mali krug stoji na rubu velikog kruga, unutar balona.
 */
function ProfilDugme({ uzorak }: { uzorak?: Znaci }) {
  const opis = useProfilOpis();
  return (
    <Pressable
      onPress={otvoriProfil}
      accessibilityRole="button"
      accessibilityLabel={opis}
      hitSlop={6}
      style={{ width: AVATAR_U_TRACI, height: AVATAR_U_TRACI }}>
      <ProfilAvatar size={AVATAR_U_TRACI} uzorak={uzorak} />
    </Pressable>
  );
}

/** Stavke za `unstable_headerRightItems` (iOS 26): avatar u sistemskom balonu. */
export function profilStavka(uzorak?: Znaci): NativeStackHeaderItem[] {
  return [{ type: 'custom', element: <ProfilDugme uzorak={uzorak} />, hidesSharedBackground: false }];
}
