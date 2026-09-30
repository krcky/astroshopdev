import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, SlideInDown, SlideInUp, useAnimatedStyle, ZoomIn } from 'react-native-reanimated';
import { Minus, Plus, Share } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { OblastIkona } from '@/components/oblast-ikona';
import { ZnakIkona } from '@/components/znak-ikona';
import { MoonDisc } from '@/components/moon-disc';
import { PricaPozadina, type Tece } from '@/components/prica/pozadina';
import { INDIGO, INK, LILA, MINUS, PLUS, SIVA, TON_MASTILO } from '@/components/prica/boje';
import {
  Broj, FazeMeseca, KrugOko, Pojava, Reci, TackiceOcene, Tocak, TrakeTona, UgaoAspekta, useOkret, Zraci,
} from '@/components/prica/crtezi';
import { boljeNegoJuce, fazaOsmina, type SlikaKljuc } from '@/lib/prica';
import type { PricaDana } from '@/lib/use-prica';
import { mnozina, TRANZIT } from '@/lib/mnozina';
import { cn } from '@/lib/utils';
import { tezina } from '@/theme/tipografija';
import { neutral } from '@/theme/tokens';

/** Prostor za sadrzaj slike: ispod trake sa napretkom i zaglavlja, iznad dugmeta "Podeli". */
export type OkvirSlike = { vrh: number; dno: number; sirina: number; visina: number; donjiUmetak: number };

export type SlikaProps = {
  p: PricaDana;
  tece: Tece;
  okvir: OkvirSlike;
  /** Prica u onboardingu: bez dugmadi saveta — dole je "Počinjemo" (`app/prica.tsx`). */
  uvod?: boolean;
  onPodeli: () => void;
  onProcitaj: () => void;
};

/**
 * Tipografija price — Plus Jakarta Sans iz aplikacije, u plakatskoj razmeri
 * (verzija C, Ivan 30.9.2026). Debljine idu kroz `tezina()`, kao svuda.
 */
export const TIP = {
  oznaka: cn('text-[11px] leading-[15px] uppercase tracking-[1.7px]', tezina('statOznaka')),
  naslovXL: cn('text-[68px] leading-[68px] tracking-[-3px]', tezina('display')),
  naslov: cn('text-[40px] leading-[44px] tracking-[-1.2px]', tezina('display')),
  naslovM: cn('text-[36px] leading-[40px] tracking-[-1px]', tezina('display')),
  recenica: cn('text-[30px] leading-[35px] tracking-[-0.7px]', tezina('display')),
  savet: cn('text-[44px] leading-[48px] tracking-[-1.6px]', tezina('display')),
  tekst: cn('text-[17px] leading-[24px]', tezina('reading')),
  sitno: cn('text-[13px] leading-[18px]', tezina('muted')),
} as const;

const BELA = neutral.white;
const BELA_85 = 'rgba(255,255,255,0.85)';
const MUTNO = neutral.inkMuted;

/** Da li je slika tamna (indigo) — za zaglavlje, traku napretka i statusnu traku. */
export function tamnaSlika(k: SlikaKljuc): boolean {
  return k === 'naslovna' || k === 'mesec';
}

/** Merenje prostora koji ostane za crtez (tocak, ugao aspekta). */
function useMera() {
  const [m, setM] = React.useState<{ w: number; h: number } | null>(null);
  const onLayout = React.useCallback((e: { nativeEvent: { layout: { width: number; height: number } } }) => {
    const { width, height } = e.nativeEvent.layout;
    setM((s) => (s && Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }));
  }, []);
  return [m, onLayout] as const;
}

/* ------------------------------------------------------------------------- *
 * 1 · Naslovna
 * ------------------------------------------------------------------------- */

