// app/admin/passes/GrantPassForm.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { grantPassUnified } from '@/app/actions/grantPass';

type Member = { id: string; email: string; name?: string | null };

type Props = {
  members: Member[];
};

export default function GrantPassForm({ members }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<{ loading: boolean; ok?: boolean; message?: string }>({
    loading: false,
  });

  // 토스트 자동 닫기
  useEffect(() => {
    if (!state.message) return;
    const t = setTimeout(() => setState((s) => ({ ...s, message: undefined })), 4000);
    return () => clearTimeout(t);
  }, [state.message]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ loading: true });

    const fd = new FormData(e.currentTarget);
    const memberId = String(fd.get('memberId') || '');
    const base = Number(String(fd.get('baseSessions') || ''));
    const eventName = String(fd.get('eventName') || '').trim();
    const bonus = Number(String(fd.get('bonusSessions') || '0'));

    if (!memberId) {
      return setState({ loading: false, ok: false, message: '회원을 선택하세요.' });
    }
    if (!Number.isFinite(base) || base <= 0) {
      return setState({ loading: false, ok: false, message: '기본 회차는 1 이상의 숫자여야 합니다.' });
    }
    if (!eventName) {
      return setState({ loading: false, ok: false, message: '이벤트명을 입력하세요.' });
    }
    if (!Number.isFinite(bonus) || bonus < 0) {
      return setState({ loading: false, ok: false, message: '추가 회차는 0 이상의 숫자여야 합니다.' });
    }

    const res = await grantPassUnified({
      memberId,
      baseSessions: base,
      manual: { name: eventName, bonus },
      promoId: null, // 완전 단순화: 항상 직접입력 사용
    });

    setState({
      loading: false,
      ok: !!res?.ok,
      message: res?.message ?? (res?.ok ? '성공' : '실패'),
    });

    if (res?.ok) formRef.current?.reset();
  };

  return (
    <>
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        {/* 회원 */}
        <div>
          <label className="label">회원</label>
          <select name="memberId" className="select" defaultValue="">
            <option value="" disabled>회원을 선택하세요</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name ?? m.email} ({m.email})
              </option>
            ))}
          </select>
        </div>

        {/* 기본 회차 */}
        <div>
          <label className="label">기본 회차</label>
          <input name="baseSessions" type="number" min={1} step={1} className="input" placeholder="예: 10" />
        </div>

        {/* 이벤트명 + 추가 회차 */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">이벤트명</label>
            <input name="eventName" className="input" placeholder="예: 신규회원, 재등록, 추천인 등" />
          </div>
          <div>
            <label className="label">추가 회차</label>
            <input name="bonusSessions" type="number" min={0} step={1} className="input" placeholder="예: 2" />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={state.loading} className="btn btn-primary">
            {state.loading ? '지급 중…' : '수강권 지급'}
          </button>
        </div>
      </form>

      {/* 토스트 */}
      {state.message && (
        <div className={`toast ${state.ok ? 'toast-success' : 'toast-error'}`}>
          {state.message}
        </div>
      )}
    </>
  );
}
