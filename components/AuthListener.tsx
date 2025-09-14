'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthListener() {
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // 쿠키가 갱신되면 서버컴포넌트/서버액션이 최신 세션을 보게끔
      router.refresh();
    });
    return () => sub.subscription?.unsubscribe();
  }, [router]);

  return null;
}
