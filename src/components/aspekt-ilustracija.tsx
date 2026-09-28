import * as React from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';

import { Planeta, type Tacka } from '@/components/planete-par';
import type { AspektKljuc } from '@/components/aspekt-ikona';

/**
 * Ilustracija aspekta (Ivan, 28.9.2026; `files/*-ilustracija@2x-1.png`): tocak
 * karte, natalna tacka UNUTRA, tranzitna VAN kruga, isprekidana linija izmedju.
 * Preko ucrtanih tackica lepe se slike planeta (`planete-par.tsx`). U `assets/`
 * su iste slike sa BELOM pretvorenom u providnu (bela bi se na poluprovidnoj
 * kartici videla kao pravougaonik).
 *
 * Polozaji tackica su IZMERENI na slikama (piksel, @2x): svetla natalna je na
 * istom mestu na svih pet, tamna tranzitna se pomera sa aspektom.
 */
const SLIKA: Record<AspektKljuc, ImageSourcePropType> = {
  conjunction: require('../../assets/images/aspekti/conjunction.png'),
  sextile: require('../../assets/images/aspekti/sextile.png'),
  square: require('../../assets/images/aspekti/square.png'),
  trine: require('../../assets/images/aspekti/trine.png'),
  opposition: require('../../assets/images/aspekti/opposition.png'),
};

/** Sirina, visina slike i centri tackica, u pikselima @2x. */
/** `tocak`: gornja i donja ivica tocka (bez tackica), izmereno na slikama. */
const MERE: Record<AspektKljuc, { w: number; h: number; tranzit: [number, number]; natal: [number, number]; tocak: [number, number] }> = {
  conjunction: { w: 234, h: 278, tranzit: [134, 266], natal: [112.5, 190], tocak: [40, 239] },
  sextile: { w: 236, h: 278, tranzit: [223, 173], natal: [112.5, 190], tocak: [40, 239] },
  square: { w: 236, h: 278, tranzit: [223, 103], natal: [112.5, 190], tocak: [40, 239] },
  trine: { w: 234, h: 278, tranzit: [195, 43], natal: [112.5, 190], tocak: [40, 239] },
  opposition: { w: 234, h: 280, tranzit: [67, 11], natal: [112.5, 192], tocak: [42, 241] },
};

/** Precnik planete kao udeo sirine ilustracije: tranzitna (van kruga) veca. */
const TRANZIT = 0.26;
const NATAL = 0.2;

/**
 * Koliko tranzitna planeta izlazi van slike. LEVO/DESNO: najvise preko svih
 * aspekata, da okvir bude iste sirine na svakoj kartici i tekst pored svuda
 * pocne isto (levo ne izlazi nikad). GORE/DOLE: samo za OVAJ aspekt — kartice
 * ne moraju biti iste visine, pa nema praznog prostora (Ivan, 28.9.2026).
 */
function rezerva(width: number, aspekt: AspektKljuc) {
  const r = width * TRANZIT / 2;
  let levo = 0, desno = 0;
  for (const m of Object.values(MERE)) {
    const k = width / m.w;
    levo = Math.max(levo, r - m.tranzit[0] * k);
    desno = Math.max(desno, m.tranzit[0] * k + r - width);
  }
  // Vertikalno: od vrha tocka ili tranzitne planete (sta je vise) do dna jednog
  // od njih. Prazan providni pojas slike iznad i ispod tocka se odseca.
  const m = MERE[aspekt];
  const k = width / m.w;
  const y = m.tranzit[1] * k;
  const vrh = Math.min(m.tocak[0] * k, y - r);
  const dno = Math.max(m.tocak[1] * k, y + r);
  return { levo, desno, vrh, visina: dno - vrh };
}

export function AspektIlustracija({ aspekt, tranzitna, natalna, width = 96 }: {
  aspekt: AspektKljuc;
  tranzitna: Tacka;
  natalna: Tacka;
  /** Sirina ilustracije u tackama; visina ide po razmeri. */
  width?: number;
}) {
  const m = MERE[aspekt];
  const k = width / m.w;
  const height = m.h * k;
  const dT = width * TRANZIT;
  const dN = width * NATAL;
  const r = rezerva(width, aspekt);
  const na = (p: [number, number], d: number) => ({ position: 'absolute' as const, left: r.levo + p[0] * k - d / 2, top: p[1] * k - r.vrh - d / 2 });

  return (
    <View
      style={{ width: width + r.levo + r.desno, height: r.visina }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Image source={SLIKA[aspekt]} style={{ position: 'absolute', left: r.levo, top: -r.vrh, width, height }} resizeMode="contain" />
      <View style={na(m.natal, dN)}>
        <Planeta t={natalna} size={dN} />
      </View>
      <View style={na(m.tranzit, dT)}>
        <Planeta t={tranzitna} size={dT} />
      </View>
    </View>
  );
}
