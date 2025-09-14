import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // 서버 환경변수에만

const admin = createClient(url, serviceKey);

export async function GET() {
  const { data, error } = await admin
    .from('sessions')
    .select('*')
    .order('starts_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
