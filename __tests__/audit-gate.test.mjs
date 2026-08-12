/**
 * Guard for the dependency CVE gate (scripts/audit-gate.mjs).
 *
 * The gate decides whether a REQUIRED status check goes green, so its own
 * failure modes need a test — a gate that silently passes is indistinguishable
 * from a healthy repo right up until it isn't. Every case below asserts a
 * FAIL-CLOSED property: the gate must refuse to pass on bad input, not shrug.
 *
 * DEVIATION FROM THE SOURCE, disclosed. In neckarshore-website, oakwoodgolfclub
 * and ai-phrase-check this guard is a bespoke zero-framework script run as its
 * own CI step. Here it is expressed as a vitest test instead, for one concrete
 * reason: clearpath's emit-stats job reads vitest's JSON reporter, so as a
 * vitest test the 18 assertions are counted in stats.json for free. The bespoke
 * shape is invisible to that reporter and produced an 18-assertion undercount on
 * ai-phrase-check (backlog #567) — shipping it again here would have reproduced
 * a known defect knowingly. The assertions themselves are carried over one for
 * one; only the harness changed.
 *
 * Kept as .mjs on purpose: tsconfig.json's `include` covers **\/*.ts, **\/*.tsx
 * and **\/*.mts but not **\/*.mjs, so this file and the untyped gate it imports
 * stay outside `next build`'s type-check while vitest still collects them.
 */

import { describe, expect, it } from 'vitest'

import { ALLOWLIST, collectAdvisories, evaluate, findExpired } from '../scripts/audit-gate.mjs'

/** Minimal npm-audit-shaped payload. */
function payload(vulns) {
  return JSON.stringify({ vulnerabilities: vulns })
}

function advisory(id, title = 't') {
  return { url: `https://github.com/advisories/${id}`, title }
}

describe('audit-gate — fail-closed on malformed input', () => {
  it('throws on non-JSON input', () => {
    expect(() => collectAdvisories('not json at all')).toThrow()
  })

  it('throws on empty string', () => {
    expect(() => collectAdvisories('')).toThrow()
  })

  it('throws when the `vulnerabilities` key is absent', () => {
    // The dangerous case: valid JSON that simply has no findings key. Treating
    // this as "zero vulnerabilities" is the classic fail-open bug.
    expect(() => collectAdvisories(JSON.stringify({ metadata: {} }))).toThrow()
  })

  it('throws when the payload is a bare array', () => {
    expect(() => collectAdvisories('[]')).toThrow()
  })
})

describe('audit-gate — advisory collection', () => {
  it('collects a high advisory by its GHSA id', () => {
    const raw = payload({ foo: { severity: 'high', name: 'foo', via: [advisory('GHSA-aaaa')] } })
    expect(collectAdvisories(raw).has('GHSA-aaaa')).toBe(true)
  })

  it('ignores moderate and low severities', () => {
    const raw = payload({
      a: { severity: 'moderate', name: 'a', via: [advisory('GHSA-mod')] },
      b: { severity: 'low', name: 'b', via: [advisory('GHSA-low')] },
    })
    expect(collectAdvisories(raw).size).toBe(0)
  })

  it('includes critical, not just high', () => {
    const raw = payload({ a: { severity: 'critical', name: 'a', via: [advisory('GHSA-crit')] } })
    expect(collectAdvisories(raw).has('GHSA-crit')).toBe(true)
  })

  it('string `via` entries contribute no advisory id', () => {
    // The transitive-parent case: npm marks `next` high purely because sharp is,
    // with via: ["sharp"] and no advisory object of its own. Matching on package
    // name here would suppress far more than intended — and clearpath is the repo
    // where that mattered: at c078116 `next` was reported high for four separate
    // reasons, only some of which were its own.
    const raw = payload({ next: { severity: 'high', name: 'next', via: ['sharp'] } })
    expect(collectAdvisories(raw).size).toBe(0)
  })

  it('the same advisory reached twice is counted once', () => {
    const raw = payload({
      a: { severity: 'high', name: 'a', via: [advisory('GHSA-dup')] },
      b: { severity: 'high', name: 'b', via: [advisory('GHSA-dup')] },
    })
    expect(collectAdvisories(raw).size).toBe(1)
  })
})

describe('audit-gate — allowlist evaluation', () => {
  const LIST = [{ id: 'GHSA-known', pkg: 'p', devOnly: false, expires: '2099-01-01', reason: 'r' }]

  it('an unlisted advisory is reported as unaccepted', () => {
    const raw = payload({ x: { severity: 'high', name: 'x', via: [advisory('GHSA-surprise')] } })
    const r = evaluate(raw, LIST, '2026-08-12')
    expect(r.unlisted).toHaveLength(1)
    expect(r.unlisted[0].id).toBe('GHSA-surprise')
  })

  it('a listed, unexpired advisory is suppressed rather than failed', () => {
    const raw = payload({ x: { severity: 'high', name: 'p', via: [advisory('GHSA-known')] } })
    const r = evaluate(raw, LIST, '2026-08-12')
    expect(r.unlisted).toHaveLength(0)
    expect(r.suppressed).toHaveLength(1)
  })

  it('an expired entry fails EVEN IF its advisory is gone', () => {
    // The whole point of the expiry: it forces a revisit rather than letting a
    // temporary acceptance become permanent silence.
    const expiring = [
      { id: 'GHSA-old', pkg: 'p', devOnly: false, expires: '2026-01-01', reason: 'r' },
    ]
    const r = evaluate(payload({}), expiring, '2026-08-12')
    expect(r.expired).toHaveLength(1)
  })

  it('an entry expiring exactly today is still valid', () => {
    const sameDay = [{ id: 'GHSA-t', pkg: 'p', devOnly: false, expires: '2026-08-12', reason: 'r' }]
    expect(findExpired(sameDay, '2026-08-12')).toHaveLength(0)
  })

  it('throws on an allowlist entry missing a reason', () => {
    expect(() => findExpired([{ id: 'GHSA-x', expires: '2099-01-01' }], '2026-08-12')).toThrow()
  })

  it('throws on a malformed expiry date', () => {
    expect(() =>
      findExpired([{ id: 'GHSA-x', expires: '31.10.2026', reason: 'r' }], '2026-08-12'),
    ).toThrow()
  })
})

describe('audit-gate — the shipped allowlist', () => {
  it('is well-formed and unexpired today', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(findExpired(ALLOWLIST, today)).toHaveLength(0)
  })

  it('carries a substantive reason on every entry', () => {
    for (const e of ALLOWLIST) {
      expect(e.reason.length, `${e.id} has a token reason — say why it cannot be fixed`).toBeGreaterThan(60)
    }
  })

  it('has unique ids', () => {
    const ids = ALLOWLIST.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
