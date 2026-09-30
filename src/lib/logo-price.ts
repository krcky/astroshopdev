/**
 * Pokret loga u VIDEU price (Ivan, 30.9.2026: "uvek da se vrti krug iz logoa, da ljudi znaju
 * da je animirano"). Isti pokret kao logo i uvod pri pokretanju (`scripts/logo/build-krug.py`):
 * lice miruje, zraci i lukovi se okrecu, znakovi kruze ali ostaju uspravni. Jedan krug na 12 s —
 * dvaput sporije od sporog okreta iz uvoda (`SPORO_S` u `build-krug-uvod.py`, 6 s); Ivan, 30.9.2026:
 * "logo treba da se vrti sporije".
 *
 * Ugao ide po VREMENU VIDEA (od prvog kadra), ne po satu slike — sat svake slike krece od 0,
 * pa bi krug na svakoj novoj slici skocio nazad. Na slici za deljenje vremena nema: ugao 0.
 * Cist racun (worklet), bez RN uvoza — proverava ga `check:prica`.
 */
export const LOGO_OKRET_S = 12;

/** Ugao kruga (stepeni, u smeru kazaljke) posle `ms` od pocetka videa. */
export function ugaoLoga(ms: number): number {
  'worklet';
  return ((ms / 1000 / LOGO_OKRET_S) * 360) % 360;
}

/** Gde je sredina znaka kad je krug okrenut za `ugao` — znak kruzi oko sredine `krug`-a, uspravan. */
export function polozajZnaka(
  z: { cx: number; cy: number },
  ugao: number,
  krug: { cx: number; cy: number },
): { x: number; y: number } {
  'worklet';
  const a = (ugao * Math.PI) / 180;
  const dx = z.cx - krug.cx;
  const dy = z.cy - krug.cy;
  // Ekran: y raste nadole, pa je ovo okret u smeru kazaljke (kao `rotate` u RN-u).
  return { x: krug.cx + dx * Math.cos(a) - dy * Math.sin(a), y: krug.cy + dx * Math.sin(a) + dy * Math.cos(a) };
}
