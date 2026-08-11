/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Google Fonts to load
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fonts.gstatic.com" },
    ],
  },
};

export default nextConfig;
