import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChevronRight, Info, Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { CARD_SURFACE } from '@/components/ui/card';
import { ZnakIkona } from '@/components/znak-ikona';
import { KucaBroj } from '@/components/kuca-broj';
import { IkonaTacke } from '@/components/planeta-ikona';
import { AspektIkona, imaAspekt } from '@/components/aspekt-ikona';
import { dnoKruga } from '@/components/natal-wheel';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { cn } from '@/lib/utils';
import type { SignPosition, ZodiacSign } from '@/lib/zodiac';
import { neutral } from '@/theme/tokens';
import { PREMIUM } from '@/components/zakljucano';
import { Balon, Prsten } from '@/components/prica/ulaz';
import { tr, useT } from '@/i18n';

/**
 * Delovi liste ispod tocka — zajednicki za natalnu kartu (tab "Ti") i
 * "Trenutno na nebu" (Ivan, 28.9.2026: nebo stilizovati kao natalnu kartu).
 * Oba ekrana prikazuju iste podatke (znak, stepen, kucu, retrogradnost,
 * aspekte) i moraju da izgledaju isto — inace korisnik pomisli da gleda dve
 * razlicite vrste podatka. Zato su ovde, a ne kopirani u oba ekrana.
 */


/**
 * Kolone liste planeta (Ivan, 28.9.2026): znakovi poravnati LEVO u koloni
 * stalne sirine (najduze ime: "Škorpija", "Blizanci", "Vodolija"), kuca DESNO.
 * Red bez kuce (ASC, MC, nepoznato vreme) cuva njeno mesto.
 */
export const ZNAK_KOLONA = 84;
export const KUCA_KOLONA = 30;

/** Redosled liste (Ivan, 28.9.2026): Sunce pa Mesec, ostale planete istim redom kao u karti. */
export function redosledPlaneta<T extends { key: string }>(planete: T[]): T[] {
  const prvi = ['sun', 'moon'];
  return [
    ...prvi.map((k) => planete.find((p) => p.key === k)).filter((p): p is T => !!p),
    ...planete.filter((p) => !prvi.includes(p.key)),
  ];
}

/** "15°23'" — stepen i minut u znaku, isti brojevi kao na tocku. */
export const stepenMinut = (pos: SignPosition) => `${pos.deg}°${String(pos.min).padStart(2, '0')}'`;

/** "1,4°" — decimalni zarez (po jeziku, iz recnika). */
export const orbis = (x: number) => tr().karta.stepenDecimalno(x);

/** Ikonica tacke — ista bela kao u zaglavlju tumacenja (`IkonaTacke`). */
export function Tacka({ tacka, glyph, size }: { tacka: string; glyph: string; size: number }) {
  return <IkonaTacke tacka={{ key: tacka, glyph }} size={size} />;
}

/** Kolona znaka: ikonica i ime. `znak = null` = nepoznat (Mesec bez vremena rodjenja). */
export function ZnakKolona({ znak, muted }: { znak: ZodiacSign | null; muted?: boolean }) {
  return (
    <View className="flex-row items-center gap-1" style={{ width: ZNAK_KOLONA, opacity: muted ? 0.5 : 1 }}>
      {znak ? (
        <>
          <ZnakIkona znak={znak.key} element={znak.element} size={18} />
          <Text variant="muted" className="flex-shrink text-foreground" numberOfLines={1}>{znak.name}</Text>
        </>
      ) : (
        <Text variant="muted">?</Text>
      )}
    </View>
  );
}

/**
 * Red tacke koji nigde ne vodi — "Trenutno na nebu" nema tumacenja. Isti
 * raspored kao red planete na natalnoj karti, samo bez strelice: ikonica, ime
 * i stepen, pa znak i kuca u kolonama.
 */
export function TackaRed({ tacka, glyph, ime, pos, retro, kuca, last }: {
  tacka: string;
  glyph: string;
  ime: string;
  pos: SignPosition;
  retro?: boolean;
  /** Broj kuce; bez njega kolona ostaje prazna (ASC, MC). */
  kuca?: number;
  last?: boolean;
}) {
  const t = useT();
  return (
    <View
      accessible
      accessibilityLabel={t.karta.lista.tackaA11y(ime, pos.deg, pos.min, pos.sign.name, !!retro, kuca)}
      className={cn('flex-row items-center py-3 pl-4 pr-4', !last && 'border-b border-border')}>
      <Tacka tacka={tacka} glyph={glyph} size={28} />
      <View className="ml-3 mr-2 flex-1 flex-row flex-wrap items-baseline gap-x-1">
        <Text variant="row" numberOfLines={1}>{ime}</Text>
        <Text variant="caption">{stepenMinut(pos)}{retro ? ` ${t.karta.retro}` : ''}</Text>
      </View>
      <ZnakKolona znak={pos.sign} />
      <View className="items-end" style={{ width: KUCA_KOLONA }}>
        {kuca ? <KucaBroj kuca={kuca} /> : null}
      </View>
    </View>
  );
}

