import type { Recnik } from '../sr';
import { gramatika, mnozina } from './gramatika';
import { nebo } from './nebo';

/** "10 people", "1 person". */
const ljudi = (n: number) => `${n} ${mnozina(n, 'person', 'people')}`;

/** "Who sees this data" — same sentence in person editing and in the new-person review. */
const vidisSamoTi = (astrolog: string) =>
  `Only you can see this information. If you ask a question about this person, ${astrolog} sees it too.`;

/** Translation of `sr/profil.ts`: profile, Premium (paywall, locks) and other people. */
export const profil: Recnik['profil'] = {
  /** `app/profile.tsx` — profile sheet. */
  profil: {
    dodajSliku: 'Add profile photo',
    promeniSliku: 'Change or remove profile photo',
    slikaProfila: 'Profile photo',
    izaberiDruguSliku: 'Choose another photo',
    ukloniSliku: 'Remove photo',
    odustani: 'Cancel',
    nemaPristupaNaslov: 'No access to photos',
    nemaPristupaTekst: 'Allow access in your phone settings, then try again.',
    slikaNijeSacuvanaNaslov: 'Photo not saved',
    slikaNijeSacuvanaTekst: 'Check your internet connection and try again.',
    /** Section titles (shown in uppercase). */
    pretplata: 'Subscription',
    test: 'Test',
    nalog: 'Account',
    pravila: 'Legal',
    pomoc: 'Help',
    pisiteNam: 'Contact us',
    obavestenja: 'Notifications',
    obavestenjaUskoro: 'Coming soon',
    nemaMejlAplikacije: (adresa) => `There is no email app on this phone. The address is ${adresa}.`,
    premium: 'Premium',
    ukljucenTestom: 'On via test switch',
    /** `istice` is a formatted date or null. */
    poklon: (istice) => `Gift${istice ? `, until ${istice}` : ''}`,
    aktivanObnavljaSe: (istice) => `Active, renews ${istice}`,
    aktivan: 'Active',
    upravljajPretplatom: 'Manage subscription',
    otkljucajPremium: 'Unlock Premium',
    otkljucajPremiumIspod: 'All transits, full readings and other days',
    vratiKupovine: 'Restore purchases',
    josNijeMoguceNaslov: 'Not available yet',
    josNijeMoguceTekst: 'In-app purchases are not turned on yet.',
    nemaPretplateNaslov: 'No subscription',
    nemaPretplateTekst: 'This store account has no Astro Shop subscription.',
    proveraNijeUspelaNaslov: 'Check failed',
    proveraNijeUspelaTekst: 'Try again in a moment.',
    /** Test switch — test builds only. */
    placeniKorisnik: 'Paid user',
    pratiServer: (placen) => `Follows server (${placen ? 'paid' : 'free'})`,
    rucno: 'Manual, on this phone only',
    prekidacOpis: 'Test switch: paid user',
    vratiNaServer: 'Reset to server state',
    jezik: 'Language',
    jezikIspod: 'Astrologer readings are only in Serbian for now.',
    nalogIspod: 'Email and birth details',
    odjaviSe: 'Sign out',
    pravilaPrivatnosti: 'Privacy policy',
    usloviKoriscenja: 'Terms of use',
    verzija: (ime, verzija) => `${ime} ${verzija}`,
  },

  /** `components/profile-button.tsx` — top-right button. */
  dugmeProfil: 'Profile',

  /** `app/premium.tsx` — paywall. */
  premium: {
    naslov: 'Unlock every reading',
    podnaslov: 'All your transits, themes of the period and a look at the next two days.',
    natalnaNaslov: 'Birth chart',
    natalnaTekst: 'A reading of every planet by sign and house, and of every aspect.',
    tranzitiNaslov: 'Transits',
    tranzitiTekst: 'Every transit of the day with the full reading — for the next two days too.',
    ljudiNaslov: 'Your people',
    ljudiTekst: (n) => `Charts and transits for up to ${n} ${mnozina(n, 'person', 'people')} close to you.`,
    /** Package card title (capitalized) and period next to the price (lowercase). */
    godisnjeNaslov: 'Yearly',
    godisnje: 'per year',
    mesecnoNaslov: 'Monthly',
    mesecno: 'per month',
    /** Under the yearly price. */
    poMesecu: (cena) => `${cena} per month`,
    ustedi: (procenat) => `Save ${procenat}%`,
    nijeUkljucena: 'In-app purchases are not turned on yet.',
    kupovinaNijeUspela: 'The purchase did not go through. Try again in a moment.',
    kupovinaCeka: 'The purchase is waiting for approval. Premium turns on as soon as it comes through.',
    nemaPretplate: 'This store account has no Astro Shop subscription.',
    proveraNijeUspela: 'The check failed. Try again in a moment.',
    probaj: (dana) => `Try ${gramatika.dana(dana)} free`,
    pretplatiSe: 'Subscribe',
    /** "7 days free" on the package card. */
    besplatno: (dana) => `${gramatika.dana(dana)} free`,
    /** Screen reader: "€49.99 per year". */
    cenaPeriod: (cena, period) => `${cena} ${period}`,
    /** Screen reader: struck-through full price. */
    umesto: (cena) => `instead of ${cena}`,
    /**
     * Renewal sentence under the button (Apple/Google). `proba` = price and period after the trial,
     * null when the package has no trial; `ios` picks the store name.
     */
    obnavljanje: (proba, ios) =>
      (proba ? `After the trial, ${proba.cena} ${proba.godisnje ? 'per year' : 'per month'}. ` : '')
      + `The subscription renews automatically until you cancel it in your ${ios ? 'App Store' : 'Google Play'} settings.`,
    pitanjaPosebno: 'Questions to the astrologer are paid separately.',
    uslovi: 'Terms',
    vratiKupovine: 'Restore purchases',
    privatnost: 'Privacy',
    pisteAstrologNaslov: 'Written by an astrologer',
    pisteAstrologTekst: (astrolog) => `Every reading is written by astrologer ${astrolog}.`,
  },

  /** `components/zakljucano.tsx` — locks and the "Unlock" card. */
  zakljucano: {
    /** Screen reader for a locked row. */
    red: (naslov) => `${naslov}. Included with Premium`,
  },

  /** `components/tvoji-ljudi.tsx` — other people on the profile. */
  tvojiLjudi: {
    naslov: 'Your people',
    /** Spaces around the dot are NON-BREAKING. */
    naslovSaBrojem: (n) => `Your people  ·  ${n}`,
    /** Screen reader for a person row: name, then relationship and sign, then lock. */
    redOsobe: (ime, ispod, zakljucana) =>
      `${ime}${ispod ? `, ${ispod}` : ''}${zakljucana ? '. Included with Premium' : ''}`,
    dodajOsobu: 'Add a person',
    dodajOsobuOpis: (ispod) => `Add a person${ispod ? `. ${ispod}` : ''}`,
    uzPremiumDo: (n) => `Up to ${ljudi(n)} with Premium`,
    praznoIspod: 'The chart and transits of a partner, child or friend',
  },

  /** `lib/osobe.ts` — "Who they are to you"; keys live in the database. Gender-neutral: we never ask gender. */
  odnosi: {
    partner: 'Partner',
    dete: 'Child',
    roditelj: 'Parent',
    brat_sestra: 'Sibling',
    prijatelj: 'Friend',
    drugo: 'Someone else',
  },

  /** `lib/osobe.ts` (`porukaOsobe`) — server or network error while saving a person. */
  greske: {
    granica: 'Adding more people requires Premium.',
    prijavaIstekla: 'Your sign-in has expired. Close the app and open it again.',
    mreza: 'Can’t reach the server. Nothing was saved — try again when you’re back online.',
    opsta: 'Not saved. Try again in a minute.',
  },

  /** Birth details — shared labels for the table, the single-field sheet and the new-person steps. */
  rodjenje: {
    ime: 'Name',
    koTiJeNaslov: 'Who they are to you',
    /** Name as entered. */
    koTiJe: (ime) => `Who is ${ime} to you?`,
    datum: 'Date of birth',
    vreme: 'Time of birth',
    mesto: 'Place of birth',
    neZnamVreme: 'I don’t know the time',
    imeIliNadimak: 'Name or nickname',
    nemaVise: 'This person is no longer on your list.',
  },

  /** `app/osoba.tsx` — another person’s page. */
  osoba: {
    naslov: 'Person',
    tabKarta: 'Birth chart',
    tabTranziti: 'Transits',
    tabPitaj: 'Ask',
    uzPremium: (ime) => `${ime} is included with Premium`,
    uzPremiumOpis: (n) =>
      `Without Premium, only the first person on your list is open. With it, you get charts and transits for up to ${ljudi(n)}.`,
    otkljucajSve: 'Unlock everyone',
    tranzitiNeMogu: 'Transits can’t be calculated',
    tranzitiNeMoguTekst: (grad) =>
      `For ${grad} on that date, we don’t reliably know what time it was in UTC, so neither the chart nor its transits would be accurate.`,
    izmeniOpis: 'Edit birth details',
    pitajAstrologa: 'Ask an astrologer',
    /** `astrolog` = astrologer’s short name. */
    pitajTekst: (astrolog) => `${astrolog} sees this chart, so you can ask about this person or about the two of you.`,
    postaviPitanje: 'Ask a question',
  },

  /** `app/osoba-uredi.tsx` — table of another person’s details. */
  osobaUredi: {
    naslov: 'Edit',
    obrisatiNaslov: 'Delete this person?',
    obrisatiTekst: (ime) =>
      `${ime} will be removed from your list on all devices. Questions you’ve already asked about this person stay.`,
    odustani: 'Cancel',
    nijeIzabrano: 'Not selected',
    neZnaSe: 'Unknown',
    /** Note under the table; `bezVremena` adds the sentence about rising sign and houses. */
    napomena: (astrolog, bezVremena) =>
      (bezVremena ? 'Without a time of birth, the chart has no rising sign or houses. ' : '') + vidisSamoTi(astrolog),
    obrisiOsobu: 'Delete person',
  },

  /** `app/rodjenje-polje.tsx` — sheet with a single birth detail. */
  rodjenjePolje: {
    trebaInternet: 'You need an internet connection to make changes.',
    tvojeIme: 'Your name',
    vremeNijeUneto: 'No time entered — the chart has no rising sign or houses.',
    znamVreme: 'I know the time and want to enter it',
  },

  /** `app/nova-osoba/*` — new person, step by step. */
  novaOsoba: {
    napomena: 'Only you can see these birth details. We don’t share or sell them.',
    imeNaslov: 'What’s their name?',
    imePodnaslov: 'A name or nickname — only you can see it.',
    izaberiDatum: 'Choose a date',
    izaberiVreme: 'Choose a time',
    vremePodnaslov: 'Without a time, the chart has no rising sign or houses.',
    neMozemoKartu: 'We can’t calculate the chart',
    neMozemoKartuTekst: (grad, zona) =>
      `We don’t reliably know what time it was in UTC in ${grad} on that date. Try a different place of birth, or let us know — time zone: ${zona}`,
    nazadNaMesto: 'Back to place of birth',
    /** Date and time of birth, e.g. "Sat, May 12, 1990 at 14:30". */
    datumUVreme: (datum, vreme) => `${datum} at ${vreme}`,
    vidisSamoTi,
    trebaInternet: 'You need an internet connection to add a person.',
    dodajOsobu: 'Add person',
    potvrdiPristanak: 'Confirm consent',
    sunce: nebo.tela.sun,
    mesec: nebo.tela.moon,
    podznak: 'Rising',
    /** Screen reader: "Sun: Leo". */
    ulogaZnak: (uloga, znak) => `${uloga}: ${znak ?? 'unknown'}`,
    bezVremena: 'Without a time of birth, the rising sign and houses can’t be calculated. You can add the time later.',
    pristanak: 'This person knows I’m entering their birth details. If it’s a child, I’m their parent or guardian.',
  },
};