export function SlikaNaslovna({ p, tece, okvir }: SlikaProps) {
  const [m, onLayout] = useMera();
  const n = p.naslovna.broj;
  return (
    <View style={{ flex: 1, backgroundColor: INDIGO }}>
      <PricaPozadina nijansa="noc" tece={tece} />
      <View style={{ position: 'absolute', top: okvir.vrh, bottom: okvir.dno, left: 24, right: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onLayout={onLayout}>
          {m && (
            <Tocak tetive={p.naslovna.tetive} levo={p.naslovna.levo} velicina={Math.min(m.w, m.h - 16, 340)} tece={tece} />
          )}
        </View>
        <View style={{ paddingTop: 12 }}>
          <Pojava kasni={400}>
            <Text className={TIP.oznaka} style={{ color: BELA_85 }}>{p.datumTekst}</Text>
          </Pojava>
          <View style={{ marginTop: 10 }}>
            <Reci tekst="Tvoj dan" kasni={520} korak={110} className={TIP.naslovXL} style={{ color: BELA }} />
          </View>
          {n > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: 18 }}>
              <TrakeTona tonovi={p.naslovna.tonovi} maxSirina={okvir.sirina * 0.42} />
              <Pojava kasni={2200} style={{ flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Broj do={n} kasni={2200} style={{ fontSize: 26, lineHeight: 30, color: BELA, letterSpacing: -0.5 }} />
                  <Text className={cn('text-[26px] leading-[30px] tracking-[-0.5px]', tezina('display'))} style={{ color: BELA }}>
                    {` ${mnozina(n, TRANZIT)}`}
                  </Text>
                </View>
                <Text className={TIP.sitno} style={{ color: BELA_85 }} numberOfLines={1} adjustsFontSizeToFit>
                  {p.naslovna.legenda}
                </Text>
              </Pojava>
            </View>
          ) : (
            <Pojava kasni={1200} style={{ marginTop: 16 }}>
              <Text className={TIP.tekst} style={{ color: BELA_85 }}>Danas nijedna planeta ne pravi aspekt sa tvojom kartom.</Text>
            </Pojava>
          )}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 2 · Tvoj dan
 * ------------------------------------------------------------------------- */

export function SlikaTvojDan({ p, tece, okvir }: SlikaProps) {
  const [m, onLayout] = useMera();
  const td = p.tvojDan!;
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <PricaPozadina nijansa="indigo" tece={tece} />
      <View style={{ position: 'absolute', top: okvir.vrh, bottom: okvir.dno, left: 24, right: 24 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} onLayout={onLayout}>
          {m && (
            <UgaoAspekta
              ugao={td.aspekt.angle}
              imeAspekta={td.aspekt.name}
              tranzitna={td.tranzitna}
              natalna={td.natalna}
              sirina={Math.min(m.w, ((m.h - 12) * 340) / 290)}
            />
          )}
        </View>
        <View style={{ paddingTop: 12 }}>
          <Pojava kasni={900}>
            <Text className={TIP.oznaka} style={{ color: MUTNO }}>{`Najvažnije danas · ${td.momenat}`}</Text>
          </Pojava>
          <View style={{ marginTop: 10 }}>
            <Reci tekst={td.naslov} kasni={1050} className={TIP.naslov} />
          </View>
          {!!td.sazetak && (
            <Pojava kasni={1700} style={{ marginTop: 14 }}>
              <Text className={TIP.tekst} style={{ color: MUTNO }}>{td.sazetak}</Text>
            </Pojava>
          )}
          {/* Ime tranzita uz naslov astrologa; bez teksta je ono samo naslov, pa se ne ponavlja. */}
          {td.ime !== td.naslov && (
            <Pojava kasni={2000} style={{ marginTop: 16, alignSelf: 'flex-start' }}>
              <View className="rounded-pill px-3 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.72)' }}>
                <Text className={cn('text-[14px] leading-[18px]', tezina('muted'))}>{td.ime}</Text>
              </View>
            </Pojava>
          )}
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 3 · Ocene (bez boje u pozadini — Ivan, 30.9.2026)
 * ------------------------------------------------------------------------- */

export function SlikaOcene({ p, okvir }: SlikaProps) {
  const o = p.ocene!;
  const naj = o.najbolja;
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <View style={{ position: 'absolute', top: okvir.vrh, bottom: okvir.dno, left: 24, right: 24, justifyContent: 'center' }}>
        {naj && (
          <Animated.View entering={ZoomIn.delay(200).duration(600).easing(Easing.out(Easing.back(1.6)))} style={{ marginBottom: 12, alignSelf: 'flex-start' }}>
            <OblastIkona oblast={naj.key} size={64} />
          </Animated.View>
        )}
        <Pojava kasni={450}>
          <Text className={TIP.oznaka} style={{ color: MUTNO }}>Najbolje ti ide</Text>
        </Pojava>
        {naj && (
          <View style={{ marginTop: 10 }}>
            <Reci tekst={naj.name} kasni={550} className={TIP.naslovM} />
          </View>
        )}
        <Pojava kasni={900} className={cn(CARD_SURFACE, 'mt-5 overflow-hidden')}>
          {o.redovi.map((r, i) => {
            const bolje = boljeNegoJuce(r.ocena, r.juce);
            return (
              <View
                key={r.key}
                accessible
                accessibilityLabel={`${r.name}, ${r.ocena} od 5, ${r.oznaka}${bolje ? ', bolje nego juče' : ''}`}
                className={cn('flex-row items-center gap-2.5 px-4 py-3', i > 0 && 'border-t border-border')}>
                <OblastIkona oblast={r.key} size={26} />
                <View style={{ flex: 1 }}>
                  <Text variant="default" className="text-[16px] leading-[20px]">{r.name}</Text>
                  {bolje && (
                    <Text className={cn('mt-0.5 text-[10px] leading-[13px] uppercase tracking-[1.2px]', tezina('statOznaka'))} style={{ color: TON_MASTILO.povoljno }}>
                      ↑ bolje nego juče
                    </Text>
                  )}
                </View>
                <TackiceOcene ocena={r.ocena} kasni={1200 + i * 240} />
                <View style={{ width: 30, alignItems: 'flex-end' }}>
                  <Text className={cn('text-[30px] leading-[32px] tracking-[-1px]', tezina('display'))}>{r.ocena}</Text>
                  {r.ocena === 5 && <KrugOko sirina={56} />}
                </View>
              </View>
            );
          })}
        </Pojava>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 4 · Ide ti / Koči te
 * ------------------------------------------------------------------------- */

function IdeKociBlok({ znak, natpis, tekst, ime, kasni }: {
  znak: 'plus' | 'minus'; natpis: string; tekst: string; ime: string; kasni: number;
}) {
  const Ikona = znak === 'plus' ? Plus : Minus;
  return (
    <View>
      <Pojava kasni={kasni} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View className="items-center justify-center rounded-pill bg-background" style={{ width: 40, height: 40 }}>
          <Ikona size={20} color={INK} strokeWidth={3} />
        </View>
        <Text className={cn('text-[20px] leading-[25px]', tezina('display'))}>{natpis}</Text>
      </Pojava>
      <View style={{ marginTop: 14 }}>
        <Reci tekst={tekst} kasni={kasni + 150} korak={55} className={TIP.recenica} />
      </View>
      <Pojava kasni={kasni + 800} style={{ marginTop: 10 }}>
        <Text className={TIP.sitno} style={{ color: INK, opacity: 0.6 }}>{ime}</Text>
      </Pojava>
    </View>
  );
}

export function SlikaIdeKoci({ p, okvir }: SlikaProps) {
  const { ide, koci } = p.ideKoci!;
  if (ide && koci) {
    return (
      <View style={{ flex: 1, backgroundColor: MINUS }}>
        <Animated.View entering={SlideInUp.duration(900).easing(Easing.bezier(0.7, 0, 0.2, 1))} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '52%', backgroundColor: PLUS }}>
          <View style={{ position: 'absolute', left: 24, right: 24, bottom: 32 }}>
            <IdeKociBlok znak="plus" natpis="Ide ti" tekst={ide.tekst} ime={ide.ime} kasni={500} />
          </View>
        </Animated.View>
        <View style={{ position: 'absolute', top: '52%', left: 24, right: 24, paddingTop: 32 }}>
          <IdeKociBlok znak="minus" natpis="Koči te" tekst={koci.tekst} ime={koci.ime} kasni={1400} />
        </View>
      </View>
    );
  }
  // Samo jedna strana ima tekst: cela slika u njenoj boji.
  const jedna = ide ?? koci!;
  return (
    <View style={{ flex: 1, backgroundColor: ide ? PLUS : MINUS }}>
      <View style={{ position: 'absolute', top: okvir.vrh, bottom: okvir.dno, left: 24, right: 24, justifyContent: 'center' }}>
        <IdeKociBlok znak={ide ? 'plus' : 'minus'} natpis={ide ? 'Ide ti' : 'Koči te'} tekst={jedna.tekst} ime={jedna.ime} kasni={400} />
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 5 · Mesec
 * ------------------------------------------------------------------------- */

export function SlikaMesec({ p, tece, okvir }: SlikaProps) {
  const m = p.mesec;
  const prostor = okvir.visina - okvir.vrh - okvir.dno;
  const mesec = Math.max(120, Math.min(190, prostor * 0.3));
  const okret = useOkret(tece, 240);
  const stil = useAnimatedStyle(() => ({ transform: [{ rotate: `${okret.get()}deg` }] }));
  return (
    <View style={{ flex: 1, backgroundColor: INDIGO }}>
      <PricaPozadina nijansa="noc" tece={tece} />
      <View style={{ position: 'absolute', top: okvir.vrh, bottom: okvir.dno, left: 24, right: 24, justifyContent: 'center' }}>
        <View style={{ height: mesec + 40 }}>
          <Animated.View
            entering={SlideInDown.duration(1400).easing(Easing.out(Easing.cubic))}
            style={{ position: 'absolute', top: 0, alignSelf: 'center', shadowColor: LILA, shadowOpacity: 0.55, shadowRadius: 34, shadowOffset: { width: 0, height: 0 } }}>
            <Animated.View style={stil}>
              <MoonDisc angle={m.faza.angle} size={mesec} />
            </Animated.View>
          </Animated.View>
          <Pojava kasni={700} style={{ position: 'absolute', left: 0, bottom: 0, flexDirection: 'row', alignItems: 'baseline' }}>
            <Broj do={m.faza.illuminationPct} kasni={800} style={{ fontSize: 96, lineHeight: 96, color: BELA, letterSpacing: -5 }} />
            <Text className={cn('text-[34px] leading-[36px]', tezina('display'))} style={{ color: BELA }}> %</Text>
          </Pojava>
        </View>
        <View style={{ marginTop: 18 }}>
          <FazeMeseca trenutna={fazaOsmina(m.faza.angle)} />
        </View>
        <Pojava kasni={1700} style={{ marginTop: 18 }}>
          <Text className={TIP.oznaka} style={{ color: BELA_85 }}>{`Mesec danas · ${m.sledeca}`}</Text>
        </Pojava>
        <View style={{ marginTop: 10 }}>
          {/* Znak ispred naslova (Ivan, 30.9.2026) — ne na Mesecu. */}
          <Reci
            tekst={m.naslov}
            kasni={1850}
            korak={80}
            className={cn('text-[32px] leading-[36px] tracking-[-0.9px]', tezina('display'))}
            style={{ color: BELA }}
            pre={(
              <Animated.View entering={ZoomIn.delay(1750).duration(500)} style={{ marginRight: 9 }}>
                <ZnakIkona znak={m.znak.key} element={m.znak.element} size={30} accessibilityLabel={m.znak.name} />
              </Animated.View>
            )}
          />
        </View>
        {m.zaTebe && (
          <Pojava kasni={2500} style={{ marginTop: 16, borderRadius: 12, padding: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' }}>
            <Text className={TIP.oznaka} style={{ color: BELA_85 }}>Za tebe</Text>
            <Text className={cn('mt-1 text-[17px] leading-[22px]', tezina('naslovUTekstu'))} style={{ color: BELA }}>{m.zaTebe.naslov}</Text>
            {!!m.zaTebe.tekst && (
              <Text className="mt-0.5 text-[15px] leading-[21px]" style={{ color: BELA_85 }}>{m.zaTebe.tekst}</Text>
            )}
          </Pojava>
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * 6 · Savet
 * ------------------------------------------------------------------------- */

/** Visina dugmadi na poslednjoj slici (crno dugme + "Pročitaj ceo tekst"). */
export const DUGMAD_SAVETA = 50 + 6 + 44;

export function SlikaSavet({ p, tece, okvir, uvod, onPodeli, onProcitaj }: SlikaProps) {
  const s = p.savet!;
  const dnoSadrzaja = okvir.donjiUmetak + 16 + DUGMAD_SAVETA + 12;
  return (
    <View style={{ flex: 1, backgroundColor: SIVA }}>
      <PricaPozadina nijansa="zlato" tece={tece} />
      {/* Savet je vertikalno centriran u krugu zraka (Ivan, 30.9.2026): isti prostor, ista sredina. */}
      <View style={{ position: 'absolute', top: okvir.vrh, bottom: dnoSadrzaja, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, bottom: 0, left: 0, right: 0 }}>
          <Zraci velicina={okvir.sirina * 1.64} tece={tece} />
        </View>
        <View style={{ paddingHorizontal: 24, alignItems: 'center' }}>
          <Pojava kasni={300}>
            <Text className={cn(TIP.oznaka, 'text-center')} style={{ color: MUTNO }}>Savet dana</Text>
          </Pojava>
          <View style={{ marginTop: 16 }}>
            <Reci tekst={s.tekst} kasni={450} korak={110} centar className={cn(TIP.savet, 'text-center')} />
          </View>
          <Pojava kasni={1200} style={{ marginTop: 18 }}>
            <Text className={cn(TIP.sitno, 'text-center')} style={{ color: MUTNO }}>{`Iz tumačenja tranzita ${s.ime}.`}</Text>
          </Pojava>
        </View>
      </View>
      {!uvod && (
      <Pojava kasni={1600} style={{ position: 'absolute', left: 24, right: 24, bottom: okvir.donjiUmetak + 16, gap: 6 }}>
        <Button onPress={onPodeli} accessibilityLabel="Podeli svoj dan">
          <View className="flex-row items-center gap-2">
            <Share size={19} color={BELA} strokeWidth={2} />
            <Text>Podeli svoj dan</Text>
          </View>
        </Button>
        <Pressable onPress={onProcitaj} accessibilityRole="button" className="h-11 items-center justify-center active:opacity-60">
          <Text className={cn('text-[16px] leading-[20px]', tezina('dugme'))}>Pročitaj ceo tekst</Text>
        </Pressable>
      </Pojava>
      )}
    </View>
  );
}

export const SLIKE: Record<SlikaKljuc, (props: SlikaProps) => React.ReactElement> = {
  naslovna: SlikaNaslovna,
  tvojDan: SlikaTvojDan,
  ocene: SlikaOcene,
  ideKoci: SlikaIdeKoci,
  mesec: SlikaMesec,
  savet: SlikaSavet,
};
