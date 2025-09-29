// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL/Key 읽기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * ✅ 클라이언트 전용 Supabase 인스턴스
 * - 브라우저에서 사용
 * - Row Level Security 정책이 적용됨
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
