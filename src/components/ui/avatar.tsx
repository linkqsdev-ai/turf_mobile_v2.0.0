import * as React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Text } from './text';

const avatarVariants = cva('overflow-hidden rounded-full bg-muted items-center justify-center', {
  variants: {
    size: {
      xs: 'h-7 w-7',
      sm: 'h-9 w-9',
      md: 'h-11 w-11',
      lg: 'h-14 w-14',
      xl: 'h-20 w-20',
      '2xl': 'h-28 w-28',
    },
  },
  defaultVariants: { size: 'md' },
});

const textForSize: Record<string, string> = {
  xs: 'text-2xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
  '2xl': 'text-3xl',
};

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  uri?: string | null;
  name?: string;
  className?: string;
  ring?: boolean;
}

function initials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function Avatar({ uri, name, size = 'md', className, ring }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImage = !!uri && !failed && /^(https?:|file:|data:|content:)/.test(uri);

  return (
    <View
      className={cn(
        avatarVariants({ size }),
        ring && 'border-2 border-primary',
        className,
      )}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text className={cn('font-bold text-muted-foreground', textForSize[size ?? 'md'])}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

export function AvatarStack({
  people,
  max = 4,
  size = 'sm',
}: {
  people: { uri?: string | null; name?: string }[];
  max?: number;
  size?: AvatarProps['size'];
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <View className="flex-row items-center">
      {shown.map((p, i) => (
        <View key={i} className={i === 0 ? '' : '-ml-3'}>
          <Avatar uri={p.uri} name={p.name} size={size} className="border-2 border-background" />
        </View>
      ))}
      {extra > 0 ? (
        <View className="-ml-3 h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-secondary">
          <Text className="font-bold text-2xs text-secondary-foreground">+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}
