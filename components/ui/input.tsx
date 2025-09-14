'use client';
import * as React from 'react';
import cn from 'clsx';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-gray-300',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export default Input;
