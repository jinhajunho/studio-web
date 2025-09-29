// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Welcome</h1>
      <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
        <li><Link href="/login">로그인</Link></li>
        <li><Link href="/mypage">내 수강권</Link></li>
        <li><Link href="/calendar">캘린더</Link></li>
        <li><Link href="/admin">관리자</Link></li>
        <li><Link href="/instructor/sessions">강사 세션 관리</Link></li>
      </ul>
    </main>
  );
}
