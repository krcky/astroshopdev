/** Reci koje se ponavljaju na mnogo ekrana. Ekran sme da ih cita; posebno ime ide u svoj deo. */
export const opste = {
  imeAplikacije: 'Astro Shop',
  nastavi: 'Nastavi',
  sacuvaj: 'Sačuvaj',
  otkazi: 'Otkaži',
  zatvori: 'Zatvori',
  nazad: 'Nazad',
  pokusajPonovo: 'Pokušaj ponovo',
  u_redu: 'U redu',
  podeli: 'Podeli',
  obrisi: 'Obriši',
  izmeni: 'Izmeni',
  gotovo: 'Gotovo',
  preskoci: 'Preskoči',
  otkljucaj: 'Otključaj',
  /**
   * Imena zemalja ispod grada (izbor mesta rodjenja), po ISO kodu. Kratko — staje uz ime grada.
   * Zemlja van spiska ide imenom iz baze (`city-search.ts`).
   */
  zemlje: { RS: 'Srbija', HR: 'Hrvatska', BA: 'BiH', ME: 'Crna Gora', MK: 'S. Makedonija', SI: 'Slovenija', US: 'SAD' } as Record<string, string>,
};
