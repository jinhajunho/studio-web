// /app/admin/layout.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<'loading' | 'ok'>('loading');
  const redirected = useRef(false);

  const safeReplace = (href: string) => {
    if (redirected.current) return;
    redirected.current = true;
    router.replace(href);
  };

  useEffect(() => {
    let canceled = false;

    (async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (canceled) return;

      if (error || !session) {
        const next = encodeURIComponent(pathname || '/admin');
        safeReplace(`/login?next=${next}`);
        return;
      }

      setStatus('ok');
    })();

    return () => { canceled = true; };
  }, [pathname, router]);

  if (status === 'loading') {
    return <div className="flex min-h-[50vh] items-center justify-center">로그인 확인 중…</div>;
  }

  return <>{children}</>;
}
