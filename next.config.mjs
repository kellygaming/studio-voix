/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" }],
  },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
