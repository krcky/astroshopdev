/**
 * Slike price o znaku po znaku, sa merama u pikselima: gravira (files/*-ilustracija@2x.png, smanjena
 * na @3x prikaza) i fotografije kamena, boje, biljke i hrane sa astroshop.rs. GENERISANO:
 * `scripts/znak/pripremi.py`.
 */
import type { ImageSourcePropType } from 'react-native';

export type Slika = { src: ImageSourcePropType; w: number; h: number };
export type SlikeZnaka = Record<'gravira' | 'kamen' | 'boja' | 'biljka' | 'hrana', Slika>;

export const SLIKE_ZNAKA: Record<string, SlikeZnaka> = {
  aries: {
    gravira: { src: require('../../../assets/images/znakovi/aries.png'), w: 1016, h: 990 },
    kamen: { src: require('../../../assets/images/znakovi/aries-kamen.jpg'), w: 223, h: 226 },
    boja: { src: require('../../../assets/images/znakovi/aries-boja.jpg'), w: 292, h: 228 },
    biljka: { src: require('../../../assets/images/znakovi/aries-biljka.jpg'), w: 338, h: 610 },
    hrana: { src: require('../../../assets/images/znakovi/aries-hrana.jpg'), w: 640, h: 360 },
  },
  taurus: {
    gravira: { src: require('../../../assets/images/znakovi/taurus.png'), w: 1050, h: 711 },
    kamen: { src: require('../../../assets/images/znakovi/taurus-kamen.jpg'), w: 384, h: 280 },
    boja: { src: require('../../../assets/images/znakovi/taurus-boja.jpg'), w: 384, h: 280 },
    biljka: { src: require('../../../assets/images/znakovi/taurus-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/taurus-hrana.jpg'), w: 384, h: 280 },
  },
  gemini: {
    gravira: { src: require('../../../assets/images/znakovi/gemini.png'), w: 714, h: 990 },
    kamen: { src: require('../../../assets/images/znakovi/gemini-kamen.jpg'), w: 234, h: 256 },
    boja: { src: require('../../../assets/images/znakovi/gemini-boja.jpg'), w: 375, h: 234 },
    biljka: { src: require('../../../assets/images/znakovi/gemini-biljka.jpg'), w: 365, h: 604 },
    hrana: { src: require('../../../assets/images/znakovi/gemini-hrana.jpg'), w: 276, h: 276 },
  },
  cancer: {
    gravira: { src: require('../../../assets/images/znakovi/cancer.png'), w: 1050, h: 692 },
    kamen: { src: require('../../../assets/images/znakovi/cancer-kamen.jpg'), w: 302, h: 234 },
    boja: { src: require('../../../assets/images/znakovi/cancer-boja.jpg'), w: 362, h: 199 },
    biljka: { src: require('../../../assets/images/znakovi/cancer-biljka.jpg'), w: 359, h: 592 },
    hrana: { src: require('../../../assets/images/znakovi/cancer-hrana.jpg'), w: 383, h: 239 },
  },
  leo: {
    gravira: { src: require('../../../assets/images/znakovi/leo.png'), w: 1050, h: 733 },
    kamen: { src: require('../../../assets/images/znakovi/leo-kamen.jpg'), w: 263, h: 222 },
    boja: { src: require('../../../assets/images/znakovi/leo-boja.jpg'), w: 417, h: 167 },
    biljka: { src: require('../../../assets/images/znakovi/leo-biljka.jpg'), w: 284, h: 619 },
    hrana: { src: require('../../../assets/images/znakovi/leo-hrana.jpg'), w: 384, h: 280 },
  },
  virgo: {
    gravira: { src: require('../../../assets/images/znakovi/virgo.png'), w: 784, h: 989 },
    kamen: { src: require('../../../assets/images/znakovi/virgo-kamen.jpg'), w: 384, h: 280 },
    boja: { src: require('../../../assets/images/znakovi/virgo-boja.jpg'), w: 384, h: 280 },
    biljka: { src: require('../../../assets/images/znakovi/virgo-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/virgo-hrana.jpg'), w: 384, h: 280 },
  },
  libra: {
    gravira: { src: require('../../../assets/images/znakovi/libra.png'), w: 927, h: 989 },
    kamen: { src: require('../../../assets/images/znakovi/libra-kamen.jpg'), w: 384, h: 280 },
    boja: { src: require('../../../assets/images/znakovi/libra-boja.jpg'), w: 384, h: 280 },
    biljka: { src: require('../../../assets/images/znakovi/libra-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/libra-hrana.jpg'), w: 384, h: 280 },
  },
  scorpio: {
    gravira: { src: require('../../../assets/images/znakovi/scorpio.png'), w: 1050, h: 887 },
    kamen: { src: require('../../../assets/images/znakovi/scorpio-kamen.jpg'), w: 384, h: 280 },
    boja: { src: require('../../../assets/images/znakovi/scorpio-boja.jpg'), w: 241, h: 209 },
    biljka: { src: require('../../../assets/images/znakovi/scorpio-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/scorpio-hrana.jpg'), w: 384, h: 280 },
  },
  sagittarius: {
    gravira: { src: require('../../../assets/images/znakovi/sagittarius.png'), w: 1050, h: 956 },
    kamen: { src: require('../../../assets/images/znakovi/sagittarius-kamen.jpg'), w: 384, h: 280 },
    boja: { src: require('../../../assets/images/znakovi/sagittarius-boja.jpg'), w: 384, h: 280 },
    biljka: { src: require('../../../assets/images/znakovi/sagittarius-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/sagittarius-hrana.jpg'), w: 275, h: 183 },
  },
  capricorn: {
    gravira: { src: require('../../../assets/images/znakovi/capricorn.png'), w: 1050, h: 786 },
    kamen: { src: require('../../../assets/images/znakovi/capricorn-kamen.jpg'), w: 384, h: 280 },
    boja: { src: require('../../../assets/images/znakovi/capricorn-boja.jpg'), w: 384, h: 280 },
    biljka: { src: require('../../../assets/images/znakovi/capricorn-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/capricorn-hrana.jpg'), w: 384, h: 280 },
  },
  aquarius: {
    gravira: { src: require('../../../assets/images/znakovi/aquarius.png'), w: 1050, h: 862 },
    kamen: { src: require('../../../assets/images/znakovi/aquarius-kamen.jpg'), w: 945, h: 531 },
    boja: { src: require('../../../assets/images/znakovi/aquarius-boja.jpg'), w: 688, h: 280 },
    biljka: { src: require('../../../assets/images/znakovi/aquarius-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/aquarius-hrana.jpg'), w: 789, h: 607 },
  },
  pisces: {
    gravira: { src: require('../../../assets/images/znakovi/pisces.png'), w: 1050, h: 963 },
    kamen: { src: require('../../../assets/images/znakovi/pisces-kamen.jpg'), w: 384, h: 280 },
    boja: { src: require('../../../assets/images/znakovi/pisces-boja.jpg'), w: 384, h: 280 },
    biljka: { src: require('../../../assets/images/znakovi/pisces-biljka.jpg'), w: 384, h: 630 },
    hrana: { src: require('../../../assets/images/znakovi/pisces-hrana.jpg'), w: 384, h: 280 },
  },
};

export const SRCE: Slika = { src: require('../../../assets/images/ikone/srce.png'), w: 402, h: 357 };
export const TORBA: Slika = { src: require('../../../assets/images/ikone/torba.png'), w: 422, h: 404 };
