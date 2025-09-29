// components/StudioCalendar.tsx
'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';

// ✅ 스타일이 없으면 레이아웃이 깨지니 CSS 임포트 꼭 유지하세요.
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';

export type StudioEvent = EventInput & {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  extendedProps?: {
    status?: 'scheduled' | 'completed' | 'canceled';
    location?: string | null;
    memberId?: string | null;
    [k: string]: any;
  };
};

type Props = {
  events: StudioEvent[];
  onSelectRange?: (start: Date, end: Date) => void;
  onEventClick?: (ev: StudioEvent) => void;
  onEventChange?: (id: string, start: Date, end: Date) => void; // drop/resize
  selectable?: boolean;
};

export default function StudioCalendar({
  events,
  onSelectRange,
  onEventClick,
  onEventChange,
  selectable = true,
}: Props) {
  return (
    <div className="rounded-lg border bg-white">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev today next',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        nowIndicator
        selectable={selectable}
        selectMirror
        editable
        eventDurationEditable
        eventStartEditable
        dayMaxEvents
        events={events as EventInput[]}
        select={(arg) => {
          if (!selectable) return;
          onSelectRange?.(arg.start, arg.end);
        }}
        eventClick={(arg) => {
          const ev = arg.event;
          onEventClick?.({
            id: String(ev.id),
            title: ev.title,
            start: ev.start ?? new Date(),
            end: ev.end ?? ev.start ?? new Date(),
            extendedProps: ev.extendedProps,
          });
        }}
        eventDrop={(arg) => {
          const ev = arg.event;
          onEventChange?.(String(ev.id), ev.start!, ev.end ?? ev.start!);
        }}
        eventResize={(arg) => {
          const ev = arg.event;
          onEventChange?.(String(ev.id), ev.start!, ev.end ?? ev.start!);
        }}
        // 상태별 클래스 → Tailwind로 색 구분 가능
        eventClassNames={(arg) => {
          const status = (arg.event.extendedProps as any)?.status;
          if (status === 'canceled') return ['line-through', 'opacity-60'];
          if (status === 'completed') return ['border-emerald-300'];
          return [];
        }}
        height="78vh"
      />
    </div>
  );
}
