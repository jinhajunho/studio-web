// app/mypage/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Balance = {
  member_id: string;
  total_given: number;
  total_used: number;
  remaining: number;
  updated_at: string;
};

type Grant = {
  id: string;
  grant_type: string;
  base_count: number;
  promo_name: string | null;
  promo_bonus: number;
  extra_count: number;
  total_granted: number;
  created_at: string;
};

export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 로그인 세션 확인 + 데이터 로딩
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1) 현재 로그인 세션 확인
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          setError('로그인 필요');
          return;
        }
        setUserEmail(session.user.email ?? null);

        // 2) member_balances 가져오기
        const { data: balanceData, error: balanceError } = await supabase
          .from('member_balances')
          .select('*')
          .eq('member_id', session.user.id)
          .single();

        if (balanceError && balanceError.code !== 'PGRST116') {
          // PGRST116 = not found (row 없음)
          throw balanceError;
        }
        setBalance(balanceData ?? null);

        // 3) 지급 내역(grants) 가져오기
        const { data: grantData, error: grantError } = await supabase
          .from('grants')
          .select(
            'id, grant_type, base_count, promo_name, promo_bonus, extra_count, total_granted, created_at'
          )
          .eq('member_id', session.user.id)
          .order('created_at', { ascending: false });

        if (grantError) throw grantError;
        setGrants(grantData ?? []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="p-6">불러오는 중…</div>;
  if (error) return <div className="p-6 text-red-600">에러: {error}</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-xl font-bold">내 마이페이지</h1>

      {/* 회원 정보 */}
      <section className="rounded-2xl border p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">내 계정</h2>
        <p className="text-sm text-gray-700">이메일: {userEmail}</p>
        {balance ? (
          <p className="mt-2 text-lg">
            남은 회차: <b>{balance.remaining}</b> / 총 지급{' '}
            {balance.total_given}, 사용 {balance.total_used}
          </p>
        ) : (
          <p className="mt-2 text-gray-500">아직 지급 내역이 없습니다.</p>
        )}
      </section>

      {/* 지급 내역 */}
      <section className="rounded-2xl border p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">지급 내역</h2>
        {grants.length === 0 && (
          <p className="text-gray-500">아직 지급 내역이 없습니다.</p>
        )}
        <ul className="divide-y">
          {grants.map((g) => (
            <li key={g.id} className="py-3 text-sm">
              <div className="flex justify-between">
                <span>{g.grant_type}</span>
                <span className="text-gray-500">
                  {new Date(g.created_at).toLocaleString()}
                </span>
              </div>
              <div>
                기본 {g.base_count} + 이벤트 {g.promo_bonus} + 추가{' '}
                {g.extra_count} ={' '}
                <b className="text-blue-600">{g.total_granted}</b> 회
              </div>
              {g.promo_name && (
                <div className="text-xs text-gray-500">
                  이벤트명: {g.promo_name}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
