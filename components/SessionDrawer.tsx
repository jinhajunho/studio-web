'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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

const STATUS_OPTIONS = [
  { value: 'scheduled', label: '예정' },
  { value: 'completed', label: '완료' },
  { value: 'canceled',  label: '취소' },
] as const;

/** undefined/null → ''로 고정해서 uncontrolled 경고 방지 */
function normalize(v: Partial<SessionInput> | undefined): SessionInput {
  const ok = ['scheduled','completed','canceled'] as const;
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

  React.useEffect(() => {
    if (open) setForm(normalize(initialValues));
  }, [open, initialValues]);

  const change = (k: keyof SessionInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value as any }));

  const handleSubmit = async () => {
    if (!form.startAt || !form.endAt) {
      toast.error('시작/종료 시간을 입력하세요.');
      return;
    }
    const s = new Date(form.startAt), e = new Date(form.endAt);
    if (e <= s) {
      toast.error('종료 시간이 시작보다 뒤여야 합니다.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setLoading(true);
    try {
      await onDelete();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'create' ? '새 세션' : '세션 수정'}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">
            {mode === 'create' ? '새 세션' : '세션 수정'}
          </div>
          <button className="text-sm text-gray-500" onClick={() => onOpenChange(false)}>
            닫기
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <Label htmlFor="title">제목</Label>
            <Input id="title" value={form.title} onChange={change('title')} placeholder="예: 오전 기구 필라테스" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">시작</Label>
              <Input id="start" type="datetime-local" value={form.startAt} onChange={change('startAt')} />
            </div>
            <div>
              <Label htmlFor="end">종료</Label>
              <Input id="end" type="datetime-local" value={form.endAt} onChange={change('endAt')} />
            </div>
          </div>

          <div>
            <Label htmlFor="instructor">강사</Label>
            <select
              id="instructor"
              className="w-full border rounded px-2 py-1"
              value={form.instructorId}
              onChange={change('instructorId')}
            >
              <option value="">(선택)</option>
              {instructorOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="location">장소</Label>
            <Input id="location" value={form.location} onChange={change('location')} />
          </div>

          <div>
            <Label htmlFor="member">회원 (ID/이메일)</Label>
            <Input id="member" value={form.memberId} onChange={change('memberId')} placeholder="회원 ID 또는 이메일" />
          </div>

          <div>
            <Label htmlFor="status">상태</Label>
            <select
              id="status"
              className="w-full border rounded px-2 py-1"
              value={form.status}
              onChange={change('status')}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          {mode === 'edit' ? (
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>삭제</Button>
          ) : (
            <span />
          )}
          <Button onClick={handleSubmit} disabled={loading}>{loading ? '저장 중…' : '저장'}</Button>
        </div>
      </div>
    </div>
  );
}
