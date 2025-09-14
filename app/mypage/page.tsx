// app/mypage/page.tsx
'use client';

import { useMemo } from 'react';
import { withAuth } from '@/components/withAuth';

type Pass = {
  id: string;
  total: number;
  remaining: number;
  issuedAt: string;      // ISO string
  label?: string | null; // 이벤트명/프로모션명 등
};

/** ⭐ UX 확인용 더미 데이터 — 나중에 Supabase 조회로 교체 */
const MOCK: Pass[] = [
  { id: 'p1', total: 12, remaining: 12, issuedAt: '2025-03-20T10:00:00Z', label: '봄맞이 프로모션' },
  { id: 'p2', total: 10, remaining: 7,  issuedAt: '2025-02-05T09:00:00Z', label: '신규회원' },
];

function MyPage() {
  // 최신 발급순 정렬
  const passes = useMemo(
    () => [...MOCK].sort((a, b) => +new Date(b.issuedAt) - +new Date(a.issuedAt)),
    []
  );

  return (
    <div className="container-page space-y-5">
      <div>
        <h2>내 수강권</h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">최근 발급순으로 정렬됩니다.</p>
      </div>

      {passes.length === 0 ? (
        <div className="card">
          <p className="text-sm text-[color:var(--muted)]">지급된 수강권이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {passes.map((p) => {
            const pct = Math.max(0, Math.min(100, Math.round((p.remaining / p.total) * 100)));
            return (
              <div key={p.id} className="card space-y-3">
                {/* 발급일 + 배지 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="text-sm text-[color:var(--muted)]">
                    발급일{' '}
                    {new Date(p.issuedAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {p.label && <span className="badge">{p.label}</span>}
                </div>

                {/* 수치 + 진행바 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div
                      className="text-[28px] leading-8 font-semibold"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      총 {p.total}회
                    </div>
                    <div
                      className="text-sm text-[color:var(--muted)] mt-1"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      남은 {p.remaining}회
                    </div>
                  </div>
                </div>

                {/* 진행바(인라인 스타일로 독립 동작) */}
                <div
                  aria-label="남은 회차 비율"
                  style={{
                    height: 6,
                    width: '100%',
                    background: '#F3F4F6',
                    borderRadius: 999,
                    overflow: 'hidden',
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: 'var(--primary)',
                      borderRadius: 999,
                      transition: 'width .3s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 로그인만 요구(권한 제한 없음)
export default withAuth(MyPage);
