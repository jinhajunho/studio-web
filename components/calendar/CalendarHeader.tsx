'use client';
import React from 'react';

export function CalendarHeader({
  value,
  onPrev,
  onNext,
  onToday,
  rightSlot,
  title = '캘린더',
  subtitle,
}: {
  value: Date;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  rightSlot?: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const ym = `${value.getFullYear()}년 ${value.getMonth() + 1}월`;
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-xs text-gray-500">{subtitle ?? ym}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onPrev} className="h-9 rounded-xl border px-3 hover:bg-gray-50">‹</button>
        <button onClick={onToday} className="h-9 rounded-xl border px-3 hover:bg-gray-50">오늘</button>
        <button onClick={onNext} className="h-9 rounded-xl border px-3 hover:bg-gray-50">›</button>
        {rightSlot}
      </div>
    </div>
  );
}
export default CalendarHeader;
