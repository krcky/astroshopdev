import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCeneProizvoda } from '@/components/ostalo/cene';
import { ProizvodKvadrat } from '@/components/ostalo/proizvod-red';
import { SheetGrabber, dnoLista } from '@/components/sheet';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { proizvodPoId } from '@/lib/proizvodi';
import { useT } from '@/i18n';

/**
 * List sa JEDNIM proizvodom (`LIST_PO_SADRZAJU` u `_layout.tsx`), sa liste "Proizvodi" na tabu "Ostalo" (Ivan,
 * 14.10.2026). Samo za ono sto nema svoj tok u aplikaciji: proizvodi sa sajta (narukvica, konsultacije uzivo —
 * dugme otvara sajt u pregledacu) i sat (jos nije u prodavnici, pa bez dugmeta). Premium, natalna karta, pitanje i
 * widget vode pravo u svoje ekrane.
 */
export default function ProizvodList() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const t = useT().ostalo;
  const cene = useCeneProizvoda();
  const insets = useSafeAreaInsets();
  const proizvod = proizvodPoId(id);
  if (!proizvod) return <Redirect href="/ostalo" />;

  const stavka = t.proizvodi.stavke[proizvod.id];
  const opisi: Record<string, string | undefined> = t.detalj.opisi;
  const cena = cene[proizvod.id];

  return (
    <View className="bg-background px-6 pt-8" style={dnoLista(insets.bottom)}>
      <SheetGrabber />
      <ProizvodKvadrat id={proizvod.id} strana={88} />
      <Text variant="naslovLista" className="mt-4">{stavka.naziv}</Text>
      {cena ? (
        <View className="mt-2 flex-row items-baseline gap-2">
          <Text variant="h3">{cena.cena}</Text>
          {cena.nastavak ? <Text variant="caption">{cena.nastavak}</Text> : null}
          {cena.stara ? <Text variant="caption" className="line-through">{cena.stara}</Text> : null}
        </View>
      ) : null}
      <Text variant="body" className="mt-3 text-foreground">{opisi[proizvod.id] ?? stavka.opis}</Text>

      {proizvod.url ? (
        <>
          <Button className="mt-6" onPress={() => { void WebBrowser.openBrowserAsync(proizvod.url as string); }}>
            <Text>{t.detalj.sajt}</Text>
          </Button>
          <Text variant="caption" className="mt-3 text-center">{t.detalj.sajtBelezka}</Text>
        </>
      ) : proizvod.uskoro ? (
        <Text variant="muted" className="mt-6">{t.detalj.uskoroBelezka}</Text>
      ) : null}
    </View>
  );
}
