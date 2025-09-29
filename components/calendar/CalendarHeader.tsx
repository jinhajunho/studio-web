// components/calendar/CalendarHeader.tsx
'use client';

type Props = {
  monthLabel: string;
  view: 'month' | 'week' | 'day';
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (v: 'month' | 'week' | 'day') => void;
  onNew?: () => void;
};

export default function CalendarHeader({
  monthLabel,
  view,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onNew,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* 왼쪽: 제목 */}
      <div>
        <h1 className="text-xl font-bold">캘린더</h1>
        <p className="text-sm text-gray-500">{monthLabel}</p>
      </div>

      {/* 오른쪽: 컨트롤 */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-gray-200" onClick={onPrev}>
          ◀ 이전
        </button>
        <button className="px-3 py-1 rounded bg-gray-200" onClick={onToday}>
          오늘
        </button>
        <button className="px-3 py-1 rounded bg-gray-200" onClick={onNext}>
          다음 ▶
        </button>

        <button
          className={`px-3 py-1 rounded ${view === 'month' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => onChangeView('month')}
        >
          Month
        </button>
        <button
          className={`px-3 py-1 rounded ${view === 'week' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => onChangeView('week')}
        >
          Week
        </button>
        <button
          className={`px-3 py-1 rounded ${view === 'day' ? 'bg-black text-white' : 'bg-gray-200'}`}
          onClick={() => onChangeView('day')}
        >
          Day
        </button>

        {onNew && (
          <button
            className="px-3 py-1 rounded bg-indigo-600 text-white"
            onClick={onNew}
          >
            + 새 세션
          </button>
        )}
      </div>
    </div>
  );
}
