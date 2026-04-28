import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../"),
  webpack: (config, { isServer }) => {
    // Ignore the harmless OpenTelemetry warning caused by Sentry
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry\/instrumentation/ },
    ];
    return config;
  },
};

export default nextConfig;
