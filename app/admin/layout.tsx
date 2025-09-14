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
      // 1) 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const next = encodeURIComponent(pathname || '/admin');
        safeReplace(`/login?next=${next}`);
        return;
      }

      // 2) 역할 확인 (app_metadata 우선)
      const role =
        (session.user?.app_metadata as any)?.role ??
        (session.user?.user_metadata as any)?.role ??
        null;

      if (role !== 'admin') {
        // 2-1) 필요시 RPC로 교차확인 (없으면 건너뛰어도 됨)
        try {
          const { data, error } = await supabase.rpc('admin_whoami');
          const isAdmin = error
            ? false
            : Array.isArray(data)
              ? data?.[0]?.is_admin
              : (data as any)?.is_admin;

          if (!isAdmin) {
            safeReplace('/403');
            return;
          }
        } catch {
          safeReplace('/403');
          return;
        }
      }

      if (mounted) setStatus('ok');
    })();

    // 토큰 갱신 시 레이아웃 새로고침
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, [pathname, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        관리자 권한 확인 중…
      </div>
    );
  }

  return <>{children}</>;
}
