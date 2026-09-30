import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/**
 * Kvacica sa recenicom pored (pristanak pri dodavanju osobe, "o nama dvoma" uz
 * pitanje, 29.9.2026). Ceo red je meta dodira.
 */
export function Kvacica({ ukljuceno, onPromena, children, className }: {
  ukljuceno: boolean;
  onPromena: (v: boolean) => void;
  children: string;
  className?: string;
}) {
  return (
    <Pressable
      onPress={() => onPromena(!ukljuceno)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: ukljuceno }}
      className={cn('flex-row items-center gap-3 py-1 active:opacity-60', className)}>
      <View className={cn('h-6 w-6 items-center justify-center rounded-md border-2 border-foreground', ukljuceno && 'bg-foreground')}>
        {ukljuceno && <Check size={16} color={neutral.white} strokeWidth={3} />}
      </View>
      <Text variant="default" className="flex-1">{children}</Text>
    </Pressable>
  );
}
