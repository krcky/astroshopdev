import * as React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { NaslovSekcije } from '@/components/naslov-sekcije';
import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { AstrologSlika } from '@/components/astrolog-slika';
import { GlasovnaPoruka } from '@/components/glasovna-poruka';
import { useT } from '@/i18n';
import { ASTROLOG, datumPitanja, natpisStatusa } from '@/lib/pitanja';
import { useLinkZvuka, useOznaciProcitano, usePitanje } from '@/lib/pitanja-api';

/**
 * Jedno pitanje i odgovor astrologa — list odozdo, kao sva tumacenja
 * (`TUMACENJE_LIST` u `_layout.tsx`). Otvara se iz "Moja pitanja" u tabu "Pitaj".
 *
 * Zvuk je u privatnom skladistu: link se trazi pri otvaranju i istice za sat
 * (`useLinkZvuka`). Odgovor ostaje uz nalog i posle povracaja novca.
 */
export default function PitanjeDetalj() {
  const t = useT();
  const tp = t.pitaj.pitanje;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pitanje: p, isPending, isError } = usePitanje(id);
  const link = useLinkZvuka(p?.audio_putanja ?? null);

  // Otvoren odgovor vise nije nov: nestaje broj sa taba i tackica iz liste.
  const oznaciProcitano = useOznaciProcitano();
  React.useEffect(() => { if (p) oznaciProcitano(p); }, [p, oznaciProcitano]);

  if (!p) {
    return (
      <SheetScroll>
        {isPending ? (
          <TextPlaceholder lines={4} />
        ) : (
          <Text variant="body">
            {isError ? tp.nijeUcitano : tp.nePostoji}
          </Text>
        )}
      </SheetScroll>
    );
  }

  return (
    <SheetScroll>
      <Text variant="oznaka">{tp.oznaka(natpisStatusa(p), datumPitanja(p))}</Text>
      <Text variant="naslovLista" className="mt-2">{tp.tvojePitanje}</Text>
      <Text variant="reading" className="mt-4">{p.tekst}</Text>

      <View className="mt-10">
        {p.audio_putanja ? (
          <>
            <NaslovSekcije>{tp.odgovor}</NaslovSekcije>
            <View className="mb-5 flex-row items-center gap-3">
              <AstrologSlika velicina={44} />
              <View className="flex-1">
                <Text variant="row">{ASTROLOG.ime}</Text>
                {/* Bez trajanja (UX recenzija 1.10.2026): baza ga cuva zaokruzeno (panel), a plejer
                    odmah ispod pokazuje pravo, odseceno — isti snimak je imao 0:06 i 0:05. */}
                <Text variant="caption">{tp.glasovnaPoruka}</Text>
              </View>
            </View>
            <GlasovnaPoruka url={link.data ?? null} trajanje={p.audio_trajanje} greska={link.isError} />
          </>
        ) : p.status === 'paid' ? (
          <View className="flex-row items-center gap-3">
            <AstrologSlika velicina={44} />
            <Text variant="body" className="flex-1">
              {tp.ceka(ASTROLOG.kratko)}
            </Text>
          </View>
        ) : p.status === 'draft' ? (
          <>
            <Text variant="body">{tp.nijePoslato}</Text>
            <Button className="mt-4" onPress={() => leaveSheetTo('/pitanje-novo')}>
              <Text>{t.opste.nastavi}</Text>
            </Button>
          </>
        ) : (
          <Text variant="body">{tp.vraceno(ASTROLOG.kratko)}</Text>
        )}
      </View>
    </SheetScroll>
  );
}
