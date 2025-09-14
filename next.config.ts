import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 기존 설정이 있으면 여기에 유지/병합
  transpilePackages: [
    '@fullcalendar/core',
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/interaction',
  ],
};

export default nextConfig;
