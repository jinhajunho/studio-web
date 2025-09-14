// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';

  const [email, setEmail] = useState('');        // ✅ placeholder 아님 (실제 값)
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!email) return setMsg('이메일을 입력하세요.');
    if (!password) return setMsg('비밀번호를 입력하세요.');

    try {
      setLoading(true);
      console.log('[login] submit', { email });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[login] result', { data, error });

      if (error) {
        setMsg(error.message || '로그인 실패');
        setLoading(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (err: any) {
      console.error('[login] catch', err);
      setMsg(err?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page">
      <div className="card space-y-5">
        <h2>로그인</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">이메일</label>
            <input
              type="email"
              autoComplete="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </div>
          <div>
            <label className="label">비밀번호</label>
            <input
              type="password"
              autoComplete="current-password"
              className="input"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        {msg && <div className="toast toast-error">{msg}</div>}
      </div>
    </div>
  );
}
