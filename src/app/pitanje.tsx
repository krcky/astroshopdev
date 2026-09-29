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
import { ASTROLOG, OKVIRNI_ROK, datumPitanja, natpisStatusa, trajanjeZvuka } from '@/lib/pitanja';
import { useLinkZvuka, useOznaciProcitano, usePitanje } from '@/lib/pitanja-api';

/**
 * Jedno pitanje i odgovor astrologa — list odozdo, kao sva tumacenja
 * (`TUMACENJE_LIST` u `_layout.tsx`). Otvara se iz "Moja pitanja" u tabu "Pitaj".
 *
 * Zvuk je u privatnom skladistu: link se trazi pri otvaranju i istice za sat
 * (`useLinkZvuka`). Odgovor ostaje uz nalog i posle povracaja novca.
 */
export default function PitanjeDetalj() {
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
            {isError ? 'Pitanje nije učitano. Proveri internet pa ga otvori ponovo.' : 'Ovo pitanje više ne postoji.'}
          </Text>
        )}
      </SheetScroll>
    );
  }

  return (
    <SheetScroll>
      <Text variant="oznaka">{natpisStatusa(p)} · {datumPitanja(p)}</Text>
      <Text variant="naslovLista" className="mt-2">Tvoje pitanje</Text>
      <Text variant="reading" className="mt-4">{p.tekst}</Text>

      <View className="mt-10">
        {p.audio_putanja ? (
          <>
            <NaslovSekcije>Odgovor</NaslovSekcije>
            <View className="mb-5 flex-row items-center gap-3">
              <AstrologSlika velicina={44} />
              <View className="flex-1">
                <Text variant="row">{ASTROLOG.ime}</Text>
                <Text variant="caption">
                  Glasovna poruka{p.audio_trajanje ? ` · ${trajanjeZvuka(p.audio_trajanje)}` : ''}
                </Text>
              </View>
            </View>
            <GlasovnaPoruka url={link.data ?? null} trajanje={p.audio_trajanje} greska={link.isError} />
          </>
        ) : p.status === 'paid' ? (
          <View className="flex-row items-center gap-3">
            <AstrologSlika velicina={44} />
            <Text variant="body" className="flex-1">
              {ASTROLOG.kratko} odgovara {OKVIRNI_ROK}. Odgovor će se pojaviti ovde, kao glasovna poruka.
            </Text>
          </View>
        ) : p.status === 'draft' ? (
          <>
            <Text variant="body">Pitanje još nije poslato.</Text>
            <Button className="mt-4" onPress={() => leaveSheetTo('/pitanje-novo')}>
              <Text>Nastavi</Text>
            </Button>
          </>
        ) : (
          <Text variant="body">Novac za ovo pitanje je vraćen, pa ga {ASTROLOG.kratko} neće dobiti.</Text>
        )}
      </View>
    </SheetScroll>
  );
}
