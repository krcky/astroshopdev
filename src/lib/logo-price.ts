/**
 * Pokret loga u VIDEU price (Ivan, 30.9.2026: "uvek da se vrti krug iz logoa, da ljudi znaju
 * da je animirano"). Isti pokret kao logo i uvod pri pokretanju (`scripts/logo/build-krug.py`):
 * lice miruje, zraci i lukovi se okrecu, znakovi kruze ali ostaju uspravni. Brzina je spori
 * okret iz uvoda (`SPORO_S` u `build-krug-uvod.py`): jedan krug na 6 s.
 *
 * Ugao ide po VREMENU VIDEA (od prvog kadra), ne po satu slike — sat svake slike krece od 0,
 * pa bi krug na svakoj novoj slici skocio nazad. Na slici za deljenje vremena nema: ugao 0.
 * Cist racun (worklet), bez RN uvoza — proverava ga `check:prica`.
 */
import { LOGO_KRUG } from '@/lib/logo-price-oblici';

export const LOGO_OKRET_S = 6;

/** Ugao kruga (stepeni, u smeru kazaljke) posle `ms` od pocetka videa. */
export function ugaoLoga(ms: number): number {
  'worklet';
  return ((ms / 1000 / LOGO_OKRET_S) * 360) % 360;
}

/** Gde je sredina znaka kad je krug okrenut za `ugao` — znak kruzi oko sredine kruga, uspravan. */
export function polozajZnaka(z: { cx: number; cy: number }, ugao: number): { x: number; y: number } {
  'worklet';
  const a = (ugao * Math.PI) / 180;
  const dx = z.cx - LOGO_KRUG.cx;
  const dy = z.cy - LOGO_KRUG.cy;
  // Ekran: y raste nadole, pa je ovo okret u smeru kazaljke (kao `rotate` u RN-u).
  return { x: LOGO_KRUG.cx + dx * Math.cos(a) - dy * Math.sin(a), y: LOGO_KRUG.cy + dx * Math.sin(a) + dy * Math.cos(a) };
}
