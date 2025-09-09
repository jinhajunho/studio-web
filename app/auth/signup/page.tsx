// app/auth/signup/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName]   = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function ensureMemberSafe(pEmail: string, pName: string) {
    const { error } = await supabase.rpc("ensure_member", {
      p_email: pEmail,
      p_name: pName
    });
    // 무해: 이미 있으면 UPDATE/유지, 없으면 INSERT
    if (error) console.warn("ensure_member error", error);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // user_metadata.name
      },
    });

    if (error) {
      setMsg(`가입 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    // 이메일 인증 ON인 경우 data.session이 null일 수 있음
    if (data.session) {
      await ensureMemberSafe(email, name);
      setMsg("가입/로그인 완료. 프로필 페이지로 이동합니다.");
      router.push("/profile");
    } else {
      // 세션 없음(이메일 인증 필요) → 안내 메시지
      setMsg("가입 완료! 이메일 인증 후 로그인하세요.");
    }

    setLoading(false);
  }

  return (
    <main style={{padding: 24}}>
      <h1>회원가입</h1>
      <form onSubmit={onSubmit} style={{display: "grid", gap: 12, maxWidth: 360}}>
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button disabled={loading} type="submit">
          {loading ? "가입 중..." : "가입"}
        </button>
      </form>

      {msg && <p style={{marginTop: 12}}>{msg}</p>}
      <p style={{marginTop: 12}}>
        이미 계정이 있나요? <a href="/auth/signin">로그인</a>
      </p>
    </main>
  );
}
