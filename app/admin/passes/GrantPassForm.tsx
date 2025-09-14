// app/admin/passes/GrantPassForm.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { grantPassUnified } from '@/app/actions/grantPass';

type Member = { id: string; email: string; name?: string | null };
type Promotion = { id: string; name: string; bonus_sessions?: number | null };

type Props = {
  members: Member[];
  promotions?: Promotion[];
};

export default function GrantPassForm({ members, promotions = [] }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<'manual' | 'select'>('manual'); // 기본: 직접 입력
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
    const baseStr = String(fd.get('baseSessions') || '');
    const base = Number(baseStr);

    if (!memberId) return setState({ loading: false, ok: false, message: '회원을 선택하세요.' });
    if (!Number.isFinite(base) || base <= 0) {
      return setState({ loading: false, ok: false, message: '기본 회차는 1 이상의 숫자여야 합니다.' });
    }

    let res;
    if (mode === 'manual') {
      const eventName = String(fd.get('eventName') || '').trim();
      const bonusStr = String(fd.get('bonusSessions') || '0');
      const bonus = Number(bonusStr);
      if (!eventName) return setState({ loading: false, ok: false, message: '이벤트명을 입력하세요.' });
      if (!Number.isFinite(bonus) || bonus < 0) {
        return setState({ loading: false, ok: false, message: '추가 회차는 0 이상의 숫자여야 합니다.' });
      }
      res = await grantPassUnified({
        memberId,
        baseSessions: base,
        manual: { name: eventName, bonus },
        promoId: null,
      });
    } else {
      const promoId = (fd.get('promotionId') as string) || null;
      res = await grantPassUnified({
        memberId,
        baseSessions: base,
        promoId,
        manual: null,
      });
    }

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
            <option value="" disabled>
              회원을 선택하세요
            </option>
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
          <input
            name="baseSessions"
            type="number"
            min={1}
            step={1}
            className="input"
            placeholder="예: 10"
          />
        </div>

        {/* 모드 토글 */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="manual"
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
            />
            <span className="text-sm">직접 입력</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              value="select"
              checked={mode === 'select'}
              onChange={() => setMode('select')}
            />
            <span className="text-sm">프로모션 선택</span>
          </label>
        </div>

        {/* 직접 입력 모드 */}
        {mode === 'manual' ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">이벤트명</label>
              <input name="eventName" className="input" placeholder="예: 추석 이벤트" />
            </div>
            <div>
              <label className="label">추가 회차</label>
              <input name="bonusSessions" type="number" min={0} step={1} className="input" placeholder="예: 2" />
            </div>
          </div>
        ) : (
          <div>
            <label className="label">프로모션</label>
            <select name="promotionId" className="select" defaultValue="">
              <option value="">선택 안 함</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.bonus_sessions ? ` (+${p.bonus_sessions})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

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
