'use client';

import { withAuth } from '@/components/withAuth';

function AdminPage() {
  console.log('✅ AdminPage 렌더링됨');   // 👈 페이지 렌더링 확인용 로그

  return (
    <div style={{ padding: '20px' }}>
      <h1>관리자 전용 페이지</h1>
      <p>
        이 화면은 <b>admin</b> 권한만 접근할 수 있습니다.
      </p>
    </div>
  );
}

// admin 권한만 접근 허용
export default withAuth(AdminPage);
