import { Platform } from 'react-native';

/**
 * iOS pre 26 — bez Liquid Glass-a. Tamo native trake (tabovi, zaglavlje)
 * izgledaju i ponasaju se drugacije, pa pojedini ekrani crtaju svoje
 * (Ivan, 27.9.2026; provereno na iOS 18.6 simulatoru).
 */
export const STARI_IOS = Platform.OS === 'ios' && parseInt(String(Platform.Version), 10) < 26;
