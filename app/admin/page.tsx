// app/admin/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Member = { id: string; email: string; name?: string | null };
type Promotion = {
  name: string;
  bonus_sessions: number;
  is_active: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
};

export default function AdminPage() {
  // 1) 회원 검색/선택
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member | null>(null);

  // 2) 지급 폼 상태
  const [grantType, setGrantType] = useState<'일반 지급' | '보정 지급' | '테스트 지급'>('일반 지급');
  const [baseCount, setBaseCount] = useState<number>(10);
  const [extraCount, setExtraCount] = useState<number>(1);
  const [promoName, setPromoName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // 3) 이벤트(프로모션) 목록
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromos, setLoadingPromos] = useState(false);

  // 미리보기 합계
  const selectedPromo = useMemo(
    () => promotions.find((p) => p.name === promoName),
    [promotions, promoName]
  );
  const promoBonus = selectedPromo?.bonus_sessions ?? 0;
  const totalPreview = (baseCount || 0) + (extraCount || 0) + promoBonus;

  // 이벤트 목록 가져오기 (활성 + 기간 유효)
  useEffect(() => {
    const load = async () => {
      setLoadingPromos(true);
      try {
        const nowISO = new Date().toISOString();
        const { data, error } = await supabase
          .from('promotions')
          .select('name, bonus_sessions, is_active, starts_at, ends_at')
          .or('is_active.is.null,is_active.eq.true'); // 우선 전체 불러오고 클라이언트에서 필터

        if (error) throw error;

        const filtered =
          data?.filter((p) => {
            if (p.is_active === false) return false;
            const startsOk = !p.starts_at || p.starts_at <= nowISO;
            const endsOk = !p.ends_at || p.ends_at >= nowISO;
            return startsOk && endsOk;
          }) ?? [];

        setPromotions(filtered);
      } catch (e: any) {
        console.error(e);
        alert('이벤트 목록을 불러오지 못했습니다: ' + (e?.message ?? e));
      } finally {
        setLoadingPromos(false);
      }
    };
    load();
  }, []);

  // 회원 검색
  const onSearch = async () => {
    if (!query.trim()) {
      alert('이메일(또는 일부)로 검색어를 입력하세요.');
      return;
    }
    setSearching(true);
    setResults([]);
    setSelected(null);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, email, name')
        .ilike('email', `%${query.trim()}%`)
        .limit(20);

      if (error) throw error;
      setResults(data ?? []);
      if ((data?.length ?? 0) === 0) {
        alert('검색 결과가 없습니다.');
      }
    } catch (e: any) {
      console.error(e);
      alert('회원 검색 실패: ' + (e?.message ?? e));
    } finally {
      setSearching(false);
    }
  };

  // 지급 실행
  const onGrant = async () => {
    if (!selected?.id) {
      alert('회원을 먼저 선택하세요.');
      return;
    }
    if (!Number.isFinite(baseCount) || baseCount <= 0) {
      alert('기본 회차는 1 이상이어야 합니다.');
      return;
    }
    if (!Number.isFinite(extraCount) || extraCount < 0) {
      alert('추가 회차는 0 이상이어야 합니다.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('grant_sessions', {
        p_member_id: selected.id,
        p_base_count: baseCount,
        p_promo_name: promoName || null,
        p_extra_count: extraCount,
        p_grant_type: grantType,
      });

      if (error) throw error;

      alert(
        `지급 완료!\n총 지급: ${data?.granted ?? totalPreview} 회\n남은 회차: ${data?.remaining ?? '-'} 회`
      );
    } catch (e: any) {
      console.error(e);
      alert('지급 실패: ' + (e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      {/* 1) 회원 선택 */}
      <section className="rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">1) 회원 선택</h2>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이메일로 검색 (예: test@example.com)"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button
            onClick={onSearch}
            disabled={searching}
            className="rounded-lg border px-4 py-2"
          >
            {searching ? '검색 중…' : '검색'}
          </button>
        </div>

        {selected && (
          <p className="mt-3 text-sm text-gray-700">
            선택된 회원 UUID:{' '}
            <span className="font-mono">{selected.id}</span>
          </p>
        )}

        {results.length > 0 && (
          <ul className="mt-4 divide-y rounded-xl border">
            {results.map((m) => (
              <li key={m.id} className="flex items-center justify-between p-3">
                <div>
                  <div className="font-medium">{m.email}</div>
                  <div className="text-xs text-gray-500">{m.name ?? '(이름 없음)'}</div>
                </div>
                <button
                  onClick={() => setSelected(m)}
                  className="rounded-lg border px-3 py-1"
                >
                  선택
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2) 지급 */}
      <section className="rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">2) 지급</h2>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">지급 유형</label>
            <select
              value={grantType}
              onChange={(e) => setGrantType(e.target.value as any)}
              className="rounded-lg border px-3 py-2"
            >
              <option value="일반 지급">일반 지급</option>
              <option value="보정 지급">보정 지급</option>
              <option value="테스트 지급">테스트 지급</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">기본 회차</label>
            <select
              value={baseCount}
              onChange={(e) => setBaseCount(Number(e.target.value))}
              className="rounded-lg border px-3 py-2"
            >
              {[5, 10, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">이벤트 이름(추기)</label>
            <input
              list="promo-list"
              value={promoName}
              onChange={(e) => setPromoName(e.target.value)}
              placeholder={loadingPromos ? '이벤트 불러오는 중…' : '예: 추석'}
              className="rounded-lg border px-3 py-2"
            />
            <datalist id="promo-list">
              {promotions.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} (+{p.bonus_sessions})
                </option>
              ))}
            </datalist>
            {!!promoName && (
              <span className="text-xs text-gray-500">
                보너스 회차: +{promoBonus}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">추가 회차(수기, 0~)</label>
            <input
              type="number"
              min={0}
              value={extraCount}
              onChange={(e) => setExtraCount(Number(e.target.value))}
              className="rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-700">
          미리보기: <b>{baseCount}</b> + <b>{promoBonus}</b>(이벤트) +{' '}
          <b>{extraCount}</b> = <b>{totalPreview}</b> 회
        </div>

        <button
          onClick={onGrant}
          disabled={submitting || !selected}
          className="w-full rounded-xl border px-4 py-3 text-base font-medium disabled:opacity-60"
        >
          {submitting ? '지급 중…' : '수강권 지급 (+이벤트/수기)'}
        </button>
      </section>
    </div>
  );
}
