import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { OblastIkona, OBLAST_BOJA } from '@/components/oblast-ikona';
import { cn } from '@/lib/utils';
import { OCENA_MAX, type OblastKey } from '@/lib/oblasti-config';
import { PREMIUM, otvoriPremium } from '@/components/zakljucano';
import { oceneOblasti, type OblastiDana } from '@/lib/oblasti';
import { useT } from '@/i18n';

/**
 * Ocena oblasti 1—5 kao tackice (●●●○○), na slajdu "Danas ukratko". Crno i svetlosivo, bez boje: ocena je
 * informacija, ne ukras. VoiceOver cita zaglavlje oblasti, ne tackice.
 */
export function OcenaTackice({ ocena }: { ocena: number }) {
  return (
    <View className="flex-row gap-1" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: OCENA_MAX }, (_, i) => (
        // Pune u boji ikonica oblasti (Ivan, 28.9.2026), prazne svetlosive.
        <View key={i} className={cn('h-2 w-2 rounded-pill', i >= ocena && 'bg-fill-strong')} style={i < ocena ? { backgroundColor: OBLAST_BOJA } : undefined} />
      ))}
    </View>
  );
}

/**
 * Ocene oblasti — zbijena kartica iznad sazetka na slajdu "Danas ukratko"
 * (Ivan, 28.9.2026). Cetiri reda bez linija: ikona i naziv levo, tackice desno;
 * oznaka ("Dobar dan") je samo u VoiceOver-u, da kartica bude sto niza. Ocene iz
 * `oceneOblasti` (`lib/oblasti.ts`). Dodir vodi na tab "Tranziti".
 */
export function OceneOblasti({ rez, bare = false, otkljucane }: {
  rez: OblastiDana;
  /** Bez sopstvene kartice — kad stoji u kartici "Ide ti / Koči te" na pocetnoj. */
  bare?: boolean;
  /**
   * Besplatni (`BESPLATNO.oblasti`): ocena se vidi samo za ove, ostale imaju
   * katanac umesto tackica i kartica vodi na `/premium`. Bez ovoga: sve otvorene.
   */
  otkljucane?: readonly OblastKey[];
}) {
  const t = useT();
  const ocene = oceneOblasti(rez);
  const otvorena = (k: OblastKey) => !otkljucane || otkljucane.includes(k);
  const imaZakljucanih = ocene.some((o) => !otvorena(o.key));
  return (
    <Pressable
      onPress={() => (imaZakljucanih ? otvoriPremium() : router.navigate('/daily'))}
      accessibilityRole="button"
      accessibilityLabel={ocene.map((o) => (otvorena(o.key) ? t.danas.ocene.otvorena(o.name, o.ocena, o.oznaka) : t.danas.ocene.zakljucana(o.name))).join('. ') + '.'}
      accessibilityHint={imaZakljucanih ? t.danas.ocene.otvaraPremium : t.danas.ocene.otvaraTranzite}
      // Desno 22pt: poslednja tackica u liniji sa vrhom strelice u "Ide ti / Koči te"
      // (px-4 + chevron 18pt, vidljivi vrh ~6pt od ivice okvira ikone).
      className={cn(!bare && CARD_SURFACE, 'pl-4 pr-[22px] py-3.5 active:opacity-80')}>
      {ocene.map((o) => (
        <View key={o.key} className="flex-row items-center gap-2 py-1">
          <OblastIkona oblast={o.key} size={20} />
          {/* Isto pismo kao recenice "Ide ti / Koči te" ispod (`default`, Ivan 28.9.2026; ranije `oznaka`). */}
          <Text variant="default" className="flex-1">{o.name}</Text>
          {otvorena(o.key) ? <OcenaTackice ocena={o.ocena} /> : <Lock size={14} color={PREMIUM} />}
        </View>
      ))}
    </Pressable>
  );
}