/**
 * Slike tela za veliku trojku (Ivan, 28.9.2026): Sunce i Mesec kao na karticama
 * tranzita (`assets/images/planete/`); PODZNAK je ZEMLJA — Ascendent je tacka na
 * istocnom horizontu, jedina od tri koja zavisi od mesta. Zemlja je
 * NASA "The Earth seen from Apollo 17" (AS17-148-22727, 1972, javno dobro),
 * isecena u krug iste razmere kao Sunce.
 */
const SLIKA_TELA = {
  sun: require('../../assets/images/planete/sun.png'),
  moon: require('../../assets/images/planete/moon.png'),
  earth: require('../../assets/images/planete/earth.png'),
} as const;

/** Precnik slike tela i znaka dole desno (sa belim prstenom), kao na Ivanovom primeru. */
const TELO = 58;
const ZNACKA = 28;
const PRSTEN = 3;
/** Pola od koliko znak viri desno od slike tela. */
const VIRI = Math.round((ZNACKA * 0.45) / 2);
/** Prsten price oko Sunca: potez 3 + razmak 2,5 od slike, kao oko planete "Tvog dana". */
const PRSTEN_RAZMAK = 5.5;
/** Koliko balon "Tvoj znak" ulazi u plocicu odozdo: njena donja margina (`py-4`) — tu su tackice. */
export const BALON_PREKO = 16;
/** Visina balona sa tackicama (5 + 1 + 8 + 2 + 29), da red ispod trojke ne ode pod njega. */
export const BALON_VISINA = 45;

/**
 * Jedna plocica velike trojke: slika tela, dole desno mali znak u belom prstenu,
 * oznaka, ime znaka. `znak = null` = nepoznat (znak pitanja umesto znaka).
 * Za sada samo na "Ti" — Nebo je bez trojke (Ivan, 28.9.2026: "samo lista").
 */
export function TrojkaPlocica({ oznaka, slika, znak, ime, onPress, prica }: {
  oznaka: string;
  slika: keyof typeof SLIKA_TELA;
  znak: ZodiacSign | null;
  /** Umesto imena znaka ("Blizanci ili Rak"). */
  ime?: string;
  onPress?: () => void;
  /**
   * Ulaz u PRICU O ZNAKU (pravilo 25, samo Sunce na tabu "Ti"): isti prsten i balon kao ulaz u dnevnu
   * pricu. Dok prica nije pogledana, prsten se puni i balon iskace pri svakom fokusu taba.
   */
  prica?: { pogledana: boolean; natpis: string };
}) {
  const t = useT();
  const tekst = ime ?? (znak ? znak.name : t.karta.lista.nepoznat);
  const nepoznat = !znak && !ime;
  const [ciklus, setCiklus] = React.useState(0);
  const pogledana = prica?.pogledana ?? true;
  useFocusEffect(React.useCallback(() => {
    if (!pogledana) setCiklus((c) => c + 1);
  }, [pogledana]));
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={t.karta.lista.trojkaA11y(oznaka, tekst, prica ? prica.natpis : null, !!onPress)}
      // Obicna bela kartica (Ivan, 28.9.2026: Liquid Glass probano pa vraceno).
      className={cn(CARD_SURFACE, 'flex-1 items-center px-2 py-4 active:opacity-80')}
      style={prica ? { zIndex: 1 } : undefined}>
      {/* Pomereno ulevo za pola koliko znak viri desno: slika i znak su centrirani kao par. */}
      <View style={{ width: TELO, height: TELO, marginLeft: -VIRI }}>
        {prica && (
          <View pointerEvents="none" style={{ position: 'absolute', left: -PRSTEN_RAZMAK, top: -PRSTEN_RAZMAK, width: TELO + 2 * PRSTEN_RAZMAK, height: TELO + 2 * PRSTEN_RAZMAK }}>
            <Prsten key={pogledana ? 'miran' : `puni-${ciklus}`} puni={!pogledana} D={TELO + 2 * PRSTEN_RAZMAK} />
          </View>
        )}
        <Image source={SLIKA_TELA[slika]} style={{ width: TELO, height: TELO, opacity: nepoznat ? 0.5 : 1 }}
          resizeMode="contain" accessibilityIgnoresInvertColors />
        <View
          className="absolute items-center justify-center rounded-full bg-background"
          style={{ width: ZNACKA + 2 * PRSTEN, height: ZNACKA + 2 * PRSTEN, right: -2 * VIRI, bottom: -PRSTEN }}>
          {znak ? (
            <ZnakIkona znak={znak.key} element={znak.element} size={ZNACKA} />
          ) : (
            <View className="items-center justify-center rounded-full bg-fill-strong" style={{ width: ZNACKA, height: ZNACKA }}>
              <Text variant="caption" className="text-foreground">?</Text>
            </View>
          )}
        </View>
      </View>
      <Text variant="oznaka" className="mt-3">{oznaka}</Text>
      <Text variant="row" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}
        className={cn('mt-0.5 text-center', nepoznat && 'text-muted-foreground')}>
        {tekst}
      </Text>
      {/* Balon ispod imena, kao beleska na Instagramu (tackice ka Suncu): u toku, sa negativnom donjom
          marginom — ne menja visinu plocice, tackice su u njenoj donjoj margini, sam balon visi ispod nje.
          (`top: '100%'` u apsolutnom polozaju je stavio balon preko imena znaka — simulator, 1.10.2026.) */}
      {prica && (
        <View pointerEvents="none" style={{ alignItems: 'center', marginTop: 2, marginBottom: -(BALON_VISINA + 2) }}>
          <Balon key={pogledana ? 'miran' : `balon-${ciklus}`} animiraj={!pogledana} natpis={prica.natpis} />
        </View>
      )}
    </Pressable>
  );
}

