// app/calendar/CalendarClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  month: string;      // "YYYY-MM" - 서버에서 고정 계산됨
  startISO: string;   // 현재 month의 시작 UTC ISO
  endISO: string;     // 다음 달 1일 UTC ISO
  initialView: "month" | "week" | "day";
};

type Session = {
  id: string;
  title: string | null;
  starts_at: string;      // ISO
  ends_at: string;        // ISO
  instructor_id: string | null;
};

function getAdjacentMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, (m - 1) + delta, 1));
  const ny = d.getUTCFullYear();
  const nm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${ny}-${nm}`;
}

// 주/일 뷰에서 사용할 주간 범위 계산(UTC 기준, 화면 출력용)
function getWeekRangeLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 14)); // 중순을 기준일로 택해 "그 달의 한 주" 라벨
  const start = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate() - (first.getUTCDay() || 7) + 1));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));
  const fm = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fm(start)} – ${fm(end)}, ${start.getUTCFullYear()}`;
}

export default function CalendarClient({ month, startISO, endISO, initialView }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const [view, setView] = useState<"month" | "week" | "day">(initialView);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  // 쿼리 동기화 (view 탭 누를 때 URL에 반영)
  useEffect(() => {
    const urlView = params.get("view");
    if ((urlView === "month" || urlView === "week" || urlView === "day") && urlView !== view) {
      setView(urlView);
    }
  }, [params, view]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sessions")
        .select("id, title, starts_at, ends_at, instructor_id")
        .gte("starts_at", startISO)
        .lt("starts_at", endISO)
        .order("starts_at", { ascending: true });

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

    return () => { cancelled = true; };
  }, [startISO, endISO]);

  const goPrev = () => {
    const prev = getAdjacentMonth(month, -1);
    router.push(`/calendar?month=${prev}&view=${view}`);
  };
  const goNext = () => {
    const next = getAdjacentMonth(month, +1);
    router.push(`/calendar?month=${next}&view=${view}`);
  };
  const goToday = () => {
    // 오늘 이동도 서버/클라 불일치가 없도록 쿼리만 갱신
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    router.push(`/calendar?month=${y}-${m}&view=${view}`);
  };

  const setUrlView = (v: "month" | "week" | "day") => {
    setView(v);
    router.replace(`/calendar?month=${month}&view=${v}`);
  };

  // 화면에 뿌릴 간단한 이벤트 포맷
  const items = useMemo(() => {
    return sessions.map((s) => ({
      id: s.id,
      title: s.title ?? "(제목 없음)",
      start: new Date(s.starts_at),
      end: new Date(s.ends_at),
    }));
  }, [sessions]);

  // 라벨(서버에서 내려준 month만 사용 → 하이드레이션 안전)
  const monthTitle = (() => {
    const [y, m] = month.split("-");
    return `${y}-${m}`;
  })();

  const weekLabel = getWeekRangeLabel(month);

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">캘린더</h1>
          <p className="text-xs text-gray-500">현재 월: {month}</p>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-gray-200" onClick={goPrev}>◀ 이전 달</button>
          <button className="px-3 py-1 rounded bg-gray-200" onClick={goToday}>today</button>
          <button className="px-3 py-1 rounded bg-gray-200" onClick={goNext}>다음 달 ▶</button>
          <button
            className={`px-3 py-1 rounded ${view === "month" ? "bg-black text-white" : "bg-gray-200"}`}
            onClick={() => setUrlView("month")}
          >month</button>
          <button
            className={`px-3 py-1 rounded ${view === "week" ? "bg-black text-white" : "bg-gray-200"}`}
            onClick={() => setUrlView("week")}
          >week</button>
          <button
            className={`px-3 py-1 rounded ${view === "day" ? "bg-black text-white" : "bg-gray-200"}`}
            onClick={() => setUrlView("day")}
          >day</button>

          <button
            className="px-3 py-1 rounded bg-indigo-600 text-white"
            onClick={() => alert("새 세션: 구현 예정")}
          >+ 새 세션</button>
        </div>
      </div>

      {/* 타이틀 */}
      <div className="mt-4 mb-2 text-center text-2xl font-semibold">
        {view === "month" ? monthTitle : view === "week" ? weekLabel : monthTitle}
      </div>

      {/* 본문 */}
      {loading ? (
        <div className="text-sm text-gray-500">불러오는 중…</div>
      ) : (
        <CalendarTable items={items} view={view} month={month} />
      )}
    </div>
  );
}

/** 아주 단순한 Month/Week/Day 테이블 렌더러 (의존성 없이 확인용) */
function CalendarTable({
  items,
  view,
  month,
}: {
  items: { id: string; title: string; start: Date; end: Date }[];
  view: "month" | "week" | "day";
  month: string;
}) {
  if (view === "day") {
    // 오늘을 month 기준의 15일로 임시 고정(의존성 없이 플로우 확인용)
    const [y, m] = month.split("-").map(Number);
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

  if (view === "week") {
    // 월 중순 주간만 간단 표시(실운영에서는 네이티브 캘린더 컴포넌트로 대체 가능)
    const [y, m] = month.split("-").map(Number);
    const base = new Date(Date.UTC(y, m - 1, 14));
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - (base.getUTCDay() || 7) + 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6));

    const inWeek = (d: Date) => d >= start && d < new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1));

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

  // month 뷰: 간단 목록
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
