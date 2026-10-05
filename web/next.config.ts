import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // DB_DRIVER=stub のモック写真の配信元。本番の写真はS3の署名付きURLになるため、
    // 本番の配信元が決まった時点でこの登録を置き換える。
    remotePatterns: [new URL("https://picsum.photos/**")],
  },
};

export default nextConfig;
