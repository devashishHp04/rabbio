/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'placehold.co',
          },
          {
            protocol: 'https',
            hostname: 'firebasestorage.googleapis.com',
          },
        ],
    },
    env: {
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
      LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI,
      LINKEDIN_STATE: process.env.LINKEDIN_STATE,
      LINKEDIN_SCOPE: process.env.LINKEDIN_SCOPE,
      NEXT_PUBLIC_OIDC_PROVIDER_ID: process.env.NEXT_PUBLIC_OIDC_PROVIDER_ID,
    },
};

export default nextConfig;
