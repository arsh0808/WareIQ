
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  
  webpack: (config, { isServer }) => {
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        undici: false,
      };
      
      config.resolve.alias = {
        ...config.resolve.alias,
        undici: false,
      };
    }

    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('undici');
    }
    
    return config;
  },
  
  transpilePackages: ['firebase'],
}

module.exports = nextConfig
