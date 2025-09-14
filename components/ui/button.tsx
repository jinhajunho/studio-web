'use client';

import * as React from 'react';
import cn from 'clsx';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'destructive';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    let styles = '';
    switch (variant) {
      case 'ghost':
        styles =
          'bg-transparent hover:bg-gray-100 border border-transparent text-gray-900';
        break;
      case 'destructive':
        styles =
          'bg-red-600 text-white hover:bg-red-700 border border-transparent';
        break;
      default:
        styles = 'bg-black text-white hover:bg-gray-800 border border-transparent';
    }

    return (
      <button
        ref={ref}
        className={cn(base, styles, className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
