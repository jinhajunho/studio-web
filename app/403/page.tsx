// app/403/page.tsx
'use client';

export default function ForbiddenPage() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
        403 Forbidden
      </h1>
      <p style={{ marginTop: '10px', color: '#4b5563' }}>
        이 페이지에 접근할 권한이 없습니다.
      </p>
    </div>
  );
}
