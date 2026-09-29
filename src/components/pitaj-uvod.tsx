import * as React from 'react';
import { View } from 'react-native';
import { Info, Mic, Wallet } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { AstrologSlika } from '@/components/astrolog-slika';
import { cn } from '@/lib/utils';
import { ASTROLOG, OKVIRNI_ROK } from '@/lib/pitanja';
import { useCenaPitanja } from '@/lib/kupovina';
import { useEntitlement } from '@/store/auth';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/**
 * Uvod u "Pitaj astrologa": astrolog, naslov, tri recenice koje moraju da stoje
 * pre placanja, i cena. Stoji na strani dok korisnik nema nijedno pitanje, a
 * posle toga je prvi korak lista odozdo (`pitanje-novo.tsx`, Ivan 29.9.2026).
 *
 * `naBelom`: list je beo, pa kartica dobija ivicu umesto bele ispune — bela na
 * beloj se ne vidi (DESIGN.md, poglavlje 5).
 */
export function PitajUvod({ naBelom = false }: { naBelom?: boolean }) {
  const premium = !!useEntitlement()?.active;
  const cena = useCenaPitanja(premium);

  return (
    <View>
      {/* Astrolog, naslov, podnaslov — bez kartice: prazan prostor nosi tezinu. */}
      <View className="items-center">
        <AstrologSlika velicina={96} />
        <Text variant="row" className="mt-3">{ASTROLOG.ime}</Text>
        <Text variant="caption">Astrolog</Text>
        <Text variant="h1" className="mt-5 text-center">Lično pitanje, lični odgovor</Text>
        <Text variant="body" className="mt-2 px-2 text-center">
          Napiši šta te zanima. {ASTROLOG.kratko} pogleda tvoju natalnu kartu i odgovori ti glasovnom porukom.
        </Text>
      </View>

      {/* Tri recenice koje moraju da stoje pre placanja, pa cena. */}
      <View className={cn(naBelom ? 'rounded-lg border border-border' : CARD_SURFACE, 'mt-5 px-5 py-1')}>
        <Cinjenica ikona={<Wallet size={18} color={neutral.ink} strokeWidth={1.8} />}>
          Pitanje se plaća jednokratno, nezavisno od pretplate.
        </Cinjenica>
        <View className="h-px bg-border" />
        <Cinjenica ikona={<Mic size={18} color={neutral.ink} strokeWidth={1.8} />}>
          Odgovor stiže kao glasovna poruka, {OKVIRNI_ROK}.
        </Cinjenica>
        <View className="h-px bg-border" />
        <Cinjenica ikona={<Info size={18} color={neutral.ink} strokeWidth={1.8} />}>
          Astrološko tumačenje nije medicinski, pravni ni finansijski savet.
        </Cinjenica>
        {cena && (
          <>
            <View className="h-px bg-border" />
            <View className="flex-row items-center justify-between py-3">
              <Text variant="row" className={tezina('cena')}>Cena pitanja</Text>
              <Text variant="row" className={tezina('cena')}>{cena}</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Cinjenica({ ikona, children }: { ikona: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      {ikona}
      <Text variant="body" className="flex-1 text-foreground">{children}</Text>
    </View>
  );
}
