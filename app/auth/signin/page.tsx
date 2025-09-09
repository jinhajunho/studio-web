// app/auth/signin/page.tsx
"use client";

import { FormEvent, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function ensureMemberSafe() {
    // 로그인 성공 후 한번 호출해 멱등 보정
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const name = (user.user_metadata?.name as string) || "";
    const { error } = await supabase.rpc("ensure_member", {
      p_email: user.email,
      p_name: name,
    });
    if (error) console.warn("ensure_member error", error);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    });

    if (error) {
      setMsg(`로그인 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    // 로그인 직후 보정
    await ensureMemberSafe();

    setMsg("로그인 성공! 프로필 페이지로 이동합니다.");
    setLoading(false);
    router.push("/profile");
  }

  // 토큰 갱신/탭 이동 후에도 보정이 필요하면 아래 구독 사용 (선택)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") await ensureMemberSafe();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main style={{padding: 24}}>
      <h1>로그인</h1>
      <form onSubmit={onSubmit} style={{display: "grid", gap: 12, maxWidth: 360}}>
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
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {msg && <p style={{marginTop: 12}}>{msg}</p>}
    </main>
  );
}
