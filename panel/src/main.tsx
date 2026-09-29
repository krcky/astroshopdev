import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { accent, brand, neutral } from '../../src/theme/tokens';
import { App } from './app';
import './stil.css';

// Boje iz ISTOG izvora kao aplikacija (`src/theme/tokens.ts`) — panel se ne
// razilazi sa njom kad se nijansa promeni.
const koren = document.documentElement.style;
koren.setProperty('--pozadina', neutral.grouped);
koren.setProperty('--kartica', neutral.white);
koren.setProperty('--ispuna', neutral.fill);
koren.setProperty('--ispuna-jaka', neutral.fillStrong);
koren.setProperty('--linija', neutral.separator);
koren.setProperty('--tekst', neutral.ink);
koren.setProperty('--tekst-siv', neutral.inkMuted);
koren.setProperty('--tekst-bled', neutral.inkSubtle);
koren.setProperty('--crvena', accent.red);
koren.setProperty('--indigo', brand.indigo);

createRoot(document.getElementById('koren')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
