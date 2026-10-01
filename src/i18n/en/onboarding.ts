import type { Recnik } from '../sr';
import { nebo } from './nebo';

/** Onboarding steps, sign-in and account — see `sr/onboarding.ts`. One object per screen, in flow order. */
export const onboarding: Recnik['onboarding'] = {
  korak: {
    odustani: 'Cancel',
    /** Default line above the button. */
    privatnost: 'We use this to calculate your birth chart. We never share or sell your data.',
  },

  welcome: {
    /** Under the name; the double spaces around the dot are intentional. */
    podnaslov: 'Est. 2004  ·  Belgrade',
    napraviNalog: 'Create account',
    vecImamNalog: 'I already have an account',
  },

  datum: {
    naslov: 'Date of birth',
    /** Button while the wheel has not been moved. */
    izaberi: 'Pick a date',
  },

  vreme: {
    naslov: 'Time of birth',
    izaberi: 'Pick a time',
    neZnam: "I don't know the time",
  },

  mesto: {
    naslov: 'Place of birth',
  },

  pretragaGrada: {
    placeholder: 'City',
    /** While cities arrive from the server. */
    trazimDalje: 'Searching further…',
  },

  reveal: {
    neMozemo: "We can't calculate your chart",
    zonaNepouzdana: (grad: string, zona: string) =>
      `We can't reliably tell what time it was in UTC in ${grad} on that date. Try another place of birth, or let us know — time zone: ${zona}`,
    nazadNaMesto: 'Back to place of birth',
    greskaCuvanja: "Your chart wasn't saved — we couldn't reach the server. Check your connection, then tap Continue again.",
    izvorPozicija: 'We calculate the positions from planetary motion data, for your exact moment and place of birth.',
    /** Screen-reader description of the planet image. */
    vladajucaPlaneta: (planeta: string) => `Ruling planet: ${planeta}`,
    /** Without a birth time: ruler of the Sun sign. */
    vladarZnaka: (planeta: string) => `Your sign's ruler: ${planeta}`,
    vladarKarte: (planeta: string) => `Your chart's ruler: ${planeta}`,
    /** Labels under the three signs. */
    sunce: 'Sun',
    mesec: 'Moon',
    podznak: 'Rising',
    /** Screen reader: "Sun: Leo"; without a birth time the rising sign is `nepoznat`. */
    uloga: (uloga: string, znak: string) => `${uloga}: ${znak}`,
    nepoznat: 'unknown',
    bezVremena: "Without a birth time, the Ascendant can't be calculated. You can add it later in your profile.",
  },

  nalogEmail: {
    naslovKod: "What's your email?",
    naslovLozinka: 'Create account',
    podnaslovKod: "We'll send you a sign-in code. No password, no ads, and we never share your email.",
    podnaslovLozinka: 'Your account keeps your chart when you change phones. We never share your email.',
    posaljiKod: 'Send me a code',
    placeholderEmail: 'Email address',
    placeholderLozinka: 'Password (at least 6 characters)',
    emailZauzet: 'This email already has an account. Enter a different one.',
    nijePodesen: "Accounts aren't set up yet.",
    robot: "We couldn't confirm you're not a robot. Check your connection and try again.",
    previsePokusaja: 'Too many attempts. Wait a minute and try again.',
    kodNijePoslat: "We couldn't send the code. Check your email address and your connection.",
    lozinkaNetacna: "An account with this email exists, but the password isn't correct.",
    lozinkaKratka: 'Password must be at least 6 characters.',
    nalogNijeNapravljen: "We couldn't create your account. Check your details and your connection.",
    /** Development only. */
    potvrdaUkljucena: 'Email confirmation is on in Supabase. Turn it off in Authentication → Sign In / Providers → Email.',
    nalogNijeUcitan: "We couldn't load your account. Check your connection and try again.",
    drustvenaPrijava: 'Sign in with Apple and Google will be turned on once we make a dev build.',
  },

  prijavaDugme: {
    apple: 'Continue with Apple',
    google: 'Continue with Google',
  },

  kod: {
    naslov: 'Enter the code',
    /** Subtitle: `poslatPre` + email (bold) + `poslatPosle`. */
    poslatPre: 'We sent a six-digit code to\n',
    poslatPosle: '.',
    potvrdi: 'Confirm',
    noviPoslat: 'A new code has been sent.',
    posaljiNovi: 'Send a new code',
    netacan: 'The code is wrong or has expired. Enter the code from the latest email, or send a new one.',
    nalogNijeUcitan: "The code is confirmed, but your account didn't load. Check your connection, then tap Confirm again.",
    robot: "We couldn't confirm you're not a robot. Try again.",
    sacekaj: 'Wait a minute before asking for a new code.',
    /** "Create account" with an email that already has a chart. */
    zauzetNaslov: 'This email already has an account',
    /** Subtitle: `pre` + email (bold) + `posle`. */
    zauzetPodnaslov: (datum: string, grad: string) => ({
      pre: 'The account ',
      posle: ` has a chart for ${datum}, ${grad}. For a new account, enter a different email.`,
    }),
    zauzetNapomena: "If you sign in to the existing account, the details from the previous steps won't be saved.",
    unesiDrugi: 'Enter a different email',
    udjiUTaj: 'Sign in to that account',
  },

  /** Screen-reader label. */
  poljeZaKod: 'Six-digit code',

  /** Shown when Cloudflare asks for a human check. */
  captcha: "Just confirming you're not a robot.",

  ime: {
    naslov: 'What should we call you?',
    podnaslov: 'That way your horoscope talks to you, not like a notice board.',
    placeholder: 'Your name',
  },

  /** Temporary name when nothing is left from the email (replaced on the name step). */
  podrazumevanoIme: 'You',

  /** Bar at the top of the content. */
  bezInterneta: "No internet. Showing what's saved on your phone.",

  promenaEmaila: {
    naslov: 'Change email',
    sadasnja: (stari: string) =>
      `Your current address is ${stari}. We'll send a code to the new one, and you'll sign in with it from then on.`,
    placeholder: 'New email address',
    upisiKod: (adresa: string) => `Enter the code we sent to ${adresa}.`,
    stariKod: (stari: string) => `One more step: enter the code we sent to your old address, ${stari}.`,
    potrebanInternet: 'You need an internet connection to change your email.',
    posaljiKod: 'Send code',
    potvrdi: 'Confirm',
    promeniAdresu: 'Change the address or resend the code',
    zauzeta: 'This address already has an account. Enter a different one.',
    upravoPoslat: 'A code was just sent. Wait a minute and try again.',
    netacan: 'The code is wrong or has expired. Check it, or ask for a new one.',
    nemaVeze: "Can't reach the server. Try again when you're back online.",
    /** `razvoj` = server message in parentheses, development only; otherwise empty. */
    nijeUspela: (razvoj: string) => `The change didn't go through. Try again in a minute.${razvoj}`,
  },

  nalog: {
    naslov: 'Account',
    imeIPrijava: 'Name and sign-in',
    ime: 'Name',
    email: 'Email',
    nacinPrijave: 'Sign-in method',
    /** By `app_metadata.provider`; an unknown provider is shown as it arrives. */
    nacin: {
      email: 'Email code',
      apple: 'Apple account',
      google: 'Google account',
    } as Record<string, string>,
    /** Row label; the value is a date. */
    nalogOd: 'Member since',
    podaciORodjenju: 'Birth details',
    datumRodjenja: 'Date of birth',
    vremeRodjenja: 'Time of birth',
    /** Row value when no birth time was entered. */
    neZnam: "Don't know",
    mestoRodjenja: 'Place of birth',
    /** Quotes the `vremeRodjenja` row label. */
    bezVremena: "Without a birth time, your rising sign and houses aren't reliable. Tap “Time of birth” to add it.",
    odjavaSvuda: 'Sign out of all devices',
    odjavaNaslov: 'Sign out of all devices?',
    odjavaTekst: "You'll be signed out on this phone and on every other device where you're signed in.",
    odustani: 'Cancel',
    odjaviSeSvuda: 'Sign out everywhere',
    brisanjeNaslov: 'Delete account',
    brisanjeTekst:
      "Permanently deletes your account, birth details, photo and questions to the astrologer. Your subscription isn't canceled automatically.",
    obrisiNalog: 'Delete account',
    obrisatiNaslov: 'Delete account?',
    obrisatiTekst:
      'Your account, name, photo and all birth details will be deleted. This cannot be undone.\n\n' +
      'This does NOT cancel your subscription — cancel it in your Apple or Google account settings.',
    nijeUspelo: "That didn't work",
    nijeObrisan: "Your account wasn't deleted. Check your connection and try again.",
  },

  push: {
    naslov: "So you don't miss your day",
    podnaslov: "Once in the morning, with that day's horoscope, and when the astrologer answers you. Nothing else.",
    podnaslovWeb: 'Notifications work on your phone; on the web we skip this step.',
    ukljuci: 'Turn on notifications',
    /** Three sample notifications on the phone illustration (the second one's title is the astrologer's name). */
    primerDanNaslov: 'Your day',
    primerDanTekst: "Today's horoscope is ready.",
    /** "Venus is trine your Sun." */
    primerAspektTekst: (tranzitna, aspekt, natalna) =>
      `${nebo.tela[tranzitna]} is ${({ conjunction: 'conjunct', opposition: 'opposite' } as Record<string, string>)[aspekt] ?? nebo.aspekti[aspekt]} your ${nebo.tela[natalna]}.`,
    primerOdgovorTekst: 'Answered your question.',
    sada: 'now',
    preSat: '1h ago',
    juce: 'yesterday',
  },
};
