// app/layout.tsx
import './globals.css';
import AuthListener from '@/components/auth/AuthListener';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <AuthListener />   {/* ✅ 로그인 세션 동기화 */}
        <Toaster />        {/* ✅ 전역 토스트 */}
      </body>
    </html>
  );
}
