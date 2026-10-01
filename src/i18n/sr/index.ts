/**
 * Srpski recnik — OSNOVA svih jezika. Oblik ovog objekta je tip `Recnik`; drugi jezik je
 * dopuna istog oblika (`registrujJezik`). Svaki deo je svoj fajl, po delu aplikacije.
 */
import { danas } from './danas';
import { datum } from './datum';
import { gramatika } from './gramatika';
import { karta } from './karta';
import { nebo } from './nebo';
import { onboarding } from './onboarding';
import { opste } from './opste';
import { pitaj } from './pitaj';
import { prica } from './prica';
import { profil } from './profil';

export const sr = { opste, gramatika, datum, nebo, onboarding, profil, pitaj, prica, danas, karta };

export type Recnik = typeof sr;
