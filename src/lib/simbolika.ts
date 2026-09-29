/**
 * "Simbolika" na listu natalnog tumacenja (kao na sajtu, Ivan 28.9.2026):
 * kljucne reci za planetu, znak, kucu i aspekt, iznad teksta.
 *
 * IZVOR: `files/simbolika/` (Ivan, 28.9.2026) — tekst astrologa, ne nas:
 *   planete i znakovi  "Planete i znakovi simbolika PDF tekst.docx" (po 7 reci)
 *   Ascendent          "Ascendent simbolika.docx"
 *   kuce               "Kuće značenje.docx"
 *   aspekti            "Aspekti značenje.docx" (tema + recenica)
 * Neiskorisceno: "Chart PDF simbolika.docx" (kraca verzija kuca i jedna
 * recenica po planeti) — rezerva ako liste budu preduge.
 * Oblik kao na sajtu: prva rec velikim, ostale malim, tacka na kraju.
 * Ispravljene slovne greske: Hrabarost, Izražajanost, Dramatičanost,
 * Inrospektivnost, Samosvestnost, frustaciju, "energije su fluiden", "rada,resursi".
 *
 * Cist podatak, bez RN uvoza (pravilo 6).
 */
export const SIMBOLIKA_PLANETA: Record<string, string> = {
  sun: 'Čast, autoritet, vitalnost, stvaralaštvo, otac, ličnost, ego.',
  moon: 'Mašta, osećajnost, kuća, nestalnost, majka, žena, put.',
  mercury: 'Okretnost, brzina, trgovina, govor, pisanje, intelekt, promišljenost.',
  venus: 'Ljubav, umetnost, gracioznost, deca, ženska seksualnost, naklonost, harmonija.',
  mars: 'Impulsivnost, snaga, moral, zdravlje, inicijativa, muška seksualnost, akcija.',
  jupiter: 'Ekspanzija, moral, religija, muzika, dobronamernost, sreća, plemenitost.',
  saturn: 'Nekretnina, dubina, metodologija, stabilnost, bezbednost, učitelj, disciplina.',
  uranus: 'Elektronika, futurizam, individualizam, originalnost, pronalasci, intuicija, naizmeničnost.',
  neptune: 'Inspiracija, tajnovitost, intuicija, umetnost, duhovnost, iluzija, ideali.',
  pluto: 'Fatalnost, mističnost, transcendentalno, reforma, transformacija, izolovanost, nesvesno.',
  ascendant: 'Vi na prvi pogled, ličnost, izgled, stil, maniri, identitet.',
};

export const SIMBOLIKA_ZNAKA: Record<string, string> = {
  aries: 'Odlučnost, tačnost, impulsivnost, hrabrost, dinamičnost, pravednost, vernost.',
  taurus: 'Doslednost, strpljivost, praktičnost, pouzdanost, promišljenost, konzervativnost, odanost.',
  gemini: 'Radoznalost, okretnost, informisanost, prilagodljivost, izražajnost, spretnost, svestranost.',
  cancer: 'Intuitivnost, požrtvovanost, tolerantnost, saosećajnost, emotivnost, tradicionalnost, istrajnost.',
  leo: 'Dramatičnost, darežljivost, samosvesnost, ambicioznost, kreativnost, dostojanstvenost, pouzdanost.',
  virgo: 'Analitičnost, opreznost, pedantnost, preciznost, humanost, prefinjenost, metodičnost.',
  libra: 'Druželjubivost, harmoničnost, pravednost, diplomatičnost, ljubaznost, rafiniranost, miroljubivost.',
  scorpio: 'Odlučnost, upornost, hladnokrvnost, strastvenost, tajanstvenost, smelost, prodorljivost.',
  sagittarius: 'Velikodušnost, samostalnost, tolerantnost, etičnost, samoživost, plemenitost, odanost.',
  capricorn: 'Odmerenost, istrajnost, opreznost, tradicionalnost, odgovornost, praktičnost, ozbiljnost.',
  aquarius: 'Nezavisnost, intuitivnost, društvenost, inventivnost, humanost, individualnost, progresivnost.',
  pisces: 'Saosećajnost, intuitivnost, prilagodljivost, odanost, tolerantnost, introspektivnost, marljivost.',
};

/** Po broju kuce, 1—12. */
export const SIMBOLIKA_KUCE: Record<number, string> = {
  1: 'Identitet, fizičko telo, karakter, temperament, ličnost, ego, sklonosti, tendencije.',
  2: 'Materijalne vrednosti, lične finansije, dobici od rada, resursi, imovina, dnevne potrebe, hedonizam.',
  3: 'Neposredni odnosi, bliski rod, komunikacija, intelekt, svakodnevnica, mediji, kraća putovanja.',
  4: 'Bezbednost, rodna kuća, nekretnine, nasledstvo, preci, prošlost, tradicija.',
  5: 'Kreativnost, astralno telo, ljubav prema nekom, potomci, zabava, škola, hobi.',
  6: 'Dužnost, zdravlje, higijena, hrana, zanimanje, vidljive prepreke, briga o sebi i drugima.',
  7: 'Partnerstvo, javni život, brak, drugovi, dela, procesi, javni neprijatelji.',
  8: 'Regeneracija, akcije, borbe, krize, dobici od nasleđa, strahovi, intima.',
  9: 'Težnje, eterično telo, filozofija, religija, snovi i vizije, daleki rod, daleka putovanja.',
  10: 'Status, načela, rezultati rada, ambicija, autoriteti, karijera, dostignuća.',
  11: 'Društvenost, prijatelji, kosmopolitska ljubav, planovi, konekcije, protekcije, nade.',
  12: 'Podsvest, nevidljive prepreke, slabosti, tajni neprijatelji, ograničenja, izolacija, kazne.',
};

/** Tema ("Borba") ide uz ime aspekta, opis ispod. */
export const SIMBOLIKA_ASPEKTA: Record<string, { tema: string; opis: string }> = {
  conjunction: { tema: 'Borba', opis: 'Najjača mešavina energija koju predstavljaju dve planete.' },
  sextile: { tema: 'Mogućnost', opis: 'Planetarne energije su usklađene i harmonične, jednostavan protok informacija.' },
  square: { tema: 'Dinamičnost', opis: 'Konflikt planetarnih energija, stres, kreativna napetost, napor i prepreke.' },
  trine: { tema: 'Tok', opis: 'Planetarne energije su fluidne i donose sreću, nove prilike i harmoniju.' },
  opposition: { tema: 'Izazov', opis: 'Planetarne energije su polarizovane i stvaraju napetost, tenziju i izazivaju frustraciju.' },
};
