/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: "img-src * data: blob:;" },
        ],
      },
    ];
  },
  webpack(config, { dev }) {
    if (dev) {
      // Use memory cache in dev to prevent .pack.gz ENOENT race conditions
      config.cache = { type: "memory" };
    }
    return config;
  },
};

module.exports = nextConfig;
