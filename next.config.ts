import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // docker 이미지에 서버 실행에 필요한 파일만 담는다(Vercel 배포에는 영향 없음).
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
