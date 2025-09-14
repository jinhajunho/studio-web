'use client';

import { withAuth } from '@/components/withAuth';
import CalendarPage from '../calendar/page';

// 강사용 캘린더 페이지 (instructor만 접근 가능)
export default withAuth(CalendarPage, { allowedRoles: ['instructor'] });

