// app/admin/layout.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'ok'>('loading');
  const redirectedRef = useRef(false);

  const safeReplace = (href: string) => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    router.replace(href);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) 로그인 세션만 확인 (권한/역할 체크 없음)
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error || !session) {
        const next = encodeURIComponent(pathname || '/admin');
        safeReplace(`/login?next=${next}`);
        return;
      }

      setStatus('ok');
    })();

    // 토큰/세션 변경 시 동작
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!session) {
        const next = encodeURIComponent(pathname || '/admin');
        safeReplace(`/login?next=${next}`);
      } else {
        router.refresh();
      }
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, [pathname, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        로그인 확인 중…
      </div>
    );
  }

  return <>{children}</>;
}
