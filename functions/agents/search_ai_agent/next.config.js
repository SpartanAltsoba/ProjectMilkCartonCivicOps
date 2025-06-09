const withPlugins = require('next-compose-plugins');
const withImages = require('next-images');
const withBundleAnalyzer = require('@next/bundle-analyzer');
const path = require('path');

module.exports = withPlugins([
  [withImages],
  [
    withBundleAnalyzer({
      enabled: process.env.ANALYZE === 'true',
    }),
  ],
], {
  // Ensure that Next.js compiles with TypeScript
  typescript: {
    // Set to true to allow production builds to complete even if there are type errors
    ignoreBuildErrors: false,
  },
  
  // Configure Tailwind CSS
  cssModules: true,
  webpack(config, options) {
    config.resolve.alias['@components'] = path.join(__dirname, 'components');
    config.resolve.alias['@lib'] = path.join(__dirname, 'lib');
    config.resolve.alias['@pages'] = path.join(__dirname, 'pages');

    return config;
  },

  // Configure environmental variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },

  // Enable security headers to enhance security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src *; media-src media1.com media2.com; connect-src 'self'"  
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=()'
          }
        ],
      },
    ];
  },
});
