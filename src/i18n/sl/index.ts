/** Slovenski recnik — CEO (tip `Recnik`): TypeScript pada cim kljuc fali. */
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

export const sl: Recnik = { opste, gramatika, datum, nebo, onboarding, profil, pitaj, prica, danas, karta };
