// components/SessionDrawer.tsx
'use client';

import * as React from 'react';

export type SessionInput = {
  title: string;
  startAt: string;       // datetime-local
  endAt: string;         // datetime-local
  instructorId: string;
  status: 'scheduled' | 'completed' | 'canceled';
  location: string;
  memberId: string;      // uuid or email
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: 'create' | 'edit';
  initialValues: Partial<SessionInput>;
  instructorOptions: { id: string; name: string }[];
  onSubmit: (vals: SessionInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

/** undefined/null → ''로 고정해서 uncontrolled 경고 방지 */
function normalize(v: Partial<SessionInput> | undefined): SessionInput {
  const ok = ['scheduled', 'completed', 'canceled'] as const;
  const st = ok.includes(v?.status as any) ? (v?.status as any) : 'scheduled';
  return {
    title: v?.title ?? '',
    startAt: v?.startAt ?? '',
    endAt: v?.endAt ?? '',
    instructorId: v?.instructorId ?? '',
    status: st,
    location: v?.location ?? '',
    memberId: v?.memberId ?? '',
  };
}

export default function SessionDrawer({
  open,
  onOpenChange,
  mode,
  initialValues,
  instructorOptions,
  onSubmit,
  onDelete,
}: Props) {
  const [form, setForm] = React.useState<SessionInput>(() => normalize(initialValues));
  const [loading, setLoading] = React.useState(false);
  const drawerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) setForm(normalize(initialValues));
  }, [open, initialValues]);

  // ESC로 닫기
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const change =
    (k: keyof SessionInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value as any }));

  const handleSubmit = async () => {
    if (!form.startAt || !form.endAt) {
      alert('시작/종료 시간을 입력하세요.');
      return;
    }
    const s = new Date(form.startAt),
      e = new Date(form.endAt);
    if (e <= s) {
      alert('종료 시간이 시작보다 뒤여야 합니다.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err: any) {
      alert(err?.message || '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('정말 삭제할까요?')) return;
    setLoading(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch (err: any) {
      alert(err?.message || '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? '새 세션' : '세션 수정'}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-lg font-semibold">{mode === 'create' ? '새 세션' : '세션 수정'}</div>
          <button
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => onOpenChange(false)}
          >
            닫기
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="title">
              제목
            </label>
            <input
              id="title"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-400"
              placeholder="예: 오전 기구 필라테스"
              value={form.title}
              onChange={change('title')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700" htmlFor="start">
                시작
              </label>
              <input
                id="start"
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-400"
                value={form.startAt}
                onChange={change('startAt')}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700" htmlFor="end">
                종료
              </label>
              <input
                id="end"
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-400"
                value={form.endAt}
                onChange={change('endAt')}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="instructor">
              강사
            </label>
            <select
              id="instructor"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-400"
              value={form.instructorId}
              onChange={change('instructorId')}
            >
              <option value="">(선택)</option>
              {instructorOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="location">
              장소
            </label>
            <input
              id="location"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-400"
              value={form.location}
              onChange={change('location')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="member">
              회원 (ID/이메일)
            </label>
            <input
              id="member"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-400"
              placeholder="회원 ID 또는 이메일"
              value={form.memberId}
              onChange={change('memberId')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-700" htmlFor="status">
              상태
            </label>
            <select
              id="status"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-400"
              value={form.status}
              onChange={change('status')}
            >
              <option value="scheduled">예정</option>
              <option value="completed">완료</option>
              <option value="canceled">취소</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-4">
          {mode === 'edit' ? (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg border border-rose-300 px-4 py-2 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
            >
              삭제
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
          >
            {loading ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
