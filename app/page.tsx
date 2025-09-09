// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{padding: 24}}>
      <h1>Welcome</h1>
      <ul>
        <li><Link href="/auth/signup">회원가입</Link></li>
        <li><Link href="/auth/signin">로그인</Link></li>
        <li><Link href="/profile">내 프로필</Link></li>
      </ul>
    </main>
  );
}
