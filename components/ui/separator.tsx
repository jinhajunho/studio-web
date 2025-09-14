'use client';
import * as React from 'react';
import cn from 'clsx';

export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-gray-200', className)} />;
}
export default Separator;
