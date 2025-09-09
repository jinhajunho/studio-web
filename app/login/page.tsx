"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMsg("로그인 성공! 이동합니다…");
      router.push("/mypage"); // 로그인 후 이동할 곳
    } catch (err: any) {
      setMsg(err?.message ?? "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420, margin: "0 auto" }}>
      <h1>로그인</h1>
      <form onSubmit={onLogin} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 10, background: "#000", color: "#fff" }}
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>
        {msg && <div style={{ fontSize: 14 }}>{msg}</div>}
      </form>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={async () => { await supabase.auth.signOut(); alert("로그아웃됨"); }}
          style={{ padding: "8px 12px", borderRadius: 8, background: "#eee" }}
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
