'use client';
import * as React from 'react';
import cn from 'clsx';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[96px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
      'focus:outline-none focus:ring-2 focus:ring-gray-300',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export default Textarea;
