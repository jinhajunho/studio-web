'use client';
import * as React from 'react';
import cn from 'clsx';

type SheetContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
};
const SheetCtx = React.createContext<SheetContextType | null>(null);

type SheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
};
export function Sheet({ open, onOpenChange, children }: SheetProps) {
  const ctx = React.useMemo(() => ({ open, setOpen: onOpenChange }), [open, onOpenChange]);
  return <SheetCtx.Provider value={ctx}>{children}</SheetCtx.Provider>;
}

export function SheetContent({
  side = 'right',
  className,
  children,
}: {
  side?: 'right' | 'left';
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(SheetCtx);
  if (!ctx) return null;

  const isOpen = ctx.open;
  const translate =
    side === 'right'
      ? isOpen
        ? 'translate-x-0'
        : 'translate-x-full'
      : isOpen
      ? 'translate-x-0'
      : '-translate-x-full';

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => ctx.setOpen(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-xl transition-transform',
          side === 'right' ? 'right-0' : 'left-0',
          translate,
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

export function SheetHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b px-5 py-4">{children}</div>;
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function SheetDescription({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-gray-500">{children}</p>;
}

export default Sheet;
