import * as React from 'react';

import { tr } from '@/i18n/jezik';
import { KarticaZaDeljenje } from '@/components/prica/kartica';
import { KarticaZnaka } from '@/components/prica-znaka/kartica';
import { VIDEO } from '@/lib/prica';
import { imeSlikeZnaka, SLIKE_ZNAKA, type PricaZnaka } from '@/lib/prica-znaka';
import type { PricaDana } from '@/lib/use-prica';
import type { PosaoVidea } from '@/store/video-price';

/*
 * STA SE SNIMA ZA KOJU PRICU (Ivan, 1.10.2026) — radionica videa (`video-radionica.tsx`) zna samo
 * "kartice po redu i koliko koja traje"; ovde je to za svaku vrstu price. Nova prica sa izvozom =
 * nova funkcija ovde (i kartica 360 × 640 po slici, pokreti kroz `sat.tsx`).
 */

/** Dnevna prica: svaka slika 4 s (`VIDEO.slika`) — pokreti se zavrse za 2,5—3,6 s. */
export function posaoDnevnePrice(p: PricaDana): PosaoVidea {
  const t = tr().prica;
  return {
    vrsta: 'dan',
    kljuc: p.dan,
    ime: t.imeFajla(p.dan),
    naslov: t.posao.naslovDana,
    opis: t.posao.opisDana(p.datumTekst),
    trajanja: p.slike.map(() => VIDEO.slika),
    kartica: (i) => <KarticaZaDeljenje p={p} k={p.slike[i]} />,
  };
}

/**
 * Prica o znaku: slike traju KOLIKO U PRICI (po tekstu, najmanje 4 s) — na slikama je tekst do
 * 34 reci, koji za 4 s ni ne stigne da se pojavi. Devet slika je 45—53 s; `rasporedVidea` ionako
 * drzi sve ispod 58 s (Instagram prica).
 */
export function posaoPriceZnaka(p: PricaZnaka): PosaoVidea {
  const t = tr().prica;
  return {
    vrsta: 'znak',
    kljuc: p.znak.key,
    ime: imeSlikeZnaka(p.znak),
    naslov: t.znak.podnaslov,
    opis: t.posao.opisZnaka(p.znak.name),
    trajanja: p.trajanja.map((t) => Math.max(t, VIDEO.slika)),
    // Bez "Ovan · astroshop.rs" gore (Ivan, 1.10.2026) — samo u videu; slika za deljenje ga ima.
    kartica: (i) => <KarticaZnaka p={p} k={SLIKE_ZNAKA[i]} bezZaglavlja />,
  };
}