type AspektTacka = { key: string; name: string; glyph: string };

/** Red aspekta: dve tacke i znak aspekta, naslov tumacenja, pa "Sunce kvadrat Mars · 1,4°". */
export function AspektRed({ aspekt: a, naslov = '', zakljucan = false, muted, last, onPress }: {
  aspekt: { a: AspektTacka; b: AspektTacka; aspect: AspektTacka; orb: number };
  naslov?: string;
  zakljucan?: boolean;
  /** Sivo ime: aspekt postoji ali se ne tumaci. Podrazumevano kad red nigde ne vodi. */
  muted?: boolean;
  last: boolean;
  onPress?: () => void;
}) {
  const t = useT();
  const ime = t.karta.aspekt(a.a.name, a.aspect.name, a.b.name);
  const siv = muted ?? !onPress;
  const sadrzaj = (
    <>
      <View className="flex-row items-center gap-1">
        <Tacka tacka={a.a.key} glyph={a.a.glyph} size={24} />
        {imaAspekt(a.aspect.key) ? <AspektIkona aspekt={a.aspect.key} size={12} /> : <Glyph size={12}>{a.aspect.glyph}</Glyph>}
        <Tacka tacka={a.b.key} glyph={a.b.glyph} size={24} />
      </View>
      {naslov ? (
        <View className="ml-3 flex-1">
          <Text variant="row" numberOfLines={2} className={cn(siv && 'text-muted-foreground')}>{naslov}</Text>
          <Text variant="caption" className="mt-0.5">{ime} · {orbis(a.orb)}</Text>
        </View>
      ) : (
        // Bez naslova tumacenja: ime i stepeni u ISTOM redu, stepeni desno (Ivan, 28.9.2026).
        <View className="ml-3 flex-1 flex-row items-center gap-2">
          <Text variant="row" numberOfLines={2} className={cn('flex-1', siv && 'text-muted-foreground')}>{ime}</Text>
          <Text variant="caption" className="tabular-nums">{orbis(a.orb)}</Text>
        </View>
      )}
      {zakljucan && <Lock size={13} color={PREMIUM} strokeWidth={2.4} style={{ marginLeft: 6 }} />}
      {onPress && <ChevronRight size={18} color={neutral.inkSubtle} strokeWidth={2.2} style={{ marginLeft: 6 }} />}
    </>
  );
  const klasa = cn('flex-row items-center py-3 pl-4 pr-3', !last && 'border-b border-border');
  if (!onPress) return <View className={klasa} accessible accessibilityLabel={t.karta.lista.aspektOrbisA11y(ime, orbis(a.orb))}>{sadrzaj}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityLabel={t.karta.lista.aspektA11y(naslov, ime, zakljucan)}
      className={cn(klasa, 'active:opacity-60')}>
      {sadrzaj}
    </Pressable>
  );
}

/** Dugme "i" pored kruga: dodir 44pt, ikonica 22pt. */
const INFO_DUGME = 44;
const INFO_IKONA = 22;

/**
 * "i" DOLE desno od tocka, dno ikonice u liniji sa dnom kruga, svetlo
 * ljubicasta (Ivan, 28.9.2026) — otvara list sa objasnjenjem tocka: "Šta je
 * natalna karta" na "Ti", "Šta je trenutno nebo" na Nebu (29.9.2026).
 * Apsolutno, u omotacu tocka; `velicina` je velicina tocka.
 */
export function TockInfo({ velicina, onPress, accessibilityLabel }: {
  velicina: number;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{ top: dnoKruga(velicina) - INFO_DUGME / 2 - INFO_IKONA / 2, width: INFO_DUGME, height: INFO_DUGME }}
      className="absolute right-3 items-center justify-center active:opacity-60">
      <Info size={INFO_IKONA} color={OBLAST_BOJA} strokeWidth={2} />
    </Pressable>
  );
}
