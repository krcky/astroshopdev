import * as React from 'react';
import { Image, Platform, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { X } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { CARD_SURFACE } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { IMA_WIDGET, brojWidgeta, dodajWidgetNaEkran } from '@/lib/nebo-widget';
import { trebaPozivZaWidget } from '@/lib/widget-poziv';
import { useWidgetPoziv } from '@/store/widget-poziv';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { neutral } from '@/theme/tokens';

/** Slika malog widgeta — pravi je `swift run SkyRender` (native/SkyCore), isti crtez kao widget. */
const SLIKA = require('../../assets/images/widget-nebo.png');

/**
 * Plocica koja lici na mali widget na pocetnom ekranu: bela, zaobljena, sa krugom.
 * Ista na kartici i u listu sa uputstvom.
 */
export function WidgetSlika({ strana }: { strana: number }) {
  const t = useT().karta.widget;
  return (
    <View className="items-center justify-center overflow-hidden border border-fill-strong bg-card"
      style={{ width: strana, height: strana, borderRadius: strana * 0.23 }}>
      <Image source={SLIKA} style={{ width: strana, height: strana }} accessibilityLabel={t.slikaA11y} />
    </View>
  );
}

/**
 * Kartica "Nebo sada na početnom ekranu" na tabu "Nebo" (Ivan, 13.10.2026) — da ljudi saznaju za widget.
 *
 * Android: dugme otvara sistemski dijalog koji widget doda jednim dodirom; gde ga pokretac nema, uputstvo.
 * iOS: aplikacija ne moze sama da doda widget, pa dugme otvara list sa koracima (`/widget-uputstvo`).
 * Kad se pokazuje: `lib/widget-poziv.ts`.
 */
export function WidgetPoziv({ className }: { className?: string }) {
  const t = useT().karta.widget;
  const hydrated = useWidgetPoziv((s) => s.hydrated);
  const sklonjeno = useWidgetPoziv((s) => s.sklonjeno);
  const skloni = useWidgetPoziv((s) => s.skloni);
  // Broj poseta sa POCETKA ove posete: da se menja dok korisnik gleda tab, kartica bi iskocila pod prstom.
  const [posete, setPosete] = React.useState<number | null>(null);
  const [naEkranu, setNaEkranu] = React.useState<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!hydrated) return;
      let ziv = true;
      setPosete(useWidgetPoziv.getState().posete);
      brojWidgeta().then((n) => { if (ziv) setNaEkranu(n); });
      return () => { ziv = false; useWidgetPoziv.getState().poseta(); };
    }, [hydrated])
  );

  if (!trebaPozivZaWidget({ imaWidget: IMA_WIDGET, posete: posete ?? 0, sklonjeno, naEkranu })) return null;

  const dodaj = async () => {
    if (Platform.OS === 'android' && (await dodajWidgetNaEkran())) return;
    router.push('/widget-uputstvo');
  };

  return (
    <View className={cn(CARD_SURFACE, 'flex-row items-start gap-3 p-4', className)}>
      <WidgetSlika strana={68} />
      <View className="flex-1">
        {/* Mesto za X gore desno, da naslov ne udje pod njega. */}
        <Text variant="h3" className="pr-6" numberOfLines={2}>{t.naslov}</Text>
        <Text variant="muted" className="mt-1">{t.opis}</Text>
        {/* Natpis MORA u `<Text>`: goli string u dugmetu se ne crta (dugme je izgledalo prazno, Ivan 13.10.2026). */}
        <Button size="sm" istaknuto={false} className="mt-3 self-start" onPress={dodaj}>
          <Text>{Platform.OS === 'android' ? t.dodaj : t.pokazi}</Text>
        </Button>
      </View>
      <Pressable
        onPress={skloni}
        accessibilityRole="button"
        accessibilityLabel={t.skloni}
        hitSlop={12}
        className="absolute right-3 top-3 h-6 w-6 items-center justify-center rounded-full bg-fill active:opacity-60">
        <X size={12} color={neutral.inkSubtle} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}
