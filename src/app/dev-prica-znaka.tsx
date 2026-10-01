import * as React from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { KARTICA } from '@/components/prica/kartica';
import { KarticaZnaka } from '@/components/prica-znaka/kartica';
import { SLIKE_PRICE_ZNAKA } from '@/components/prica-znaka/slike';
import type { OkvirSlike } from '@/components/prica/slajdovi';
import { pricaZnaka, SLIKE_ZNAKA, type SlikaZnaka } from '@/lib/prica-znaka';
import { SIGNS } from '@/lib/zodiac';
import { cn } from '@/lib/utils';
import { DEV_TOOLS_ENABLED } from '@/store/dev';
import { neutral } from '@/theme/tokens';

/** Kartice u pola velicine: dve u redu. */
const SKALA = 0.5;

/**
 * SAMO ZA RAZVOJ: svih devet KARTICA ZA DELJENJE price o znaku (pravilo 25) za izabrani znak, u
 * konacnom stanju (bez sata) — da se vidi da sve staje u 360 × 640 i u sigurnu zonu Instagrama.
 * Otvara se direktno: /dev-prica-znaka (ili ?znak=gemini). U release bildu vodi na pocetak.
 * `&slika=ljubav` = JEDNA slika preko celog ekrana, u okviru kao u plejeru i u konacnom stanju, sa
 * crvenim linijama na granicama okvira (`&uredjaj=se` emulira manji ekran). `?sve=se` (ili `?sve=1`
 * za pravi ekran) pusti svih 12 × 9 slika redom (`&od=64` od 64. slike), za snimak ekrana.
 */
export default function DevPricaZnaka() {
  const insets = useSafeAreaInsets();
  const { znak: izAdrese, slika, uredjaj, sve, od } = useLocalSearchParams<{ znak?: string; slika?: string; uredjaj?: string; sve?: string; od?: string }>();
  const [znak, setZnak] = React.useState(izAdrese && SIGNS.some((s) => s.key === izAdrese) ? izAdrese : 'aries');
  React.useEffect(() => { if (izAdrese && SIGNS.some((s) => s.key === izAdrese)) setZnak(izAdrese); }, [izAdrese]);
  const p = React.useMemo(() => pricaZnaka(znak, 14, ['gemini']), [znak]);
  if (!DEV_TOOLS_ENABLED) return <Redirect href="/" />;
  if (sve) return <SveSlike uredjaj={UREDJAJI[sve] ? sve : undefined} od={Math.max(0, Number(od ?? 1) - 1) || 0} />;
  if (slika && (SLIKE_ZNAKA as readonly string[]).includes(slika)) return <CelaSlika p={p} k={slika as SlikaZnaka} uredjaj={uredjaj} />;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: neutral.grouped }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 12 }}>
      <View className="flex-row flex-wrap gap-1.5">
        {SIGNS.map((s) => (
          <Pressable key={s.key} onPress={() => setZnak(s.key)} accessibilityRole="button"
            className={cn('rounded-pill px-2.5 py-1', s.key === znak ? 'bg-foreground' : 'bg-card')}>
            <Text className="text-[13px]" style={{ color: s.key === znak ? neutral.white : neutral.ink }}>{s.name}</Text>
          </Pressable>
        ))}
      </View>
      <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
        {SLIKE_ZNAKA.map((k) => (
          <View key={k} style={{ width: KARTICA.w * SKALA, height: KARTICA.h * SKALA, overflow: 'hidden', borderRadius: 8 }}>
            <View style={{ width: KARTICA.w, height: KARTICA.h, transform: [{ translateX: -KARTICA.w * (1 - SKALA) / 2 }, { translateY: -KARTICA.h * (1 - SKALA) / 2 }, { scale: SKALA }] }}>
              <KarticaZnaka p={p} k={k} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/** Ekrani za proveru: velicina i umeci (vrh, dno) — slika zavisi SAMO od okvira, pa je emulacija verna. */
const UREDJAJI: Record<string, { w: number; h: number; vrh: number; dno: number }> = {
  se: { w: 375, h: 667, vrh: 20, dno: 0 },
  mini: { w: 375, h: 812, vrh: 50, dno: 34 },
  e: { w: 390, h: 844, vrh: 47, dno: 34 },
  max: { w: 440, h: 956, vrh: 62, dno: 34 },
};

/**
 * Slika u okviru plejera (`components/prica/plejer.tsx`: vrh = umetak + 64, dno = umetak + 76), sa
 * crvenim linijama na granicama. `uredjaj` = emuliran ekran (umanjen ako je veci od pravog).
 */
function CelaSlika({ p, k, uredjaj, natpis }: { p: ReturnType<typeof pricaZnaka>; k: SlikaZnaka; uredjaj?: string; natpis?: string }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const u = uredjaj ? UREDJAJI[uredjaj] : undefined;
  const W = u?.w ?? width;
  const H = u?.h ?? height;
  const okvir: OkvirSlike = { vrh: (u?.vrh ?? insets.top) + 64, dno: (u?.dno ?? insets.bottom) + 76, sirina: W, visina: H, donjiUmetak: u?.dno ?? insets.bottom };
  const skala = Math.min(1, width / W, height / H);
  const Slika = SLIKE_PRICE_ZNAKA[k];
  return (
    <View style={{ flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: W, height: H, overflow: 'hidden', backgroundColor: neutral.grouped, transform: [{ scale: skala }] }}>
        <Slika p={p} okvir={okvir} onPodeli={() => {}} onProcitaj={() => {}} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: okvir.vrh, height: 1, backgroundColor: 'red' }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: okvir.dno, height: 1, backgroundColor: 'red' }} />
      </View>
      {natpis ? <Text style={{ position: 'absolute', left: 6, bottom: 4, fontSize: 11, color: 'red' }}>{natpis}</Text> : null}
    </View>
  );
}

/** `?sve=se` — svih 12 × 9 slika redom, 1,5 s po slici (za snimak ekrana); natpis kaze koja je. */
function SveSlike({ uredjaj, od = 0 }: { uredjaj?: string; od?: number }) {
  const [i, setI] = React.useState(od);
  const ukupno = SIGNS.length * SLIKE_ZNAKA.length;
  React.useEffect(() => {
    if (i >= ukupno - 1) return;
    const t = setTimeout(() => setI(i + 1), 1500);
    return () => clearTimeout(t);
  }, [i, ukupno]);
  const znak = SIGNS[Math.floor(i / SLIKE_ZNAKA.length)].key;
  const k = SLIKE_ZNAKA[i % SLIKE_ZNAKA.length];
  const p = React.useMemo(() => pricaZnaka(znak, 14, ['gemini']), [znak]);
  return <CelaSlika key={`${znak}-${k}`} p={p} k={k} uredjaj={uredjaj} natpis={`${i + 1}/${ukupno} ${znak} ${k}`} />;
}
