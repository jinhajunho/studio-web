// app/actions/grantPass.ts
'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';

type GrantPassInput = {
  memberId: string;
  baseSessions: number;
  promoId?: string | null;                         // 선택
  manual?: { name: string; bonus: number } | null; // 선택(직접 입력)
};

type GrantPassResult = { ok: boolean; message: string };

export async function grantPassUnified(input: GrantPassInput): Promise<GrantPassResult> {
  const supabase = await getSupabaseServerClient();

  // 1) 로그인 확인
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return { ok: false, message: '로그인이 필요합니다.' };
  }

  // 2) 유효성
  const base = Number(input.baseSessions);
  const bonus = Number(input.manual?.bonus ?? 0);
  if (!input.memberId) return { ok: false, message: '회원이 선택되지 않았습니다.' };
  if (!Number.isFinite(base) || base <= 0) {
    return { ok: false, message: '기본 회차는 1 이상의 숫자여야 합니다.' };
  }

  // 3) 단일 RPC 호출 (DB에 이미 생성한 grant_pass_unified)
  try {
    const { data, error } = await supabase.rpc('grant_pass_unified', {
      p_member_id: input.memberId,
      p_base_sessions: base,
      p_bonus: bonus,
      p_promo_id: input.promoId ?? null,
      p_event_name: input.manual?.name ?? null,
    });

    if (error) {
      // 상세는 콘솔에만, 화면엔 일반 문구
      console.error('[grant_pass_unified]', error);
      return { ok: false, message: '지급 처리 중 오류가 발생했습니다.' };
    }

    // RETURNS TABLE 대응: 배열/객체 모두 처리
    const row = Array.isArray(data) ? data[0] : data;
    const total = (row as any)?.total_sessions ?? base + bonus;
    const remaining = (row as any)?.remaining_sessions ?? total;

    return { ok: true, message: `지급 완료: 총 ${total}회 (남은 ${remaining})` };
  } catch (e: any) {
    console.error('[grant_pass_unified/catch]', e);
    return { ok: false, message: '지급 처리 중 오류가 발생했습니다.' };
  }
}
