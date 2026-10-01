import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

import { GlassBubble } from '@/components/ui/glass-button';
import { Text } from '@/components/ui/text';
import { dostupniJezici, IME_JEZIKA, ZASTAVA, useJezik, useT, type Jezik } from '@/i18n';
import { cn } from '@/lib/utils';
import { useJezikStore } from '@/store/jezik';
import { neutral, shadow } from '@/theme/tokens';

/** "🇷🇸 Srpski" — ime jezika je na SVOM jeziku i ne prevodi se. */
export const natpis = (j: Jezik) => `${ZASTAVA[j]}  ${IME_JEZIKA[j]}`;

const SIRINA = 220;

/**
 * Izbor jezika BEZ sistemskog stakla (Android, iOS < 26, veb): kapsula (`GlassBubble`), pa bela
 * kartica sa jezicima ispod nje — Android `Alert` prima najvise tri dugmeta, a jezika je sest.
 * Na iOS-u 26 je pravi sistemski meni (`izbor-jezika.ios.tsx`).
 */
export function IzborJezikaRezerva() {
  const jezik = useJezik();
  const izaberi = useJezikStore((s) => s.izaberi);
  return <PadajuciIzbor jezik={jezik} jezici={dostupniJezici()} onIzbor={izaberi} />;
}

function PadajuciIzbor({ jezik, jezici, onIzbor }: { jezik: Jezik; jezici: Jezik[]; onIzbor: (j: Jezik) => void }) {
  const [mesto, setMesto] = React.useState<{ x: number; y: number } | null>(null);
  const okidac = React.useRef<View>(null);
  const otvori = () => okidac.current?.measureInWindow((x, y, w, h) => setMesto({ x: x + w, y: y + h + 8 }));

  return (
    <View ref={okidac} collapsable={false}>
      <GlassBubble>
        <Pressable
          onPress={otvori}
          accessibilityRole="button"
          accessibilityLabel={IME_JEZIKA[jezik]}
          className="h-full flex-row items-center gap-1.5 px-4 active:opacity-60">
          <Text variant="row">{natpis(jezik)}</Text>
          <ChevronDown size={16} color={neutral.ink} />
        </Pressable>
      </GlassBubble>
      <SpisakJezika otvoren={!!mesto} mesto={mesto} jezik={jezik} jezici={jezici} onIzbor={onIzbor} onClose={() => setMesto(null)} />
    </View>
  );
}

/**
 * Bela kartica sa jezicima (zastava, ime, kvacica na izabranom) preko ekrana. `mesto` = desni
 * donji ugao okidaca (spisak visi ispod njega); bez `mesta` je na sredini ekrana (profil).
 * Za Android i iOS < 26 — na iOS-u 26 izbor je sistemski meni.
 */
export function SpisakJezika({ otvoren, mesto, jezik, jezici, onIzbor, onClose }: {
  otvoren: boolean;
  mesto?: { x: number; y: number } | null;
  jezik: Jezik;
  jezici: Jezik[];
  onIzbor: (j: Jezik) => void;
  onClose: () => void;
}) {
  const t = useT();
  const polozaj = mesto
    // Desna ivica spiska poravnata sa desnom ivicom kapsule.
    ? { position: 'absolute' as const, top: mesto.y, left: Math.max(16, mesto.x - SIRINA), width: SIRINA }
    : { width: SIRINA };
  return (
    <Modal visible={otvoren} transparent animationType="fade" onRequestClose={onClose}>
      {/* Dodir van spiska zatvara. */}
      <Pressable
        className={cn('flex-1', !mesto && 'items-center justify-center')}
        onPress={onClose}
        accessibilityLabel={t.opste.zatvori}>
        <View style={[polozaj, shadow.soft]} className="overflow-hidden rounded-xl border border-border bg-card">
          {jezici.map((j, i) => (
            <Pressable
              key={j}
              onPress={() => { onClose(); onIzbor(j); }}
              accessibilityRole="button"
              accessibilityState={{ selected: j === jezik }}
              className={cn('flex-row items-center justify-between px-4 py-3 active:opacity-60', i > 0 && 'border-t border-border')}>
              <Text variant="row">{natpis(j)}</Text>
              {j === jezik && <Check size={18} color={neutral.ink} />}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
