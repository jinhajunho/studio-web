// app/admin/passes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { withAuth } from '@/components/withAuth';
import { supabase } from '@/lib/supabaseClient';
import GrantPassForm from './GrantPassForm';

type Member = { id: string; email: string; name?: string | null };
type Promotion = { id: string; name: string; bonus_sessions?: number | null };

function PassesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [{ data: mData, error: mErr }, { data: pData, error: pErr }] = await Promise.all([
          supabase.from('members').select('id,email,name').order('email', { ascending: true }),
          supabase.from('promotions').select('id,name,bonus_sessions').eq('is_active', true).order('name', { ascending: true }),
        ]);
        if (mErr) throw mErr;
        if (pErr) throw pErr;
        if (!mounted) return;
        setMembers(mData ?? []);
        setPromotions(pData ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message ?? '데이터를 불러오지 못했습니다.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="container-page">
        <div className="card space-y-3 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container-page">
        <div className="card">
          <p className="text-sm text-[color:var(--error)]">{err}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page">
      <div className="card space-y-5">
        <div>
          <h2>수강권 지급</h2>
          <p className="text-sm text-[color:var(--muted)] mt-1">
            회원에게 수강권을 발급합니다. 이벤트명/추가 회차는 선택사항입니다.
          </p>
        </div>
        <GrantPassForm members={members} promotions={promotions} />
      </div>
    </div>
  );
}

export default withAuth(PassesPage);
