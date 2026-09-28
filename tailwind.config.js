/** @type {import('tailwindcss').Config} */

/*
 * Mere i imena prate `src/theme/tokens.ts` — to je izvor istine, ovde je samo
 * prepis u oblik koji NativeWind razume. Boje stizu kroz CSS varijable iz
 * `src/global.css`, da bi tamna tema mogla da ih zameni bez diranja klasa.
 */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        /*
         * `<alpha-value>` je OBAVEZAN da bi radilo `bg-card/80` — bela kartica
         * je poluprovidna (vidi DESIGN.md, poglavlje 5). Bez ovog zamenika
         * Tailwind nema gde da ubaci alfu u `hsl(...)` pa modifikator tiho
         * otpadne i kartica ispadne potpuno neprovidna.
         */
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* Dopune referentnog sistema. */
        grouped: 'hsl(var(--grouped))',
        fill: {
          DEFAULT: 'hsl(var(--fill))',
          strong: 'hsl(var(--fill-strong))',
        },
        subtle: 'hsl(var(--subtle))',

        /* Akcenti — samo ikone i mehurici. Pod `tint-` da ne zasene
           Tailwind-ove `red-500` i slicne skale. */
        tint: {
          blue: 'hsl(var(--tint-blue))',
          'blue-icon': 'hsl(var(--tint-blue-icon))',
          purple: 'hsl(var(--tint-purple))',
          red: 'hsl(var(--tint-red))',
          green: 'hsl(var(--tint-green))',
          pink: 'hsl(var(--tint-pink))',
          yellow: 'hsl(var(--tint-yellow))',
          gray: 'hsl(var(--tint-gray))',
          black: 'hsl(var(--tint-black))',
        },

        gold: 'hsl(var(--gold))',
      },

      borderRadius: {
        /* Kvadratic ikone u redu podesavanja. */
        tile: '8px',
        /* Mehuric poruke. */
        bubble: '16px',
        /* Sve pravougaone povrsine: kartica, panel, grupa redova. */
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
        /* Dugme, polje, kapsula, traka. */
        pill: '999px',
      },

      /*
       * Pismo je Plus Jakarta Sans (Ivan, 28.9.2026; `src/theme/font.ts`). `font-sans`
       * postoji samo za polja za unos (`TextInput`); `<Text>` bira familiju
       * sam, po klasi tezine. Kljuc `sans` Tailwind vec zna, pa `tailwind-merge`
       * ne treba dopunu u `lib/utils.ts`.
       */
      fontFamily: {
        sans: ['PlusJakartaSans-Regular'],
      },


      /* Velicine su izvedene iz visine verzala na snimcima; drugi broj je visina reda. */
      fontSize: {
        tab: ['11px', '13px'],
        caption: ['13px', '18px'],
        meta: ['15px', '20px'],
        chip: ['15px', '20px'],
        body: ['15px', '20px'],
        group: ['17px', '22px'],
        row: ['17px', '22px'],
        nav: ['18px', '23px'],
        button: ['17px', '22px'],
        section: ['20px', '25px'],
        title: ['21px', '26px'],
      },

      /* Izmerene visine elemenata. */
      height: {
        button: '50px',
        'button-compact': '46px',
        field: '48px',
        row: '57px',
        chip: '40px',
        tile: '28px',
        'header-button': '40px',
      },
      width: {
        tile: '28px',
        'header-button': '40px',
      },
      minHeight: {
        row: '57px',
        button: '50px',
      },

      spacing: {
        /* Leva i desna margina ekrana. */
        screen: '20px',
        gutter: '16px',
      },
    },
  },
  plugins: [],
};
