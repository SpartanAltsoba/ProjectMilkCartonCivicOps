/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  trailingSlash: true // Add trailing slashes to all URLs
};

module.exports = nextConfig;
