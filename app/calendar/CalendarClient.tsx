// app/calendar/CalendarClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CalendarHeader from '@/components/calendar/CalendarHeader';

type Props = {
  month: string;      // "YYYY-MM" - 서버에서 계산됨
  startISO: string;   // 현재 month 시작 UTC ISO
  endISO: string;     // 다음달 1일 UTC ISO
  initialView: 'month' | 'week' | 'day';
};

type Session = {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  instructor_id: string | null;
};

function getAdjacentMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, (m - 1) + delta, 1));
  const ny = d.getUTCFullYear();
  const nm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${ny}-${nm}`;
}

// 주/일 뷰 라벨 계산
function getWeekRangeLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 14));
  const start = new Date(
    Date.UTC(
      first.getUTCFullYear(),
      first.getUTCMonth(),
      first.getUTCDate() - (first.getUTCDay() || 7) + 1
    )
  );
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6)
  );
  const fm = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fm(start)} – ${fm(end)}, ${start.getUTCFullYear()}`;
}

export default function CalendarClient({ month, startISO, endISO, initialView }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [view, setView] = useState<'month' | 'week' | 'day'>(initialView);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  // URL 쿼리 → 뷰 동기화
  useEffect(() => {
    const urlView = params.get('view');
    if ((urlView === 'month' || urlView === 'week' || urlView === 'day') && urlView !== view) {
      setView(urlView);
    }
  }, [params, view]);

  // 세션 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, starts_at, ends_at, instructor_id')
        .gte('starts_at', startISO)
        .lt('starts_at', endISO)
        .order('starts_at', { ascending: true });

      if (!cancelled) {
        if (error) {
          console.error(error);
          setSessions([]);
        } else {
          setSessions(data ?? []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startISO, endISO]);

  // 네비게이션
  const goPrev = () => {
    const prev = getAdjacentMonth(month, -1);
    router.push(`/calendar?month=${prev}&view=${view}`);
  };
  const goNext = () => {
    const next = getAdjacentMonth(month, 1);
    router.push(`/calendar?month=${next}&view=${view}`);
  };
  const goToday = () => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    router.push(`/calendar?month=${y}-${m}&view=${view}`);
  };
  const setUrlView = (v: 'month' | 'week' | 'day') => {
    setView(v);
    router.replace(`/calendar?month=${month}&view=${v}`);
  };

  // 화면 표시용 데이터
  const items = useMemo(() => {
    return sessions.map((s) => ({
      id: s.id,
      title: s.title ?? '(제목 없음)',
      start: new Date(s.starts_at),
      end: new Date(s.ends_at),
    }));
  }, [sessions]);

  const monthTitle = (() => {
    const [y, m] = month.split('-');
    return `${y}-${m}`;
  })();
  const weekLabel = getWeekRangeLabel(month);
  const headerLabel = view === 'month' ? monthTitle : view === 'week' ? weekLabel : monthTitle;

  return (
    <div className="p-4">
      {/* ✅ 헤더를 분리 컴포넌트로 사용 */}
      <CalendarHeader
        monthLabel={headerLabel}
        view={view}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onChangeView={(v) => setUrlView(v)}
        onNew={() => alert('새 세션: 구현 예정')}
      />

      {/* 본문 */}
      {loading ? (
        <div className="text-sm text-gray-500">불러오는 중…</div>
      ) : (
        <CalendarTable items={items} view={view} month={month} />
      )}
    </div>
  );
}

/** 간단한 테이블 렌더러 (Month/Week/Day) */
function CalendarTable({
  items,
  view,
  month,
}: {
  items: { id: string; title: string; start: Date; end: Date }[];
  view: 'month' | 'week' | 'day';
  month: string;
}) {
  if (view === 'day') {
    const [y, m] = month.split('-').map(Number);
    const day = new Date(Date.UTC(y, m - 1, 15));
    const sameDay = (d: Date) =>
      d.getUTCFullYear() === day.getUTCFullYear() &&
      d.getUTCMonth() === day.getUTCMonth() &&
      d.getUTCDate() === day.getUTCDate();

    const dayItems = items.filter((e) => sameDay(e.start));
    return (
      <ul className="space-y-1">
        {dayItems.length === 0 ? (
          <li className="text-sm text-gray-500">가져온 세션: 0개</li>
        ) : (
          dayItems.map((e) => (
            <li key={e.id} className="text-sm">
              {e.start.toLocaleTimeString()} – {e.title}
            </li>
          ))
        )}
      </ul>
    );
  }

  if (view === 'week') {
    const [y, m] = month.split('-').map(Number);
    const base = new Date(Date.UTC(y, m - 1, 14));
    const start = new Date(
      Date.UTC(
        base.getUTCFullYear(),
        base.getUTCMonth(),
        base.getUTCDate() - (base.getUTCDay() || 7) + 1
      )
    );
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6)
    );

    const inWeek = (d: Date) =>
      d >= start && d < new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1));
    const weekItems = items.filter((e) => inWeek(e.start));
    return (
      <ul className="space-y-1">
        {weekItems.length === 0 ? (
          <li className="text-sm text-gray-500">가져온 세션: 0개</li>
        ) : (
          weekItems.map((e) => (
            <li key={e.id} className="text-sm">
              {e.start.toLocaleString()} – {e.title}
            </li>
          ))
        )}
      </ul>
    );
  }

  // month 뷰
  return (
    <ul className="space-y-1">
      {items.length === 0 ? (
        <li className="text-sm text-gray-500">가져온 세션: 0개</li>
      ) : (
        items.map((e) => (
          <li key={e.id} className="text-sm">
            {e.start.toLocaleDateString()} {e.start.toLocaleTimeString()} – {e.title}
          </li>
        ))
      )}
    </ul>
  );
}
