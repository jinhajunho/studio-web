// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function getSupabaseServerClient() {
  // ✅ Next 15: cookies() -> Promise
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // 일부 런타임에서 set이 없을 수 있음 → 존재할 때만 호출
            (cookieStore as any).set?.({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            (cookieStore as any).set?.({ name, value: '', ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );
}
