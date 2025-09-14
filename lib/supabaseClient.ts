// lib/supabaseClient.ts
'use client';

import { createBrowserClient, type CookieOptions } from '@supabase/ssr';

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const m = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
  return m ? decodeURIComponent(m.split('=')[1]) : undefined;
}

function setCookie(name: string, value: string, options: CookieOptions = {}) {
  if (typeof document === 'undefined') return;
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${options.path ?? '/'}`;
  if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
  if (options.expires) {
    const d = typeof options.expires === 'string' ? new Date(options.expires) : options.expires;
    cookie += `; Expires=${d.toUTCString()}`;
  }
  if (options.domain) cookie += `; Domain=${options.domain}`;
  if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
  if (options.secure) cookie += `; Secure`;
  document.cookie = cookie;
}

function removeCookie(name: string, options: CookieOptions = {}) {
  setCookie(name, '', { ...options, maxAge: 0 });
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get: getCookie,
      set: setCookie,
      remove: removeCookie,
    },
  }
);
