import * as React from 'react';

import { Text } from '@/components/ui/text';

/**
 * Naslov koji NE lomi rec (Ivan, 28.9.2026: "transformacij / a"). U uskoj koloni
 * pored ilustracije duga rec ne stane u red, pa je sistem sece. Posle crtanja se
 * proveri svaka granica reda: ako u tekstu na tom mestu nije razmak ni crtica,
 * rec je presecena — slova se smanje za korak i proba ponovo, do `min`.
 * Na webu `onTextLayout` ne postoji; tamo ostaje zadata velicina.
 */
export function NaslovCeleReci({ children, size, lineHeight, min, variant = 'display', className }: {
  children: string;
  /** Pocetna velicina i prored u tackama. */
  size: number;
  lineHeight: number;
  /** Najmanja velicina do koje se sme spustiti. */
  min: number;
  variant?: React.ComponentProps<typeof Text>['variant'];
  className?: string;
}) {
  const [velicina, setVelicina] = React.useState(size);
  React.useEffect(() => setVelicina(size), [children, size]);
  const k = velicina / size;
  return (
    <Text
      variant={variant}
      className={className}
      style={{ fontSize: velicina, lineHeight: Math.round(lineHeight * k) }}
      onTextLayout={(e) => {
        // Granica reda je "cista" ako u ORIGINALNOM tekstu na tom mestu stoji
        // razmak ili crtica — ne oslanja se na to da li sistem ostavlja razmak
        // na kraju reda (iOS i Android se tu razlikuju).
        const redovi = e.nativeEvent.lines;
        let poz = 0;
        let presecena = false;
        for (let i = 0; i < redovi.length - 1; i++) {
          poz += redovi[i].text.length;
          const pre = children[poz - 1] ?? ' ';
          const posle = children[poz] ?? ' ';
          if (!/[\s\-–—]/.test(pre) && !/[\s\-–—]/.test(posle)) presecena = true;
          // Ako je sistem izostavio razmak sa kraja reda, preskoci ga u originalu.
          while (/\s/.test(children[poz] ?? '')) poz++;
        }
        if (presecena && velicina > min) setVelicina((v) => Math.max(min, v - 2));
      }}>
      {children}
    </Text>
  );
}
