'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';

// CSS는 layout.tsx(CDN) 또는 globals.css에서 로드

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
        nowIndicator={true}
        selectable={selectable}
        selectMirror={true}
        editable={true}
        eventDurationEditable={true}
        eventStartEditable={true}
        dayMaxEvents={true}
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
        // 상태별 클래스 부여 → globals.css에서 색상/줄긋기 적용
        eventClassNames={(arg) => {
          const status = (arg.event.extendedProps as any)?.status;
          if (status === 'canceled') return ['ev-canceled'];
          if (status === 'completed') return ['ev-completed'];
          return ['ev-scheduled'];
        }}
        height="78vh"
      />
    </div>
  );
}
