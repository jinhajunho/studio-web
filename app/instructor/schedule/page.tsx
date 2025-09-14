'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function InstructorSchedulePage() {
  const [email, setEmail] = useState('');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [title, setTitle] = useState('개인레슨');
  const [memo, setMemo] = useState('');
  const [start, setStart] = useState(''); // datetime-local
  const [minutes, setMinutes] = useState(50);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const toast = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
  const toastErr = (e: string) => { setErr(e); setTimeout(() => setErr(null), 3500); };

  async function findMember() {
    setMemberId(null);
    setMsg(null); setErr(null);
    if (!email.trim()) { toastErr('회원 이메일을 입력하세요.'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_member_id_by_email', { p_email: email.trim() });
      if (error) throw error;
      if (!data) { toastErr('해당 이메일의 회원을 찾을 수 없습니다.'); return; }
      setMemberId(data as string);
      toast('회원 확인 완료');
    } catch (e: any) {
      toastErr(e?.message ?? '회원 조회 실패');
    } finally {
      setLoading(false);
    }
  }

  async function saveReservation() {
    setMsg(null); setErr(null);
    if (!memberId) { toastErr('먼저 회원을 확인하세요.'); return; }
    if (!start) { toastErr('시작 일시를 입력하세요.'); return; }
    if (!minutes || minutes <= 0) { toastErr('소요 시간(분)을 올바르게 입력하세요.'); return; }

    setLoading(true);
    try {
      // 현재 로그인 강사 ID
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const instructorId = userRes.user?.id;
      if (!instructorId) { toastErr('로그인이 필요합니다.'); return; }

      const startsAt = new Date(start); // datetime-local -> local time
      const endsAt = new Date(startsAt.getTime() + minutes * 60_000);

      const { error: insErr } = await supabase.from('reservations').insert({
        member_id: memberId,
        instructor_id: instructorId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        title,
        memo: memo || null,
        // status 생략하면 DB default 사용
      });

      if (insErr) throw insErr;
      toast('등록 완료! 회원 달력에서 확인할 수 있어요.');
      // 입력값 초기화(회원은 유지)
      setTitle('개인레슨');
      setMemo('');
      setStart('');
      setMinutes(50);
    } catch (e: any) {
      toastErr(e?.message ?? '등록 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">강사 스케줄 업로드</h1>

      {/* 1) 회원 확인 */}
      <div className="space-y-2 border rounded-xl p-4">
        <div className="font-medium">1) 회원 이메일로 검색</div>
        <div className="flex gap-2">
          <input
            type="email"
            className="border rounded-xl px-3 py-2 flex-1"
            placeholder="member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={findMember}
            disabled={loading}
            className="px-4 py-2 rounded-xl border"
          >
            회원 확인
          </button>
        </div>
        <div className="text-sm opacity-70">
          {memberId ? `회원 ID: ${memberId}` : '회원 미확인'}
        </div>
      </div>

      {/* 2) 일정 입력 */}
      <div className="space-y-2 border rounded-xl p-4">
        <div className="font-medium">2) 일정 입력</div>

        <label className="text-sm">시작 일시</label>
        <input
          type="datetime-local"
          className="border rounded-xl px-3 py-2 w-full"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />

        <label className="text-sm">소요 시간(분)</label>
        <input
          type="number"
          min={1}
          className="border rounded-xl px-3 py-2 w-32"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />

        <label className="text-sm">제목</label>
        <input
          type="text"
          className="border rounded-xl px-3 py-2 w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="text-sm">메모 (선택)</label>
        <textarea
          className="border rounded-xl px-3 py-2 w-full min-h-[80px]"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <div className="pt-2">
          <button
            onClick={saveReservation}
            disabled={loading || !memberId}
            className="px-4 py-2 rounded-xl border"
          >
            저장
          </button>
        </div>
      </div>

      {/* 토스트 */}
      {msg && <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-xl shadow">{msg}</div>}
      {err && <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-xl shadow">{err}</div>}
    </div>
  );
}
