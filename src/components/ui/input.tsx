import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor="#9A9A9A"
      className={cn(
        'h-14 rounded-lg border border-input bg-background px-4 text-base text-foreground',
        className
      )}
      {...props}
    />
  );
}
