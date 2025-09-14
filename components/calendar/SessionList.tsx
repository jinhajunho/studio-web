'use client';
import React from 'react';

export type Session = {
  id: string;
  title: string;
  starts_at: string; // ISO
  ends_at: string;   // ISO
  location?: string | null;
  status?: 'scheduled' | 'attended' | 'canceled';
};

export function SessionList({
  items, loading = false, emptyText = '예정된 수업이 없습니다.',
}: { items: Session[]; loading?: boolean; emptyText?: string; }) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }
  if (!items?.length) return <div className="text-sm text-gray-500">{emptyText}</div>;

  return (
    <ul className="space-y-2">
      {items.map((s) => {
        const st = new Date(s.starts_at);
        const et = new Date(s.ends_at);
        const statusClr =
          s.status === 'attended' ? 'text-emerald-600 border-emerald-200' :
          s.status === 'canceled' ? 'text-rose-600 border-rose-200' :
          'text-gray-600 border-gray-200';

        return (
          <li key={s.id} className="rounded-xl border border-gray-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium">{s.title}</div>
              <div className="text-xs text-gray-500">
                {st.toLocaleString()} ~ {et.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="mt-1 text-gray-700">
              {s.location ?? '장소 미정'} ·{' '}
              <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs ${statusClr}`}>
                {s.status === 'attended' ? '출석 완료' : s.status === 'canceled' ? '취소' : '예정'}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
export default SessionList;
