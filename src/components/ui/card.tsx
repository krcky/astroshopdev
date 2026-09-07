import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text, TextClassContext } from '@/components/ui/text';

export function Card({ className, ...props }: React.ComponentProps<typeof View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View className={cn('rounded-xl border border-border bg-card', className)} {...props} />
    </TextClassContext.Provider>
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('gap-1.5 p-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="h3" className={cn(className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="muted" className={cn(className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('flex-row items-center p-5 pt-0', className)} {...props} />;
}
