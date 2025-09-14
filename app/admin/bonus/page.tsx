'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PassRow = {
  id: string;
  title: string | null;
  total_sessions: number;
  remaining_sessions: number;
  created_at: string;
  bonus_name: string | null;
  bonus_sessions: number | null;
};

export default function BonusPage() {
  const [memberEmail, setMemberEmail] = useState('');
  const [passId, setPassId] = useState('');
  const [bonusName, setBonusName] = useState('');
  const [bonusCount, setBonusCount] = useState<number>(0);

  const [found, setFound] = useState<PassRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 이메일로 수강권 목록 조회
  const onSearchByEmail = async () => {
    setMsg(null);
    setError(null);
    setFound([]);
    if (!memberEmail) {
      setError('회원 이메일을 입력하세요.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_passes_by_email', {
      p_member_email: memberEmail,
    });
    if (error) setError(`조회 실패: ${error.message}`);
    else setFound(data ?? []);
    setLoading(false);
  };

  // 보너스 적용
  const onApply = async () => {
    setMsg(null);
    setError(null);

    if (!bonusName || !bonusCount || bonusCount <= 0) {
      setError('이벤트명과 보너스 회차(양수)를 입력하세요.');
      return;
    }

    setLoading(true);

    // 1순위: passId 있으면 해당 수강권에 적용
    if (passId) {
      const { error } = await supabase.rpc('admin_add_bonus_to_pass', {
        p_pass_id: passId,
        p_bonus_name: bonusName,
        p_bonus_count: bonusCount,
      });
      if (error) setError(`적용 실패: ${error.message}`);
      else setMsg(`보너스 적용 완료! (pass: ${passId})`);
      setLoading(false);
      return;
    }

    // 2순위: 이메일이 있으면 최신 수강권에 적용
    if (memberEmail) {
      const { data, error } = await supabase.rpc(
        'admin_add_bonus_to_latest_pass_by_email',
        {
          p_member_email: memberEmail,
          p_bonus_name: bonusName,
          p_bonus_count: bonusCount,
        }
      );
      if (error) setError(`적용 실패: ${error.message}`);
      else setMsg(`보너스 적용 완료! (최근 수강권: ${data})`);
      setLoading(false);
      return;
    }

    setError('수강권 ID 또는 회원 이메일 중 하나는 입력해야 합니다.');
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-xl font-bold">보너스/이벤트 적용</h1>

      {/* 이메일 입력 & 조회 */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm text-gray-600">회원 이메일</span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="예: pest@example.com"
          />
        </label>
        <div className="flex items-end">
          <button
            onClick={onSearchByEmail}
            disabled={loading}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? '조회 중…' : '이메일로 수강권 조회'}
          </button>
        </div>

        {/* 수강권 ID 직접 입력 */}
        <label className="block md:col-span-2">
          <span className="text-sm text-gray-600">수강권 ID (passes.id)</span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={passId}
            onChange={(e) => setPassId(e.target.value)}
            placeholder="선택하거나 직접 입력 (UUID)"
          />
        </label>

        {/* 이벤트명 */}
        <label className="block md:col-span-2">
          <span className="text-sm text-gray-600">이벤트명</span>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={bonusName}
            onChange={(e) => setBonusName(e.target.value)}
            placeholder="예: 추석 이벤트"
          />
        </label>

        {/* 보너스 회차 */}
        <label className="block">
          <span className="text-sm text-gray-600">보너스 회차</span>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={bonusCount}
            onChange={(e) => setBonusCount(Number(e.target.value))}
            placeholder="예: 2"
            min={1}
          />
        </label>

        <div className="flex items-end">
          <button
            onClick={onApply}
            disabled={loading}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? '적용 중…' : '적용'}
          </button>
        </div>
      </div>

      {/* 메시지 */}
      {msg && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-700">
          {msg}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}

      {/* 조회 결과 */}
      {found.length > 0 && (
        <div className="rounded-xl border p-4">
          <div className="font-semibold mb-2">조회 결과 (최신순)</div>
          <ul className="space-y-2">
            {found.map((p) => (
              <li key={p.id} className="rounded-lg border p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium">
                      {(p.title?.trim() || '수강권')}
                      {p.bonus_name ? ` (${p.bonus_name} 적용)` : ''}{' '}
                      {p.remaining_sessions}/{p.total_sessions}
                    </div>
                    <div className="text-gray-500">
                      id: {p.id} · 생성:{' '}
                      {new Date(p.created_at).toLocaleString()} · 보너스 누적:{' '}
                      {p.bonus_sessions ?? 0}회
                    </div>
                  </div>
                  <button
                    className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                    onClick={() => setPassId(p.id)}
                  >
                    이 수강권에 적용
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
