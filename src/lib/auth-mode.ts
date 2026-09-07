/**
 * Nacin prijave.
 *
 * 'password' — email + lozinka. Radi ODMAH, bez ijedne poslate poruke.
 *              Uslov: u Supabase-u iskljuciti "Confirm email".
 *
 * 'otp'      — sestocifreni kod na email. Trazi podesen SMTP (Resend) i
 *              `{{ .Token }}` u sablonima "Confirm signup" I "Magic Link".
 *
 * Ekran /code i sav OTP kod ostaju netaknuti — prebacivanje je izmena
 * ove jedne linije.
 */
export const AUTH_MODE: 'password' | 'otp' = 'password';
