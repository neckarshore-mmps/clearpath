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
};

export default nextConfig;
