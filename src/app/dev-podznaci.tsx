import * as React from 'react';
import { Redirect, router } from 'expo-router';

import { Screen } from '@/components/screen';
import { PODZNAK_RECENICA, PodznakKartica } from '@/components/natalna-karta-v2';
import { prveRecenice } from '@/lib/tumacenje';
import { useNatalNaslovi, useNatalTexts } from '@/lib/natal-texts';
import { SIGNS } from '@/lib/zodiac';
import { PROBNI_BUILD } from '@/store/dev';
import { useT, type Recnik } from '@/i18n';

type ZnakKljuc = keyof Recnik['nebo']['znaci'];

/**
 * SAMO PROBNI BUILD: kartica podznaka za SVIH 12 ZNAKOVA jedna ispod druge (Ivan, 13.10.2026: "kako mogu da
 * vidim kako izgleda za sve znake") — gravira, naslov i prve dve recenice. Otvara se iz profila (Test) ili direktno
 * `/dev-podznaci`. Naslov i tekst salje server prijavljenom (tekst podznaka je besplatan); bez prijave ostaje
 * samo raspored. Dodir otvara tumacenje SVOG podznaka, ne znaka sa kartice — ovde se gleda izgled.
 */
export default function DevPodznaci() {
  const t = useT();
  const kljucevi = React.useMemo(() => SIGNS.map((z) => `natal.ascendant.sign.${z.key}`), []);
  const naslovi = useNatalNaslovi(kljucevi);
  const { texts } = useNatalTexts(kljucevi);
  if (!PROBNI_BUILD) return <Redirect href="/" />;
  return (
    <Screen label="Podznak: 12 znakova" pushed padded={false} tabBarSpace={false}>
      {SIGNS.map((z, i) => {
        const k = kljucevi[i];
        return (
          <PodznakKartica
            key={z.key}
            znak={z}
            oznaka={`${t.karta.podznak} ${t.nebo.uZnaku(z.key as ZnakKljuc)}`}
            podnaslov={naslovi.get(k)?.subtitle ?? ''}
            tekst={(texts.get(k)?.body ? prveRecenice(texts.get(k)!.body, PODZNAK_RECENICA) : null) ?? naslovi.get(k)?.recenica ?? ''}
            zakljucano={false}
            onPress={() => router.push({ pathname: '/natal', params: { tema: 'ascendant' } })}
          />
        );
      })}
    </Screen>
  );
}
