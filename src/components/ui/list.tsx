import * as React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { accent, neutral } from '@/theme/tokens';

/*
 * Grupisana lista — oblik koji referentna aplikacija koristi na ekranu
 * Podesavanja i svuda gde stoji niz srodnih redova.
 *
 * Tri pravila koja taj ekran drze na okupu:
 *   1. Pozadina ekrana je SIVA (#F6F7F8), kartice su bele. Obrnuto ne radi.
 *   2. Naslov grupe je siv, 16pt, obicnim slovima — bez verzala i bez razmaka
 *      medju slovima. Nije naljepnica, nego recenica.
 *   3. Linija izmedju redova ide OD IVICE DO IVICE kartice, i kad red ima
 *      ikonicu (Ivan, 29.9.2026 — pravilo za celu aplikaciju). Do tada je bila
 *      uvucena do pocetka teksta, po referentnoj aplikaciji.
 */

/** Pozadina ekrana na kom stoje grupe. Stavi je na koren ekrana. */
export const GROUPED_SCREEN = 'flex-1 bg-grouped';

/** Naslov iznad grupe: "Preferences", "Resources". */
export function GroupHeader({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="label" className={cn('mb-2 ml-screen mt-6', className)} {...props} />;
}

/** Bela kartica koja drzi redove. Linije izmedju redova crta sama, preko cele sirine. */
export function Group({
  className,
  children,
  ...props
}: React.ComponentProps<typeof View>) {
  const redovi = React.Children.toArray(children).filter(Boolean);
  return (
    <View className={cn('mx-screen overflow-hidden rounded-lg bg-card', className)} {...props}>
      {redovi.map((red, i) => (
        <React.Fragment key={i}>
          {i > 0 && <View className="h-px bg-border" />}
          {red}
        </React.Fragment>
      ))}
    </View>
  );
}

/** Boje kvadratica uz red. Imena su znacenje, ne nijansa. */
export const TILE = accent;

/**
 * Kvadratic ikone: 28pt, poluprecnik 8, puna boja, beli simbol unutra.
 *
 * Ovo je JEDINO mesto gde referentna aplikacija pusta boju u interfejs.
 * Zato je kvadratic mali i zato je simbol u njemu uvek beo — boja oznacava
 * vrstu stavke, a ne privlaci paznju na sebe.
 */
export function IconTile({
  color,
  children,
  className,
}: {
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      style={{ backgroundColor: color }}
      className={cn('h-tile w-tile items-center justify-center rounded-tile', className)}>
      {children}
    </View>
  );
}

type ListRowProps = {
  title: string;
  /** Sitan red ispod naslova. */
  subtitle?: string;
  /** Kvadratic ili avatar levo od teksta. */
  leading?: React.ReactNode;
  /** Sta stoji desno umesto strelice — vrednost, prekidac, spoljna strelica. */
  trailing?: React.ReactNode;
  /** Strelica desno. Podrazumevano stoji ako red nesto otvara. */
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  chevron,
  onPress,
  destructive,
}: ListRowProps) {
  const prikaziStrelicu = chevron ?? Boolean(onPress);

  const sadrzaj = (
    <View className="min-h-row flex-row items-center gap-3 px-gutter py-3">
      {leading}
      <View className="flex-1">
        <Text variant="row" className={cn(destructive && 'text-destructive')}>
          {title}
        </Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
      {trailing}
      {prikaziStrelicu ? <ChevronRight size={20} color={neutral.inkSubtle} strokeWidth={2.2} /> : null}
    </View>
  );

  if (!onPress) return sadrzaj;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="active:bg-fill">
      {sadrzaj}
    </Pressable>
  );
}
