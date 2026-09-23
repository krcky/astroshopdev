/**
 * Nacin prijave.
 *
 * 'password' — email + lozinka. Radi ODMAH, bez ijedne poslate poruke.
 *              Uslov: u Supabase-u iskljuciti "Confirm email". Dok je tako,
 *              svako moze da se registruje tudjom adresom — niko je ne proverava.
 *
 * 'otp'      — sestocifreni kod na email. Uslovi:
 *              1. custom SMTP (SendGrid) u Supabase-u,
 *              2. `{{ .Token }}` u sablonu, ne `{{ .ConfirmationURL }}`,
 *              3. Email OTP Length = 6 — toliko prima /code ekran.
 *              Koji se sablon salje zavisi od "Confirm email": iskljucen ->
 *              uvek "Magic Link"; ukljucen -> nov korisnik dobija "Confirm
 *              signup", a onaj koji se vraca "Magic Link". Ako je ukljucen,
 *              `{{ .Token }}` mora da stoji u OBA.
 *
 * Ekran /code i sav OTP kod ostaju netaknuti — prebacivanje je izmena
 * ove jedne linije.
 */
export const AUTH_MODE: 'password' | 'otp' = 'otp';
