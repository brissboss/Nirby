import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/config.ts");

function remotePatternFromUrl(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    return {
      protocol: url.protocol === "https:" ? ("https" as const) : ("http" as const),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/**" as const,
    };
  } catch {
    return undefined;
  }
}

const s3PublicUrlPattern = remotePatternFromUrl(process.env.NEXT_PUBLIC_S3_PUBLIC_URL);

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        pathname: "/**",
      },
      ...(s3PublicUrlPattern ? [s3PublicUrlPattern] : []),
    ],
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  silent: true,
  telemetry: false,
});
