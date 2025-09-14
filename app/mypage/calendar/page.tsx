'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  addMonths, endOfMonth, format, startOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';

type CalendarEvent = {
  event_id: string;
  member_id: string;
  instructor_id: string | null;
  title: string;
  memo: string | null;
  status: string;
  start: string; // ISO
  end: string;   // ISO
  instructor_name: string | null;
};

export default function MemberCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Quick Policy #1: 로딩/빈상태 문구 정리
  const EmptyState = ({ text }: { text: string }) => (
    <div className="opacity-70 border rounded-xl p-4 text-center">{text}</div>
  );

  // 이번 달 + 앞뒤 1주 버퍼
  const monthRange = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const from = startOfWeek(monthStart, { locale: ko });
    const to = endOfWeek(monthEnd, { locale: ko });
    return { from, to };
  }, [currentMonth]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('v_member_calendar')
          .select('*')
          .gte('start', monthRange.from.toISOString())
          .lte('start', monthRange.to.toISOString())
          .order('start', { ascending: true });

        if (error) throw error;
        if (mounted) setEvents((data ?? []) as CalendarEvent[]);
      } catch (e: any) {
        if (mounted) {
          setError(e?.message ?? '일정을 불러오지 못했습니다.');
          // ── Quick Policy #3: 에러 토스트 3.5초 표시
          setTimeout(() => setError(null), 3500);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [monthRange]);

  // 달력 주차 나누기
  const weeks = useMemo(() => {
    const days = eachDayOfInterval({ start: monthRange.from, end: monthRange.to });
    const out: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [monthRange]);

  // 날짜별 이벤트 그룹
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = format(new Date(ev.start), 'yyyy-MM-dd');
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(ev);
    }
    return map;
  }, [events]);

  const now = useMemo(() => new Date(), [events]); // render 시점 now

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button
          className="px-3 py-2 rounded-xl border"
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
        >
          이전
        </button>
        <div className="text-xl font-semibold">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </div>
        <button
          className="px-3 py-2 rounded-xl border"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          다음
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-2">
        {['일','월','화','수','목','금','토'].map((d) => (
          <div key={d} className="text-center text-sm font-medium opacity-70">{d}</div>
        ))}

        {/* 날짜 셀 */}
        {weeks.map((week, wi) => (
          <div key={wi} className="contents">
            {week.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay.get(key) ?? [];
              return (
                <div
                  key={key}
                  className={[
                    'min-h-24 rounded-xl border p-2 flex flex-col gap-1',
                    isSameMonth(day, currentMonth) ? '' : 'opacity-40',
                    isSameDay(day, new Date()) ? 'border-2' : ''
                  ].join(' ')}
                >
                  <div className="text-xs font-semibold">{format(day, 'd')}</div>
                  <div className="flex-1 flex flex-col gap-1">
                    {dayEvents.slice(0,3).map((ev) => {
                      const isPast = new Date(ev.end) < now; // ── Quick Policy #2: 과거 일정 옅게
                      return (
                        <div
                          key={ev.event_id}
                          className={[
                            'text-xs rounded-lg border px-2 py-1',
                            isPast ? 'opacity-50' : ''
                          ].join(' ')}
                          title={ev.memo ?? undefined}
                        >
                          <div className="font-medium">{ev.title}</div>
                          <div className="opacity-70">
                            {format(new Date(ev.start), 'HH:mm')}–{format(new Date(ev.end), 'HH:mm')}
                          </div>
                          {ev.instructor_name && (
                            <div className="opacity-60">강사: {ev.instructor_name}</div>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs opacity-60">+{dayEvents.length - 3}개 더보기</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 하단 리스트 */}
      <div className="space-y-2">
        <div className="text-lg font-semibold">다가오는 일정</div>
        {loading && <EmptyState text="불러오는 중…" />}
        {!loading && events.length === 0 && <EmptyState text="이번 달 예정된 수업이 없습니다." />}
        {!loading && events.length > 0 && (
          <div className="divide-y">
            {events.map((ev) => {
              const isPast = new Date(ev.end) < now;
              return (
                <div key={ev.event_id} className={['py-3', isPast ? 'opacity-60' : ''].join(' ')}>
                  <div className="font-medium">{ev.title}</div>
                  <div className="text-sm opacity-80">
                    {format(new Date(ev.start), 'M월 d일 (EEE) HH:mm', { locale: ko })} ~ {format(new Date(ev.end), 'HH:mm')}
                    {ev.instructor_name ? ` · 강사: ${ev.instructor_name}` : ''}
                  </div>
                  {ev.memo && <div className="text-sm opacity-70 mt-1">{ev.memo}</div>}
                  <div className="text-xs mt-1 opacity-60">상태: {ev.status}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Policy #3: 에러 토스트 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
