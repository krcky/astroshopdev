/**
 * English dictionary. FULL, not partial: typed as `Recnik`, so TypeScript fails as soon as a key is
 * missing or a function has a different shape than in Serbian (`sr/`, the source of truth).
 */
import type { Recnik } from '../sr';
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

export const en: Recnik = { opste, gramatika, datum, nebo, onboarding, profil, pitaj, prica, danas, karta };
