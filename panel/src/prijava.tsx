import { useEffect, useRef, useState } from 'react';

import { supabase, TURNSTILE_KLJUC } from './supabase';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, o: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

/**
 * Prijava kodom na email — isti put kao u aplikaciji (`signInWithOtp`), ali
 * `shouldCreateUser: false`: panel ne pravi naloge. Nalog astrologa pravi vlasnik
 * (vidi `supabase/pitanja.sql`, zaglavlje).
 *
 * CAPTCHA: Supabase trazi Turnstile token za svako slanje koda (pravilo 15).
 * Widget radi samo na hostname-ima upisanim u Cloudflare-u — za razvoj na
 * `localhost` taj hostname mora da se doda u widget.
 */
export function Prijava() {
  const [email, setEmail] = useState('');
  const [kod, setKod] = useState('');
  const [poslat, setPoslat] = useState(false);
  const [radim, setRadim] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const captcha = useTurnstile();

  const posaljiKod = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!mail.includes('@')) { setGreska('Upiši email adresu.'); return; }
    if (TURNSTILE_KLJUC && !captcha.token) { setGreska('Sačekaj proveru ispod polja, pa pošalji ponovo.'); return; }
    setRadim(true); setGreska(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: mail,
      options: { shouldCreateUser: false, captchaToken: captcha.token ?? undefined },
    });
    captcha.reset(); // token je jednokratan
    setRadim(false);
    if (error) {
      setGreska(/signup|not allowed|not found/i.test(error.message)
        ? 'Za ovaj email ne postoji nalog. Nalog za panel otvara Ivan.'
        : /rate|seconds/i.test(error.message)
          ? 'Previše pokušaja. Sačekaj minut pa probaj ponovo.'
          : `Kod nije poslat (${error.message}).`);
      return;
    }
    setPoslat(true);
  };

  const prijavi = async (e: React.FormEvent) => {
    e.preventDefault();
    setRadim(true); setGreska(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: kod.trim(), type: 'email' });
    setRadim(false);
    if (error) setGreska('Kod nije tačan ili je istekao. Proveri svih šest cifara ili zatraži nov.');
  };

  return (
    <div className="uska">
      <h1>Pitanja za astrologa</h1>
      <p className="siv" style={{ marginBottom: 24 }}>
        {poslat ? `Kod je poslat na ${email.trim()}. Stiže za minut.` : 'Prijava kodom koji stiže na email.'}
      </p>

      {/* Forma za email ostaje montirana i kad je skrivena — u njoj zivi Turnstile widget. */}
      <form onSubmit={posaljiKod} style={{ display: poslat ? 'none' : 'block' }}>
        <div className="polje">
          <input type="email" autoFocus autoComplete="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {TURNSTILE_KLJUC && <div ref={captcha.mesto} style={{ marginTop: 12 }} />}
        <button className="crno puno" style={{ marginTop: 16 }} disabled={radim}>{radim ? 'Šaljem…' : 'Pošalji kod'}</button>
      </form>

      {poslat && (
        <form onSubmit={prijavi}>
          <div className="polje">
            <input
              type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6}
              className="kod" placeholder="······" value={kod} onChange={(e) => setKod(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button className="crno puno" style={{ marginTop: 16 }} disabled={radim || kod.length !== 6}>{radim ? 'Proveravam…' : 'Prijavi se'}</button>
          <div className="red-dugmadi">
            <button type="button" className="tiho" onClick={() => { setPoslat(false); setKod(''); }}>Drugi email ili nov kod</button>
          </div>
        </form>
      )}

      {greska && <p className="greska">{greska}</p>}
    </div>
  );
}

/** Turnstile widget: token u stanju, `reset` posle svakog slanja. */
function useTurnstile() {
  const mesto = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_KLJUC || !mesto.current) return;
    const nacrtaj = () => {
      if (!window.turnstile || !mesto.current || widget.current) return;
      widget.current = window.turnstile.render(mesto.current, {
        sitekey: TURNSTILE_KLJUC,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(null),
        'error-callback': () => { setToken(null); return true; },
      });
    };
    if (window.turnstile) { nacrtaj(); return; }
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = nacrtaj;
    document.head.appendChild(s);
  }, []);

  return {
    mesto,
    token,
    reset: () => { setToken(null); if (window.turnstile && widget.current) window.turnstile.reset(widget.current); },
  };
}
