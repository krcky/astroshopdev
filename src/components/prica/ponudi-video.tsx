import * as React from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

import { useT } from '@/i18n';
import { IMA_VIDEO } from '@/components/prica/platno-videa';
import { pitajZaObavestenje } from '@/components/prica/video-radionica';
import { otvoriVideo, procenat } from '@/components/prica/video-traka';
import { useAuthStore } from '@/store/auth';
import { useVideo, useVideoPrice, type PosaoVidea } from '@/store/video-price';

/**
 * "PODELI" U PRICI (Ivan, 30.9.2026): ova slika ili cela prica kao video — ZAJEDNICKO za dnevnu
 * pricu (`app/prica.tsx`) i opsti plejer (`plejer.tsx`, prica o znaku; 1.10.2026).
 *
 *  - iOS: sistemski meni (`ActionSheetIOS`); Android: dijalog sa tri dugmeta (Otkaži levo, video desno).
 *  - Gotov video: "Pogledaj video" -> list `/video-price` (pregled, deljenje, cuvanje).
 *  - Dok se TAJ video pravi: procenat, bez dugmeta. Dok se pravi video DRUGE price: bez dugmeta —
 *    radionica pravi jedan po jedan, a nov posao bi prekinuo onaj koji traje.
 *  - Bez nativnog modula (Expo Go, veb), bez naloga ili bez `posao`: odmah slika, kao do sada.
 *
 * `pauza(true)` dok je meni otvoren — prica stoji; `podeliSliku` sama vodi racuna o pauzi.
 */
export function usePonudiVideo({ posao, pauza, naslov }: {
  posao: PosaoVidea | null;
  pauza: (stoji: boolean) => void;
  /** Naslov menija: "Podeli svoj dan", "Podeli svoj znak". */
  naslov: string;
}) {
  const t = useT();
  const uid = useAuthStore((s) => s.user?.id ?? null);
  const video = useVideo(uid, posao?.vrsta ?? 'dan', posao?.kljuc ?? null);
  const drugi = useVideoPrice((s) => (s.posao && s.posao.vrsta !== posao?.vrsta ? s.posao.naslov : null));

  const ponudi = React.useCallback((podeliSliku: () => void) => {
    if (!IMA_VIDEO || !uid || !posao) { podeliSliku(); return; }
    pauza(true);
    const gotov = video?.stanje === 'gotov' && video.uri ? video.uri : null;
    const pravi = video?.stanje === 'pravi';
    const tp = t.prica.ponudi;
    const opis = drugi
      ? tp.upravoPravimo(drugi)
      : pravi
        ? tp.sePravi(procenat(video!.napredak))
        : gotov
          ? tp.spreman
          : tp.pravimoOkoMinut;
    const moze = !pravi && !drugi;
    const video1 = () => {
      pauza(false);
      if (gotov) otvoriVideo(posao.vrsta);
      else if (moze) {
        useVideoPrice.getState().pokreni(uid, posao);
        void pitajZaObavestenje();
      }
    };
    const otkazi = () => pauza(false);

    if (Platform.OS === 'android') {
      // Android: najvise tri dugmeta — levo "Otkaži", desno slika i video.
      Alert.alert(
        naslov,
        opis,
        [
          { text: t.opste.otkazi, style: 'cancel', onPress: otkazi },
          { text: tp.ovaSlika, onPress: podeliSliku },
          ...(gotov || moze ? [{ text: gotov ? tp.pogledajVideo : tp.celaPrica, onPress: video1 }] : []),
        ],
        { cancelable: true, onDismiss: otkazi },
      );
      return;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: naslov,
        message: gotov ? undefined : opis,
        options: [
          tp.ovaSlika,
          gotov ? tp.pogledajVideo : pravi ? tp.sePraviDugme(procenat(video!.napredak)) : drugi ? tp.cekaDrugi : tp.celaPrica,
          t.opste.otkazi,
        ],
        cancelButtonIndex: 2,
        disabledButtonIndices: gotov || moze ? undefined : [1],
      },
      (izbor) => {
        if (izbor === 0) podeliSliku();
        else if (izbor === 1) video1();
        else otkazi();
      },
    );
  }, [uid, posao, video, drugi, pauza, naslov, t]);

  return { ponudi, video };
}
