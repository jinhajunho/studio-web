// components/withAuth.tsx
'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function withAuth<P extends Record<string, unknown>>(
  Wrapped: ComponentType<P>
) {
  function Guard(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const [ok, setOk] = useState<null | boolean>(null);

    useEffect(() => {
      let mounted = true;

      (async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session) {
          // 로그인 안 되어 있으면 로그인 페이지로 리다이렉트
          const next = encodeURIComponent(pathname || '/');
          router.replace(`/login?next=${next}`);
          setOk(false);
        } else {
          setOk(true);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [pathname, router]);

    if (ok === null) return null; // 로딩 중엔 아무것도 안 보여줌
    if (!ok) return null;         // 리다이렉트 준비 중

    return <Wrapped {...props} />;
  }

  return Guard;
}
