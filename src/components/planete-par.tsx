import * as React from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { Crown } from 'lucide-react-native';

import { PlanetaIkona, imaIkonu } from '@/components/planeta-ikona';
import { Glyph } from '@/components/ui/glyph';
import { neutral } from '@/theme/tokens';

/**
 * Slike planeta (Ivan, 28.9.2026; `files/*@2x.png`) — na kartici tranzita
 * umesto ikonica planeta i aspekta: dve planete jedna preko druge, kao na
 * njegovom uzoru (Mars ispred Sunca). Tranzitna je LEVO i ISPRED, natalna
 * desno i iza.
 *
 * Ascendent i MC nemaju sliku — za njih ostaje SVG ikonica (`planeta-ikona.tsx`).
 */
const SLIKA: Partial<Record<string, ImageSourcePropType>> = {
  sun: require('../../assets/images/planete/sun.png'),
  moon: require('../../assets/images/planete/moon.png'),
  mercury: require('../../assets/images/planete/mercury.png'),
  venus: require('../../assets/images/planete/venus.png'),
  mars: require('../../assets/images/planete/mars.png'),
  jupiter: require('../../assets/images/planete/jupiter.png'),
  saturn: require('../../assets/images/planete/saturn.png'),
  uranus: require('../../assets/images/planete/uranus.png'),
  neptune: require('../../assets/images/planete/neptune.png'),
  pluto: require('../../assets/images/planete/pluto.png'),
};

/**
 * Saturn i Uran imaju prstenove, pa je telo na slici manje od slike (izmereno:
 * Saturn ~0,4 sirine, Uran ~0,6). Slika se zato crta veca, da telo bude blizu
 * precnika ostalih; prstenovi izlaze van kruga. Ogranicenje da ne prekriju tekst.
 */
const SKALA: Partial<Record<string, number>> = { saturn: 1.5, uranus: 1.5 };

/** Koliko je slika veca od precnika tela (prstenovi); 1 za ostale. Za mesto oko slike. */
export function skalaSlike(key: string): number {
  return SKALA[key] ?? 1;
}

/** Mesto za prstenove desne planete, isto za svaki par — da tekst uvek pocne na istoj liniji. */
const PRSTENOVI = (Math.max(...Object.values(SKALA).map((x) => x ?? 1)) - 1) / 2;

/** Koliko se druga planeta podvlaci pod prvu, kao udeo precnika. */
const PREKLOP = 0.3;

export type Tacka = { key: string; glyph: string; vladar?: boolean };

/** Jedna planeta: slika, ili SVG ikonica za Asc/MC; krunica za vladara. */
export function Planeta({ t, size }: { t: Tacka; size: number }) {
  const slika = SLIKA[t.key];
  const skala = SKALA[t.key] ?? 1;
  const d = size * skala;
  return (
    <View style={{ width: size, height: size }}>
      {slika ? (
        <Image
          source={slika}
          style={{ position: 'absolute', width: d, height: d, left: (size - d) / 2, top: (size - d) / 2 }}
          resizeMode="contain"
        />
      ) : imaIkonu(t.key) ? (
        <PlanetaIkona planeta={t.key} size={size} />
      ) : (
        <View className="items-center justify-center rounded-full bg-fill" style={{ width: size, height: size }}>
          <Glyph size={size * 0.5} className="text-foreground">{t.glyph}</Glyph>
        </View>
      )}
      {t.vladar && (
        <View
          className="absolute items-center justify-center rounded-full border border-border bg-background"
          style={{ width: size * 0.42, height: size * 0.42, right: -size * 0.08, top: -size * 0.08 }}>
          <Crown size={Math.round(size * 0.24)} color={neutral.ink} strokeWidth={2.4} />
        </View>
      )}
    </View>
  );
}

/**
 * Dve planete koje se preklapaju. `size` je precnik jedne.
 * Tacka bez slike (Asc, MC) se NE podvlaci — natpis bi bio pokriven — nego
 * stoji pored. Sirina para je stalna i ukljucuje mesto za prstenove desne
 * planete (Saturn, Uran), da ne udju u tekst i da tekst svuda pocne isto.
 */
export function PlanetePar({ levo, desno, size = 36 }: { levo: Tacka; desno: Tacka; size?: number }) {
  // Sirina je ista za svaki par (tekst pored pocinje na istoj liniji); Asc/MC
  // stoje pored planete umesto ispod nje, u istoj sirini.
  const pomak = SLIKA[desno.key] ? size * (1 - PREKLOP) : size * (1 - PREKLOP) + size * PRSTENOVI;
  return (
    <View
      style={{ width: size * (2 - PREKLOP + PRSTENOVI), height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {/* Natalna prva (iza), tranzitna posle (ispred). */}
      <View style={{ position: 'absolute', left: pomak, top: 0 }}>
        <Planeta t={desno} size={size} />
      </View>
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <Planeta t={levo} size={size} />
      </View>
    </View>
  );
}
