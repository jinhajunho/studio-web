'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestPage() {
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('admin_whoami');
      console.log('whoami', data, error);
    })();
  }, []);
  return <div>check console</div>;
}
