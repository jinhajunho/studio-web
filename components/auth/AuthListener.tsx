// components/auth/AuthListener.tsx
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * ✅ Supabase Auth 이벤트 리스너
 * - 로그인 / 로그아웃 / 토큰 갱신 → 클라이언트 상태와 동기화
 */
export default function AuthListener() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      // 쿠키 업데이트 / 새로고침 유도
      // 여기서는 간단히 전체 페이지 새로고침
      window.location.reload();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
