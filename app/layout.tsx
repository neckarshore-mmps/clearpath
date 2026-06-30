import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * Force dynamic rendering for the entire app.
 *
 * Required by the nonce-CSP architecture: a fresh nonce is generated per
 * request in proxy.ts and injected into `Content-Security-Policy` +
 * `x-nonce` on the request headers. Next.js reads those headers during
 * server-side rendering to stamp the nonce on framework scripts and inline
 * bootstrap tags. Static prerendering produces HTML at build time — before
 * any request or nonce exists — so the scripts carry no nonce and the
 * browser's strict-dynamic policy blocks them, leaving the page unhydrated.
 *
 * This route-segment config is placed here (the root layout, a Server
 * Component) rather than in page.tsx because page.tsx is a "use client"
 * component and cannot carry route-segment config exports.
 *
 * Implications: all routes under this layout are dynamically rendered
 * (SSR per request). CDN caching of HTML is disabled. Appropriate for
 * ClearPath: it handles Art. 9 sensitive data and must not serve stale,
 * unnested personal-decision content from a cache.
 */
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClearPath — A Mental Firewall Against Cognitive Bias",
  description:
    "Describe a decision. ClearPath surfaces the three cognitive biases most likely distorting your thinking and forces a 60-second pause before you act.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
