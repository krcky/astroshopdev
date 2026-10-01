import * as React from 'react';
import { View } from 'react-native';
import { Info, Mic, Wallet } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { AstrologSlika } from '@/components/astrolog-slika';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';
import { ASTROLOG } from '@/lib/pitanja';
import { useCenaPitanja } from '@/lib/kupovina';
import { useEntitlement } from '@/store/auth';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';

/**
 * Uvod u "Pitaj astrologa": astrolog, naslov, recenica i tabela od tri reda
 * (odgovor i rok, napomena da nije strucni savet, placanje i cena) — sve sto
 * mora da stoji pre placanja. Stoji na strani dok korisnik nema nijedno pitanje, a
 * posle toga je prvi korak lista odozdo (`pitanje-novo.tsx`, Ivan 29.9.2026).
 *
 * `naBelom`: list je beo, pa kartica dobija ivicu umesto bele ispune — bela na
 * beloj se ne vidi (DESIGN.md, poglavlje 5).
 */
export function PitajUvod({ naBelom = false }: { naBelom?: boolean }) {
  const t = useT().pitaj.uvod;
  const premium = !!useEntitlement()?.active;
  const cena = useCenaPitanja(premium);

  return (
    <View>
      {/* Astrolog, naslov, jedna recenica — bez kartice: prazan prostor nosi tezinu.
          Zbijeno (Ivan, 29.9.2026: "previse teksta"): naslov JE poruka da odgovara
          covek; rok, placanje i napomena su u tabeli ispod. */}
      <View className="items-center">
        <AstrologSlika velicina={88} />
        <Text variant="row" className="mt-2">{ASTROLOG.ime}</Text>
        <Text variant="caption">{ASTROLOG.zvanje}</Text>
        <Text variant="h1" className="mt-4 text-center">{t.naslov}</Text>
        <Text variant="body" className="mt-2 px-2 text-center">
          {t.opis(ASTROLOG.kratko)}
        </Text>
      </View>

      {/* Tri reda (Ivan, 29.9.2026): glasovni odgovor i rok (u recenici, ne desno),
          napomena o savetu, pa placanje i cena na kraju. Linije od ivice do ivice — padding je u redovima, ne u kartici. */}
      <View className={cn(naBelom ? 'rounded-lg border border-border' : CARD_SURFACE, 'mt-5')}>
        <Red ikona={<Mic size={18} color={neutral.ink} strokeWidth={1.8} />}>
          {t.glasovno}
        </Red>
        <View className="h-px bg-border" />
        <Red ikona={<Info size={18} color={neutral.ink} strokeWidth={1.8} />}>
          {t.nijeSavet}
        </Red>
        <View className="h-px bg-border" />
        <Red ikona={<Wallet size={18} color={neutral.ink} strokeWidth={1.8} />} desno={cena}>
          {t.placanje}
        </Red>
      </View>
    </View>
  );
}

/** Red tabele: ikonica, tekst, i cena desno kad postoji. */
function Red({ ikona, desno, children }: {
  ikona: React.ReactNode;
  desno?: string | null;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      {ikona}
      <Text variant="body" className="flex-1 text-foreground">{children}</Text>
      {!!desno && (
        <Text variant="row" className={tezina('cena')}>{desno}</Text>
      )}
    </View>
  );
}
