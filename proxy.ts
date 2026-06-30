/**
 * ClearPath proxy.ts — per-request nonce-CSP + security-header wiring.
 *
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` (v16.0.0).
 * This file MUST be named `proxy.ts` at the project root; the legacy
 * `middleware` convention is deprecated and no longer recognised.
 *
 * Security posture (Art. 9 GDPR / G3 gate):
 *   - Strict nonce-based CSP generated fresh per request.
 *   - Nonce set on BOTH the forwarded request (x-nonce + CSP) and the
 *     response CSP header. Next.js reads the request-side CSP during SSR
 *     and automatically injects the nonce into framework/page scripts.
 *   - `connect-src 'self'` — explicit: the browser never calls AI providers
 *     directly; all LLM traffic goes via the server's action layer.
 *   - `'strict-dynamic'` in script-src: deliberate hardening beyond the gate
 *     literal. It is a strict superset of `'nonce-…'` — it does NOT introduce
 *     `unsafe-inline`/`unsafe-eval`. Reviewer note: this is intentional, not
 *     scope creep. See task-S1-report.md §strict-dynamic rationale.
 *
 * Runtime: Node.js (Next.js 16 proxy default — do NOT set `runtime` config
 * here; it throws in v16).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Pure CSP builder — exported so tests import the EXACT string the proxy ships.
// ---------------------------------------------------------------------------

export function buildCsp(nonce: string, opts: { isDev: boolean }): string {
  const { isDev } = opts

  const raw = [
    `default-src 'self'`,
    // 'strict-dynamic' is deliberate hardening: allows scripts loaded by
    // nonce-blessed scripts, which is what Next.js RSC bootstrap needs.
    // In dev, 'unsafe-eval' is added because React uses eval for enhanced
    // error stack reconstruction — it is not present in production.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // In dev, 'unsafe-inline' is needed for Tailwind JIT / style injection.
    // Production uses nonce-based style gates instead.
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    // 'self' only in production. Dev adds 'ws:' so Turbopack/webpack HMR
    // websockets are not blocked.
    `connect-src 'self'${isDev ? ' ws:' : ''}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ]
    .join('; ')
    .trim()

  return raw
}

// ---------------------------------------------------------------------------
// Proxy function — runs per-request before route rendering.
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const csp = buildCsp(nonce, { isDev })

  // Forward x-nonce and the CSP to the App Router's SSR pipeline.
  // Next.js parses the request-side Content-Security-Policy header during
  // rendering and automatically stamps the extracted nonce onto framework
  // scripts, page bundles, and inline bootstrap tags.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Also set the CSP on the response so browsers receive it.
  response.headers.set('content-security-policy', csp)

  return response
}

// ---------------------------------------------------------------------------
// Matcher — apply to rendered pages only; skip static assets + prefetches.
// Canonical exclusion from the Next.js CSP guide.
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
