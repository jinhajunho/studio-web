'use client';
import React from 'react';
import { supabase } from '@/lib/supabaseClient';

type Item = { id: string; email: string; name: string | null };

function cx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(' ');
}

export default function MemberPicker({
  value,
  onChange,
  isAdmin = false,
  placeholder = '이메일 또는 이름 입력 (UUID도 가능)',
  label = '회원',
}: {
  value: string;
  onChange: (v: string) => void; // 이메일 또는 UUID 문자열을 반환
  isAdmin?: boolean;
  placeholder?: string;
  label?: string;
}) {
  const [q, setQ] = React.useState(value ?? '');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Item[]>([]);

  // 입력 변경 → 상위에도 반영
  React.useEffect(() => {
    onChange(q);
  }, [q]); // eslint-disable-line

  // 디바운스 검색
  React.useEffect(() => {
    if (!q || q.trim().length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const rpc = isAdmin ? 'admin_search_members' : 'instructor_search_my_members';
        const { data, error } = await supabase.rpc(rpc, { q });
        if (!error && Array.isArray(data)) setItems(data as Item[]);
        else setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, isAdmin]);

  return (
    <div className="w-full">
      <label className="mb-1 block text-sm text-gray-600">{label}</label>
      <div className="relative">
        <input
          className="w-full h-10 rounded-xl border border-gray-200 px-3 outline-none focus:border-gray-400"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {/* 드롭다운 */}
        {open && (loading || items.length > 0) && (
          <div className="absolute z-10 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow">
            {loading ? (
              <div className="p-3 text-sm text-gray-500">검색 중…</div>
            ) : (
              items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => {
                    // 인풋에는 이메일을 넣어두고, 제출 시 resolveMemberId가 uuid로 변환
                    setQ(it.email);
                    setOpen(false);
                  }}
                  className={cx(
                    'flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50'
                  )}
                >
                  <span className="text-sm">
                    <span className="font-medium">{it.email}</span>
                    {it.name ? <span className="text-gray-500"> · {it.name}</span> : null}
                  </span>
                  <span className="text-[11px] text-gray-400">{it.id.slice(0, 8)}…</span>
                </button>
              ))
            )}
            {!loading && items.length === 0 && (
              <div className="p-3 text-sm text-gray-500">검색 결과 없음 · 직접 입력 가능</div>
            )}
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        이메일/이름으로 검색해 선택하거나, 이메일·UUID를 직접 입력해도 됩니다.
      </p>
    </div>
  );
}
