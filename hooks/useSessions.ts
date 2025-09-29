// hooks/useSessions.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type SessionEvent = {
  id: string;
  title: string;
  start: string; // ISO (UTC)
  end: string;   // ISO (UTC)
  status: 'scheduled' | 'completed' | 'canceled' | string;
  location: string | null;
  membername: string | null;
};

function getMonthRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

/** ✅ 범용 세션 훅: 역할/권한 가정 전혀 없음 */
export function useSessions(viewDate: Date) {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { fromISO, toISO } = useMemo(() => getMonthRange(viewDate), [viewDate]);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 👉 역할 필터 없이 기간만으로 조회
        const { data, error } = await supabase
          .from('sessions')
          .select('id, title, starts_at, ends_at, status, location, membername')
          .gte('starts_at', fromISO)
          .lt('starts_at', toISO)
          .order('starts_at', { ascending: true });

        if (error) throw error;
        if (abort) return;

        setEvents(
          (data ?? []).map((d: any) => ({
            id: d.id,
            title: d.title,
            start: d.starts_at,
            end: d.ends_at,
            status: d.status ?? 'scheduled',
            location: d.location ?? null,
            membername: d.membername ?? null,
          }))
        );
      } catch (e: any) {
        if (!abort) setError(e.message ?? '불러오기 실패');
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [fromISO, toISO]);

  return { events, loading, error, fromISO, toISO };
}
