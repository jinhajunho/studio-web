// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Member = {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchMe() {
    setLoading(true);
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    // 내 것만 보이는 RLS 정책이므로 where 조건 없이 single()로도 안전
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", session.user.id)   // 명시적으로 본인 id로 조회
      .single();

    if (error) {
      console.warn(error);
    } else {
      setMember(data as Member);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <main style={{padding: 24}}>불러오는 중…</main>;

  return (
    <main style={{padding: 24}}>
      <h1>내 프로필</h1>
      {!member ? (
        <p>멤버 레코드가 없습니다. 로그인 직후에도 없으면 한 번 더 로그인해 보세요.</p>
      ) : (
        <pre style={{background:"#f6f6f6", padding:12, borderRadius:8}}>
{JSON.stringify(member, null, 2)}
        </pre>
      )}
      <button onClick={handleSignOut} style={{marginTop: 12}}>로그아웃</button>
    </main>
  );
}
