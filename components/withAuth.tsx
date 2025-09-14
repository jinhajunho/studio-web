// components/withAuth.tsx
'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type WithAuthOptions = { allowedRoles?: string[] };

export function withAuth<P extends Record<string, unknown>>(
  Wrapped: ComponentType<P>,
  opts: WithAuthOptions = {}
) {
  function Guard(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const [ok, setOk] = useState<null | boolean>(null);

    useEffect(() => {
      let alive = true;

      (async () => {
        const { data, error } = await supabase.auth.getUser();
        if (!alive) return;

        const user = data?.user;
        if (error || !user) {
          setOk(false);
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        if (opts.allowedRoles?.length) {
          let allowed = true;

          if (opts.allowedRoles.includes('admin')) {
            try {
              const { data: rpc } = await supabase.rpc('admin_whoami');
              if (rpc && typeof rpc.is_admin !== 'undefined') {
                allowed = !!rpc.is_admin;
              } else {
                const roles: string[] = (user.app_metadata as any)?.roles || [];
                const metaRole = (user.user_metadata as any)?.role;
                allowed = roles.includes('admin') || metaRole === 'admin';
              }
            } catch {
              const roles: string[] = (user.app_metadata as any)?.roles || [];
              const metaRole = (user.user_metadata as any)?.role;
              allowed = roles.includes('admin') || metaRole === 'admin';
            }
          }

          if (!allowed) {
            setOk(false);
            router.replace('/403');
            return;
          }
        }

        setOk(true);
      })();

      const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
        if (!alive) return;
        if (!session) {
          setOk(false);
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        } else {
          setOk(true);
          router.refresh();
        }
      });

      return () => {
        alive = false;
        sub.subscription?.unsubscribe();
      };
    }, [pathname, router]);

    if (ok === null) return <div style={{ padding: 20 }}>확인 중…</div>;
    if (!ok) return null;

    return <Wrapped {...props} />;
  }

  (Guard as any).displayName = `withAuth(${(Wrapped as any).displayName || (Wrapped as any).name || 'Component'})`;
  return Guard;
}
