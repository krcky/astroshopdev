import * as React from 'react';
import { Platform, type ViewProps } from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';

/**
 * Platno za video price — NATIVNI modul `modules/video-price` (Ivan, 30.9.2026).
 * Deca se crtaju u kadar 1080 × 1920 i slazu u MP4 (H.264). Postoji SAMO u sopstvenom
 * buildu na iOS-u: Expo Go ga nema (i Android jos ne), pa je `PlatnoVidea` tada `null`
 * i prica nudi samo sliku.
 */
export type PlatnoVideaRef = {
  /** `uri` je `file://` putanja; postojeci fajl se brise. */
  pocni(uri: string, sirina: number, visina: number, fps: number, bitrate: number): Promise<void>;
  /** Iscrta platno kao kadar `redni` (vreme = redni / fps). Vraca koliko je trajalo (ms). */
  kadar(redni: number, nacin: 'hijerarhija' | 'sloj'): Promise<number>;
  /** Zatvori fajl; vraca njegovu `file://` putanju. */
  zavrsi(): Promise<string>;
  otkazi(): Promise<void>;
};

type Props = ViewProps & { ref?: React.Ref<PlatnoVideaRef> };

type Modul = {
  /** Kopija videa u Fotografije (samo dozvola za dodavanje). */
  sacuvajUFotografije(uri: string): Promise<'sacuvano' | 'bez-dozvole'>;
};

const modul = Platform.OS === 'ios' ? requireOptionalNativeModule<Modul>('VideoPrice') : null;

export const IMA_VIDEO = modul != null;

/** "Sačuvaj u Fotografije": `bez-dozvole` kad korisnik nije dozvolio dodavanje (ili ga je ranije odbio). */
export function sacuvajUFotografije(uri: string): Promise<'sacuvano' | 'bez-dozvole'> {
  if (!modul) return Promise.reject(new Error('nema modula'));
  return modul.sacuvajUFotografije(uri);
}

export const PlatnoVidea: React.ComponentType<Props> | null = IMA_VIDEO ? requireNativeView<Props>('VideoPrice') : null;
