'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type SessionEvent = {
  id: string;
  title: string;
  start: string; // ISO (UTC)
  end: string;   // ISO (UTC)
  status: 'scheduled' | 'completed' | 'canceled';
  location: string | null;
  membername: string | null;
};

function getMonthRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);               // local first day 00:00
  const to   = new Date(date.getFullYear(), date.getMonth() + 1, 1);          // next month 00:00
  return {
    fromISO: from.toISOString(),
    toISO: to.toISOString(),
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useInstructorSessions(viewDate: Date) {
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
        // status 필터: 필요 없으면 null 전달
        const { data, error } = await supabase
          .rpc('get_my_instructor_sessions', {
            p_from: fromISO,
            p_to: toISO,
            p_status: ['scheduled'], // 초기엔 예정만; 모두 보려면 null로 바꿔도 됨
          });

        if (error) throw error;
        if (abort) return;

        setEvents(
          (data ?? []).map((d: any) => ({
            id: d.id,
            title: d.title,
            start: d.start, // 그대로 ISO(UTC) → 렌더러에서 KST로 표시
            end: d.end,
            status: d.status,
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
