// app/admin/page.tsx
'use client';

function AdminPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>관리자 전용 페이지</h1>
      <p>
        이 화면은 <b>관리자 전용 영역</b>입니다.  
        로그인만 되어 있으면 접근할 수 있고, 세부 권한 검증은 DB(RLS/RPC)에서 처리됩니다.
      </p>
    </div>
  );
}

export default AdminPage;
