import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  fallback: string;
}

/** Simple initial-based avatar with a solid accent background. */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, fallback, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-surface',
        className,
      )}
      {...props}
    >
      {fallback.slice(0, 1).toUpperCase()}
    </div>
  ),
);
Avatar.displayName = 'Avatar';

export { Avatar };
