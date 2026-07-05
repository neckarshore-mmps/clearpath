import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Static security headers — applied to all routes via the Next.js config
   * headers() hook. These are set before the proxy runs (execution order:
   * next.config headers → proxy → route).
   *
   * Content-Security-Policy is intentionally ABSENT here: it must be
   * per-request (with a fresh nonce) and is therefore set exclusively in
   * proxy.ts.
   *
   * G1/G3 gate headers:
   *   - HSTS: max-age=63072000 (2 years) + includeSubDomains + preload
   *   - X-Content-Type-Options: nosniff (MIME sniffing defense)
   *   - Referrer-Policy: strict-origin-when-cross-origin
   *   - Permissions-Policy: camera, microphone, geolocation, browsing-topics
   *     all denied — ClearPath handles sensitive personal data (Art. 9 GDPR)
   *     and has no use for any of these browser APIs.
   *   - X-Frame-Options: DENY — defense-in-depth alongside the CSP
   *     `frame-ancestors 'none'` directive set in proxy.ts.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            // Defense-in-depth alongside CSP `frame-ancestors 'none'` in proxy.ts.
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },

  /**
   * Product rename (2026-07-05): the canonical production URL is now the branded
   * domain https://clearpath.neckarshore.ai. The legacy Vercel auto-domain from
   * before the project rename (clearpath-52.vercel.app) is kept as a permanent
   * (308) redirect to the branded domain so old links resolve and search engines
   * consolidate on one canonical host (Rail R5). Host-scoped via `has` so the
   * branded domain and the new clearpath.vercel.app auto-domain pass through
   * untouched.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "clearpath-52.vercel.app" }],
        destination: "https://clearpath.neckarshore.ai/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
