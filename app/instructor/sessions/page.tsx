// app/instructor/sessions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type SessionRow = {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string | null;
  member_id: string | null;
  instructor_id: string | null;
};

export default function InstructorSessionsPage() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [title, setTitle] = useState('');
  const [starts, setStarts] = useState('');
  const [ends, setEnds] = useState('');
  const [memberId, setMemberId] = useState(''); // 담당 회원 uid
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      // RLS가 필터하므로 추가 where 없음
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, starts_at, ends_at, member_id, instructor_id')
        .gte(
          'starts_at',
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        )
        .lt(
          'starts_at',
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        )
        .order('starts_at', { ascending: true });
      if (error) throw error;
      setRows(data ?? []);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createSession() {
    setLoading(true);
    setMsg(null);
    try {
      // instructor_id는 서버/DB에서 RLS로 검증되지만, 클라에서 미리 채워줘도 됨
      const { data: me } = await supabase.auth.getUser();
      if (!me?.user) throw new Error('로그인 필요');

      const { error } = await supabase.from('sessions').insert({
        title: title || '수업',
        starts_at: starts, // ISO 문자열
        ends_at: ends || null, // ISO 문자열
        member_id: memberId || null, // 본인 담당 회원이면 허용
        instructor_id: me.user.id, // 본인
      });
      if (error) throw error;
      setTitle('');
      setStarts('');
      setEnds('');
      setMemberId('');
      await load();
      setMsg('생성 완료');
    } catch (e: any) {
      setMsg('생성 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateTitle(id: string, newTitle: string) {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ title: newTitle })
        .eq('id', id);
      if (error) throw error;
      await load();
      setMsg('수정 완료');
    } catch (e: any) {
      setMsg('수정 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
      await load();
      setMsg('삭제 완료');
    } catch (e: any) {
      setMsg('삭제 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">강사 세션 관리</h1>

      <div className="space-y-2 border rounded-xl p-4">
        <div className="font-medium">새 세션 만들기</div>
        <input
          className="border p-2 rounded w-full"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="시작 (ISO: 2025-09-13T10:00:00Z)"
          value={starts}
          onChange={(e) => setStarts(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="종료 (선택)"
          value={ends}
          onChange={(e) => setEnds(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="회원 uid (담당 회원이면 허용)"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        />
        <button
          className="border rounded px-3 py-1"
          onClick={createSession}
          disabled={loading}
        >
          생성
        </button>
      </div>

      {msg && <div className="text-sm text-gray-700">{msg}</div>}
      {loading && <div>처리 중...</div>}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="border rounded-xl p-4">
            <div className="font-medium">{r.title}</div>
            <div className="text-sm text-gray-600">
              {new Date(r.starts_at).toLocaleString()} ~{' '}
              {r.ends_at ? new Date(r.ends_at).toLocaleString() : ''}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="border rounded px-2 py-1"
                onClick={() =>
                  updateTitle(
                    r.id,
                    prompt('새 제목?', r.title ?? '수업') || r.title || '수업'
                  )
                }
              >
                제목 수정
              </button>
              <button
                className="border rounded px-2 py-1"
                onClick={() => remove(r.id)}
              >
                삭제
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              member_id: {r.member_id ?? '없음'} / instructor_id:{' '}
              {r.instructor_id ?? '없음'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
