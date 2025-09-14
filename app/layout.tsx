// app/layout.tsx
import './globals.css';
import AuthListener from '@/components/AuthListener';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <AuthListener /> {/* ✅ 여기 추가 */}
      </body>
    </html>
  );
}
