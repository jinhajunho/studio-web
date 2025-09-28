// components/withAuth.tsx
'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

/** 로그인 여부만 확인하는 HOC (권한/역할 체크 없음) */
export function withAuth<P extends Record<string, unknown>>(Wrapped: ComponentType<P>) {
  function Guard(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      let alive = true;

      (async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!alive) return;

        if (error || !user) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
          return;
        }
        setChecking(false);
      })();

      const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
        if (!alive) return;
        if (!session) {
          router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
        } else {
          router.refresh();
        }
      });

      return () => {
        alive = false;
        sub.subscription?.unsubscribe();
      };
    }, [router, pathname]);

    if (checking) return <div style={{ padding: 20 }}>로그인 확인 중…</div>;
    return <Wrapped {...props} />;
  }

  (Guard as any).displayName =
    `withAuth(${(Wrapped as any).displayName || (Wrapped as any).name || 'Component'})`;
  return Guard;
}
