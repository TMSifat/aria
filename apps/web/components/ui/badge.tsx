import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-surface-raised border-border text-primary-text',
        success: 'bg-success/10 border-success/30 text-success',
        destructive:
          'bg-destructive/10 border-destructive/30 text-destructive',
        outline: 'border-border text-muted',
        solid: 'bg-text-base border-transparent text-surface',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
