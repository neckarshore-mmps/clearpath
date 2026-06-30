/**
 * Non-vacuous CSP parse test — S1 acceptance gate.
 *
 * We import the EXACT `buildCsp` function the proxy ships, so assertions
 * bind to the live production policy, not a duplicated string.
 *
 * Test inventory:
 *   1. Real proxy() invocation → response carries Content-Security-Policy
 *   2. Forwarded request wiring: x-nonce is present on the forwarded request
 *      headers (evidenced by the x-middleware-request-x-nonce response header
 *      that Next.js emits internally when forwarding request headers)
 *   3. Production script-src per-directive: nonce token present;
 *      'unsafe-inline' absent; 'unsafe-eval' absent
 *      (naive whole-string includes('unsafe-inline') is intentionally NOT
 *      used — style-src may carry 'unsafe-inline' in dev, scoped check only)
 *   4. Other contract directives present: object-src 'none', base-uri 'self',
 *      frame-ancestors 'none', connect-src 'self'
 *   5. Two proxy() invocations produce distinct nonces (per-request freshness)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy, buildCsp } from '../proxy'

// ---------------------------------------------------------------------------
// Helper — parse a CSP string into a map of directive → token array.
// Example: "script-src 'self' 'nonce-abc'" → Map{ 'script-src' → ["'self'", "'nonce-abc'"] }
// ---------------------------------------------------------------------------
function parseCsp(csp: string): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const part of csp.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const [name, ...tokens] = trimmed.split(/\s+/)
    if (name) map.set(name, tokens)
  }
  return map
}

// ---------------------------------------------------------------------------
// Temporarily override NODE_ENV for prod-policy assertions.
// ---------------------------------------------------------------------------
const originalEnv = process.env.NODE_ENV

describe('proxy CSP — S1 acceptance gate', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  // ── Test 1: real proxy() sets CSP on the response ─────────────────────────
  it('sets Content-Security-Policy on the response', async () => {
    const request = new NextRequest('http://localhost:3000/')
    const response = proxy(request)
    const csp = response.headers.get('content-security-policy')
    expect(csp).toBeTruthy()
    expect(csp).toContain("'nonce-")
  })

  // ── Test 2: x-nonce wiring on the forwarded request ───────────────────────
  it('sets x-nonce on the forwarded request headers', async () => {
    const request = new NextRequest('http://localhost:3000/')
    const response = proxy(request)
    // Next.js internally mirrors forwarded request headers onto the response
    // as `x-middleware-request-<header-name>` for the runtime to pick up.
    const forwardedNonce = response.headers.get('x-middleware-request-x-nonce')
    expect(forwardedNonce).toBeTruthy()
  })

  // ── Test 3: production script-src — per-directive, not whole-string ────────
  it('production script-src has nonce token, no unsafe-inline, no unsafe-eval', () => {
    // Force production policy regardless of test runner NODE_ENV.
    const nonce = 'test-nonce-s1-prod-assert'
    const csp = buildCsp(nonce, { isDev: false })
    const directives = parseCsp(csp)
    const scriptSrc = directives.get('script-src') ?? []

    // Must have a 'nonce-…' token.
    expect(scriptSrc.some((t) => t.startsWith("'nonce-"))).toBe(true)
    // Must NOT have 'unsafe-inline' (scoped to script-src — style-src may
    // have it in dev; we only assert here where it is a strict violation).
    expect(scriptSrc).not.toContain("'unsafe-inline'")
    // Must NOT have 'unsafe-eval'.
    expect(scriptSrc).not.toContain("'unsafe-eval'")
  })

  // ── Test 4: other contract directives ─────────────────────────────────────
  it('production CSP carries all required contract directives', () => {
    const nonce = 'test-nonce-contract-check'
    const csp = buildCsp(nonce, { isDev: false })
    const directives = parseCsp(csp)

    expect(directives.get('object-src')).toEqual(["'none'"])
    expect(directives.get('base-uri')).toEqual(["'self'"])
    expect(directives.get('frame-ancestors')).toEqual(["'none'"])
    // connect-src must be exactly 'self' in prod (browser never calls LLM
    // providers — the server proxy does).
    expect(directives.get('connect-src')).toEqual(["'self'"])
  })

  // ── Test 5: per-request nonce freshness ───────────────────────────────────
  it('two proxy() invocations produce distinct nonces', () => {
    const req1 = new NextRequest('http://localhost:3000/')
    const req2 = new NextRequest('http://localhost:3000/')
    const res1 = proxy(req1)
    const res2 = proxy(req2)
    const csp1 = res1.headers.get('content-security-policy') ?? ''
    const csp2 = res2.headers.get('content-security-policy') ?? ''

    // The full CSP strings differ ⟹ the nonces differ.
    expect(csp1).not.toBe(csp2)

    // Extract nonce tokens and compare them directly for clarity.
    const nonce1 = parseCsp(csp1).get('script-src')?.find((t) => t.startsWith("'nonce-"))
    const nonce2 = parseCsp(csp2).get('script-src')?.find((t) => t.startsWith("'nonce-"))
    expect(nonce1).toBeTruthy()
    expect(nonce2).toBeTruthy()
    expect(nonce1).not.toBe(nonce2)
  })
})
