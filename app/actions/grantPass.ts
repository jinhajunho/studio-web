// app/actions/grantPass.ts
'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';

type GrantPassInput = {
  memberId: string;
  baseSessions: number;
  /** 프로모션 선택 시 */
  promoId?: string | null;
  /** 직접 입력 모드(이벤트명/추가회차) */
  manual?: { name: string; bonus: number } | null;
};

export type GrantPassResult = { ok: boolean; message: string };

/**
 * 단일 서버액션으로 수강권 지급 처리.
 * DB에는 grant_pass_unified(p_member_id, p_base_sessions, p_bonus, p_promo_id, p_event_name) RPC가 있어야 함.
 * - 권한은 DB/RLS/RPC에서 최종 검증(관리자 전용 등)하도록 한다.
 */
export async function grantPassUnified(input: GrantPassInput): Promise<GrantPassResult> {
  const supabase = await getSupabaseServerClient();

  // 1) 로그인 확인
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return { ok: false, message: '로그인이 필요합니다.' };
  }

  // 2) 입력값 검증
  const memberId = String(input.memberId || '').trim();
  const base = Number(input.baseSessions);
  const bonus = Number(input.manual?.bonus ?? 0);
  const eventName = input.manual?.name?.trim() || null;
  const promoId = input.promoId ?? null;

  if (!memberId) return { ok: false, message: '회원이 선택되지 않았습니다.' };
  if (!Number.isFinite(base) || base <= 0) {
    return { ok: false, message: '기본 회차는 1 이상의 숫자여야 합니다.' };
  }
  if (eventName !== null) {
    if (!eventName) return { ok: false, message: '이벤트명을 입력하세요.' };
    if (!Number.isFinite(bonus) || bonus < 0) {
      return { ok: false, message: '추가 회차는 0 이상의 숫자여야 합니다.' };
    }
  }

  // 3) RPC 호출
  try {
    const { data, error } = await supabase.rpc('grant_pass_unified', {
      p_member_id: memberId,
      p_base_sessions: base,
      p_bonus: bonus,
      p_promo_id: promoId,
      p_event_name: eventName,
    });

    if (error) {
      console.error('[grant_pass_unified RPC error]', error);
      return { ok: false, message: '지급 처리 중 오류가 발생했습니다.' };
    }

    // RETURNS TABLE/RECORD 대응
    const row = Array.isArray(data) ? data?.[0] : data;
    const total =
      (row && (row as any).total_sessions != null)
        ? Number((row as any).total_sessions)
        : base + (eventName ? bonus : 0);
    const remaining =
      (row && (row as any).remaining_sessions != null)
        ? Number((row as any).remaining_sessions)
        : total;

    return { ok: true, message: `지급 완료: 총 ${total}회 (남은 ${remaining})` };
  } catch (e: any) {
    console.error('[grant_pass_unified/catch]', e);
    return { ok: false, message: '지급 처리 중 오류가 발생했습니다.' };
  }
}
