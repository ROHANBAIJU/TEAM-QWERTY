import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Development-time proxy: forward /api and /ws to the backend running on localhost:8000
     This makes local dev smooth: frontend can call /api/ingest or open ws://localhost:3000/ws/frontend-data
     and Next's dev server will proxy to the backend. In production you should configure a proper reverse
     proxy (nginx) or point the frontend to an absolute API URL. */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
      {
        // WebSocket endpoint used by the dashboard. Note: Next dev server doesn't proxy WS by default;
        // this is still useful for fetch-based endpoints. For WS in dev, connect directly to ws://127.0.0.1:8000/ws/frontend-data
        source: '/ws/:path*',
        destination: 'http://127.0.0.1:8000/ws/:path*',
      },
    ];
  },
};

export default nextConfig;
