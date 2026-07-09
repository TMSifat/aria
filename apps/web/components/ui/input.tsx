import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-[10px] border border-text-base/25 bg-surface-raised px-3.5 py-2 text-[14.5px] text-text-base transition-colors',
          'placeholder:text-faint focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
