'use client';
import * as React from 'react';
import cn from 'clsx';

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-gray-800', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export default Label;
