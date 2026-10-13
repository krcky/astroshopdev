import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Heart, HeartCrack, Plus } from 'lucide-react-native';

import { useMojZnak } from '@/components/ostalo/moj-znak';
import { SheetScroll } from '@/components/sheet';
import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { ZnakIkona } from '@/components/znak-ikona';
import { ocenaZnakova, type OcenaPara } from '@/lib/uporedni';
import { SIGNS } from '@/lib/zodiac';
import { cn } from '@/lib/utils';
import { DEV_TOOLS_ENABLED } from '@/store/dev';
import { useT } from '@/i18n';
import { brand, neutral } from '@/theme/tokens';

const KRUG = 56;

/** Ikona ocene: srce (povoljno), srce u obrisu (manje povoljno), slomljeno srce (nepovoljno). */
function IkonaOcene({ ocena }: { ocena: OcenaPara }) {
  if (ocena === 'nepovoljno') return <HeartCrack size={26} color={brand.indigo} strokeWidth={2} />;
  if (ocena === 'manje') return <Heart size={26} color={brand.indigo} strokeWidth={2} />;
  return <Heart size={26} color={brand.indigo} fill={brand.indigo} strokeWidth={2} />;
}

/**
 * Uporedni horoskop (Ivan, 14.10.2026): list odozdo sa kartice na tabu "Ostalo". Levo je UVEK korisnikov znak
 * (tekstovi astrologa su usmereni, "ti" je prvi znak), a znak druge osobe se bira — bez datuma rodjenja i bez
 * dodavanja osobe. Ocena je racun (`lib/uporedni.ts`, tabela sa sajta). TEKSTOVA (Ljubav / Prijateljstvo / Posao,
 * 144 usmerena para) JOS NEMA u aplikaciji: do uvoza u bazu ekran to iskreno kaze (`tekstoviNema`).
 */
export default function Uporedni() {
  const t = useT();
  const te = t.ostalo.uporedniEkran;
  const izProfila = useMojZnak();
  // Samo za razvoj: `?dev=leo` zadaje moj znak bez profila (`/dev-ostalo`, provera ekrana bez naloga).
  const { dev } = useLocalSearchParams<{ dev?: string }>();
  const moj = (DEV_TOOLS_ENABLED && dev ? SIGNS.find((s) => s.key === dev) : null) ?? izProfila;
  const [izabran, setIzabran] = React.useState<string | null>(null);
  const drugi = SIGNS.find((s) => s.key === izabran) ?? null;
  const ocena = moj && drugi ? ocenaZnakova(moj.key, drugi.key) : null;

  return (
    <SheetScroll siva>
      <View className="px-5 pt-8">
        <Text variant="naslovLista">{te.naslov}</Text>
        <Text variant="muted" className="mt-2">{te.objasnjenje}</Text>

        {!moj ? (
          <View className={cn(CARD_SURFACE, 'mt-5 p-4')}>
            <Text variant="body" className="text-foreground">{te.bezTvogZnaka}</Text>
          </View>
        ) : (
          <>
            <View className="mt-6 flex-row items-start justify-center gap-4">
              <View className="w-24 items-center gap-2">
                <ZnakIkona znak={moj.key} element={moj.element} size={KRUG} accessibilityLabel={moj.name} />
                <Text variant="caption" className="text-center text-foreground">{te.tvojZnak}</Text>
              </View>
              <View
                className="mt-3 items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${brand.indigo}1A` }}>
                <Heart size={15} color={brand.indigo} fill={brand.indigo} strokeWidth={0} />
              </View>
              <View className="w-24 items-center gap-2">
                {drugi ? (
                  <ZnakIkona znak={drugi.key} element={drugi.element} size={KRUG} accessibilityLabel={te.izabranA11y(drugi.name)} />
                ) : (
                  <View
                    className="items-center justify-center"
                    style={{ width: KRUG, height: KRUG, borderRadius: KRUG / 2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: neutral.inkSubtle }}>
                    <Plus size={22} color={brand.indigo} strokeWidth={2.4} />
                  </View>
                )}
                <Text variant="caption" className="text-center text-foreground">{drugi ? drugi.name : t.ostalo.uporedni.izaberi}</Text>
              </View>
            </View>

            {ocena ? (
              <View className={cn(CARD_SURFACE, 'mt-6 flex-row items-center gap-3 p-4')}>
                <IkonaOcene ocena={ocena} />
                <View className="flex-1">
                  <Text variant="h3">{te.ocena[ocena].naslov}</Text>
                  <Text variant="muted">{te.ocena[ocena].opis}</Text>
                </View>
              </View>
            ) : null}
            {ocena ? <Text variant="muted" className="mt-3">{te.tekstoviNema}</Text> : null}

            <Text variant="oznaka" className="mb-3 mt-8">{te.izaberi}</Text>
            <View className="flex-row flex-wrap">
              {SIGNS.map((s) => {
                const aktivan = s.key === izabran;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setIzabran(aktivan ? null : s.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: aktivan }}
                    accessibilityLabel={aktivan ? te.izabranA11y(s.name) : s.name}
                    className="w-1/4 items-center gap-1 py-2 active:opacity-80">
                    <View
                      style={{ padding: 3, borderRadius: 26, borderWidth: 2, borderColor: aktivan ? brand.indigo : 'transparent' }}>
                      <ZnakIkona znak={s.key} element={s.element} size={44} />
                    </View>
                    <Text variant="caption" numberOfLines={1} className="text-center text-foreground">{s.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </View>
    </SheetScroll>
  );
}
