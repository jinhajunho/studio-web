// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 정적 파일 패턴(예: .png, .css, .js 등)
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) 정적/파일/로그인/내장 경로는 미들웨어 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/login') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2) /admin 가벼운 프리체크: Supabase 세션 쿠키가 하나도 없으면 로그인으로
  if (pathname.startsWith('/admin')) {
    // Supabase가 설정하는 쿠키 이름은 'sb-' 접두가 붙습니다.
    const hasSupabaseCookie =
      req.cookies.getAll().some((c) => c.name.startsWith('sb-')) ||
      req.cookies.has('sb-access-token') || // 일부 배포환경 호환
      req.cookies.has('sb:token');          // (레거시 호환)

    if (!hasSupabaseCookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
      return NextResponse.redirect(url);
    }
  }

  // 3) 그 외는 통과. 실제 인증/권한은 페이지의 withAuth에서 처리
  return NextResponse.next();
}

// 정적 리소스는 매칭 제외(여기선 /login도 매칭되지만 위에서 즉시 통과 처리)
export const config = {
  matcher: ['/((?!_next|favicon.ico|manifest|images|api).*)'],
};
