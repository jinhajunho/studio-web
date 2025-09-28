// app/calendar/page.tsx
'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import SessionDrawer from '@/components/SessionDrawer';
import StudioCalendar, { StudioEvent } from '@/components/StudioCalendar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ===== 날짜 유틸 =====
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInputValue = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

function getMonthRange(search: string) {
  const params = new URLSearchParams(search);
  const monthStr = params.get('month'); // YYYY-MM
  const now = new Date();
  const year = monthStr ? Number(monthStr.split('-')[0]) : now.getFullYear();
  const month = monthStr ? Number(monthStr.split('-')[1]) - 1 : now.getMonth();

  const start = new Date(year, month, 1, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0);

  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    label: `${year}-${pad(month + 1)}`,
    y: year,
    m: month + 1,
  };
}
function shiftMonth(y: number, m: number, diff: number) {
  const d = new Date(y, m - 1 + diff, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

// ===== 상태 유틸 =====
const ALLOWED_STATUS = ['scheduled', 'completed', 'canceled'] as const;
type Status = (typeof ALLOWED_STATUS)[number];
const normalizeStatus = (v: any): Status =>
  (ALLOWED_STATUS as readonly string[]).includes(v) ? (v as Status) : 'scheduled';

// ===== 타입 =====
type InstructorOption = { id: string; name: string };

// ===== 페이지 컴포넌트 =====
export default function CalendarPage() {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'create' | 'edit'>('create');
  const [initialValues, setInitialValues] = React.useState<any>({});
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [events, setEvents] = React.useState<StudioEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [userId, setUserId] = React.useState<string | null>(null);
  const [instructors, setInstructors] = React.useState<InstructorOption[]>([]);

  // 취소 포함 토글
  const [showCanceled, setShowCanceled] = React.useState(false);

  // 월 파라미터
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const { startISO, endISO, label, y, m } = React.useMemo(
    () => getMonthRange(search),
    [search]
  );

  // 로그인 + 강사 목록
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);

      const { data: ins, error: insErr } = await supabase
        .from('instructors')
        .select('id,name')
        .order('name', { ascending: true });
      if (insErr) {
        // 강사 테이블이 없거나 RLS로 막혀도 캘린더는 동작해야 하므로 조용히 무시
        return;
      }
      if (ins) setInstructors(ins);
    })();
  }, []);

  // ===== 세션 로드 (모두 보기; 프론트에서 권한 필터 없음) =====
  const loadSessions = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, starts_at, ends_at, status, location, member_id, instructor_id')
        .gte('starts_at', startISO)
        .lt('starts_at', endISO)
        .order('starts_at', { ascending: true });

      if (error) throw error;

      const mapped: StudioEvent[] =
        (data ?? [])
          .filter((s: any) => (showCanceled ? true : normalizeStatus(s.status) !== 'canceled'))
          .map((s: any) => {
            const st = normalizeStatus(s.status);
            return {
              id: s.id,
              title: s.title,
              start: s.starts_at,
              end: s.ends_at ?? s.starts_at,
              extendedProps: {
                status: st,
                location: s.location,
                memberId: s.member_id,
                instructorId: s.instructor_id, // 편집 시 기본값 채우기 용
              },
            };
          });

      setEvents(mapped);
    } catch (e: any) {
      setErr(e?.message ?? '세션 불러오기 오류');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [startISO, endISO, showCanceled]);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ===== CRUD (프론트에서는 권한 체크 없음; 실패 시 DB/RLS 오류를 메시지로 표시) =====
  async function createSession(vals: any) {
    try {
      if (!vals.startAt || !vals.endAt) throw new Error('시작/종료 시간을 입력하세요.');
      const s = new Date(vals.startAt), e = new Date(vals.endAt);
      if (!(s.getTime() < e.getTime())) throw new Error('종료 시간이 시작보다 뒤여야 합니다.');

      // instructor_id는 스키마상 필수일 가능성이 높으므로 FK 검증
      const chosenInstructorId = vals.instructorId || '';
      if (!chosenInstructorId) throw new Error('강사를 선택하세요.');

      const { data: found } = await supabase
        .from('instructors')
        .select('id')
        .eq('id', chosenInstructorId)
        .maybeSingle();
      if (!found) throw new Error('유효한 강사가 아닙니다.');

      const payload = {
        title: vals.title?.trim() || '무제 세션',
        starts_at: s.toISOString(),
        ends_at: e.toISOString(),
        instructor_id: chosenInstructorId,
        status: normalizeStatus(vals.status),
        location: vals.location || null,
        member_id: vals.memberId || null,
      };

      const { error } = await supabase.from('sessions').insert([payload]).single();
      if (error) throw error;

      setOpen(false);
      await loadSessions();
      toast.success('세션 생성 완료');
    } catch (e: any) {
      toast.error(e?.message || '세션 생성 오류');
    }
  }

  async function updateSession(id: string, vals: any) {
    try {
      const s = new Date(vals.startAt), e = new Date(vals.endAt);
      if (!(s.getTime() < e.getTime())) throw new Error('종료 시간이 시작보다 뒤여야 합니다.');

      const payload: any = {
        title: vals.title?.trim() || '무제 세션',
        starts_at: s.toISOString(),
        ends_at: e.toISOString(),
        status: normalizeStatus(vals.status),
        location: vals.location || null,
        member_id: vals.memberId || null,
      };
      if (vals.instructorId) {
        const { data: found } = await supabase
          .from('instructors')
          .select('id')
          .eq('id', vals.instructorId)
          .maybeSingle();
        if (!found) throw new Error('유효한 강사가 아닙니다.');
        payload.instructor_id = vals.instructorId;
      }

      const { error } = await supabase.from('sessions').update(payload).eq('id', id).single();
      if (error) throw error;

      setOpen(false);
      await loadSessions();
      toast.success('세션 수정 완료');
    } catch (e: any) {
      toast.error(e?.message || '세션 수정 오류');
    }
  }

  async function updateSessionTime(id: string, start: Date, end: Date) {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ starts_at: start.toISOString(), ends_at: end.toISOString() })
        .eq('id', id);
      if (error) throw error;

      await loadSessions();
      toast.success('시간 변경 완료');
    } catch (e: any) {
      toast.error(e?.message || '시간 변경 오류');
    }
  }

  async function deleteSession(id: string) {
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;

      setOpen(false);
      await loadSessions();
      toast.success('세션 삭제 완료');
    } catch (e: any) {
      toast.error(e?.message || '세션 삭제 오류');
    }
  }

  // ===== 월 네비게이션 =====
  const goToMonth = (yy: number, mm: number) => {
    const params = new URLSearchParams(search);
    params.set('month', `${yy}-${pad(mm)}`);
    window.location.search = params.toString();
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">캘린더</h1>
          <p className="text-xs text-gray-500">현재 월: {label}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* 취소 포함 토글 */}
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={showCanceled}
              onChange={(e) => setShowCanceled(e.target.checked)}
            />
            취소 포함
          </label>

          <Button onClick={() => goToMonth(shiftMonth(y, m, -1).y, shiftMonth(y, m, -1).m)}>
            ◀ 이전 달
          </Button>
          <Button onClick={() => goToMonth(shiftMonth(y, m, 1).y, shiftMonth(y, m, 1).m)}>
            다음 달 ▶
          </Button>

          <Button
            onClick={() => {
              setMode('create');
              setSelectedId(null);
              setInitialValues({
                title: '',
                startAt: '',
                endAt: '',
                instructorId: '', // 권한 분기 제거: 기본값 없음 → 사용자가 선택
                status: 'scheduled',
                location: '',
                memberId: '',
              });
              setOpen(true);
            }}
          >
            + 새 세션
          </Button>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="text-xs text-gray-500">
        {loading ? '세션 불러오는 중…' : `가져온 세션: ${events.length}개`}
        {err ? <span className="ml-2 text-red-600">({err})</span> : null}
      </div>

      {/* 캘린더 */}
      <StudioCalendar
        events={events}
        onSelectRange={(s, e) => {
          setMode('create');
          setSelectedId(null);
          setInitialValues({
            title: '',
            startAt: toLocalInputValue(s),
            endAt: toLocalInputValue(e),
            instructorId: '', // 사용자가 선택
            status: 'scheduled',
            location: '',
            memberId: '',
          });
          setOpen(true);
        }}
        onEventClick={(ev) => {
          setMode('edit');
          setSelectedId(ev.id);
          setInitialValues({
            title: ev.title,
            startAt: toLocalInputValue(new Date(ev.start as any)),
            endAt: toLocalInputValue(new Date(ev.end as any)),
            instructorId: (ev.extendedProps as any)?.instructorId || '',
            status: (ev.extendedProps as any)?.status ?? 'scheduled',
            location: (ev.extendedProps as any)?.location ?? '',
            memberId: (ev.extendedProps as any)?.memberId ?? '',
          });
          setOpen(true);
        }}
        onEventChange={updateSessionTime}
      />

      {/* 드로어 */}
      <SessionDrawer
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        initialValues={initialValues}
        instructorOptions={instructors}
        onSubmit={async (vals) => {
          if (mode === 'create') {
            await createSession(vals);
          } else if (selectedId) {
            await updateSession(selectedId, vals);
          }
        }}
        onDelete={async () => {
          if (selectedId) await deleteSession(selectedId);
        }}
      />
    </div>
  );
}
