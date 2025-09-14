// middleware.ts
// ⚠️ 우선 전부 통과시켜서 가드 충돌을 없앱니다.
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

// 매처도 비워서 어떤 경로에도 개입하지 않게
export const config = {
  matcher: [],
};
