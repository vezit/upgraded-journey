/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
      };
    }
    config.experiments = { ...(config.experiments || {}), asyncWebAssembly: true };
    config.module.rules.push({ test: /\.wasm$/, type: 'webassembly/async' });
    config.resolve.extensions = [...(config.resolve.extensions || []), '.wasm'];
    return config;
  },
};

export default nextConfig;
