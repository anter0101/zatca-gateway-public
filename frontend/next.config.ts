import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
  },

  reactStrictMode: true,

  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "",
  //     },
  //   ],
  // },

  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/:path*`,
  //     },
  //   ];
  // },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
