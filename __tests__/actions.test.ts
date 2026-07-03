/**
 * Core-loop contract on analyzeDecision — the single server action behind
 * the product. `generateObject` (AI SDK) is mocked so every error path is
 * exercised deterministically; the bias catalog itself stays real, so the
 * id-resolution logic is tested against the shipped data.
 *
 * Covered:
 *   input validation → no model call
 *   missing API key  → operator-actionable error
 *   happy path       → catalog-joined resolvedBiases in model order
 *   unknown ids      → filtered; all-unknown → schema_mismatch
 *   thrown errors    → classifyError mapping (timeout / rate_limited /
 *                      provider_unavailable / schema_mismatch / unknown)
 *   model selection  → Sonnet 4.5 default, CLEARPATH_MODEL override
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import biasesData from '../data/biases.json'
import type { Bias } from '../lib/schema'

const { generateObjectMock } = vi.hoisted(() => ({
  generateObjectMock: vi.fn(),
}))

vi.mock('ai', () => ({
  generateObject: generateObjectMock,
}))

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: (modelId: string) => ({ modelId }),
}))

import { analyzeDecision } from '../app/actions'

const biases = biasesData as Bias[]

const DECISION =
  'I want to invest 50k in a friend\'s startup that has tripled in valuation.'

function aiObject(ids: string[]) {
  return {
    object: {
      topBiases: ids.map((id) => ({
        id,
        why: `The wording strongly suggests ${id} is shaping this decision.`,
      })),
      vetoQuestion: 'What evidence would change your mind before you commit?',
    },
  }
}

beforeEach(() => {
  generateObjectMock.mockReset()
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('analyzeDecision — input validation', () => {
  it('rejects input shorter than 10 characters without calling the model', async () => {
    const result = await analyzeDecision('too short')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe('input_too_short')
    expect(generateObjectMock).not.toHaveBeenCalled()
  })

  it('rejects whitespace-padded short input', async () => {
    const result = await analyzeDecision('   abc     ')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe('input_too_short')
    expect(generateObjectMock).not.toHaveBeenCalled()
  })

  it('rejects input longer than 4000 characters without calling the model', async () => {
    const result = await analyzeDecision('x'.repeat(4001))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe('input_too_long')
    expect(generateObjectMock).not.toHaveBeenCalled()
  })
})

describe('analyzeDecision — environment', () => {
  it('returns missing_api_key when ANTHROPIC_API_KEY is unset', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', undefined)
    const result = await analyzeDecision(DECISION)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe('missing_api_key')
    expect(generateObjectMock).not.toHaveBeenCalled()
  })

  it('uses claude-sonnet-4-5 by default', async () => {
    generateObjectMock.mockResolvedValue(
      aiObject(['confirmation-bias', 'sunk-cost-fallacy', 'anchoring-bias']),
    )
    await analyzeDecision(DECISION)
    expect(generateObjectMock.mock.calls[0][0].model).toEqual({
      modelId: 'claude-sonnet-4-5',
    })
  })

  it('honors the CLEARPATH_MODEL override', async () => {
    vi.stubEnv('CLEARPATH_MODEL', 'claude-haiku-4-5')
    generateObjectMock.mockResolvedValue(
      aiObject(['confirmation-bias', 'sunk-cost-fallacy', 'anchoring-bias']),
    )
    await analyzeDecision(DECISION)
    expect(generateObjectMock.mock.calls[0][0].model).toEqual({
      modelId: 'claude-haiku-4-5',
    })
  })
})

describe('analyzeDecision — happy path', () => {
  it('resolves bias ids against the catalog, preserving model order and why', async () => {
    const ids = ['anchoring-bias', 'confirmation-bias', 'sunk-cost-fallacy']
    generateObjectMock.mockResolvedValue(aiObject(ids))

    const result = await analyzeDecision(DECISION)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.resolvedBiases).toHaveLength(3)
    result.resolvedBiases.forEach((resolved, i) => {
      const catalogEntry = biases.find((b) => b.id === ids[i])!
      expect(resolved.id).toBe(ids[i])
      expect(resolved.name).toBe(catalogEntry.name)
      expect(resolved.summary).toBe(catalogEntry.summary)
      expect(resolved.why).toContain(ids[i])
    })
    expect(result.analysis.vetoQuestion).toBeTruthy()
  })

  it('filters bias ids the catalog does not know', async () => {
    generateObjectMock.mockResolvedValue(
      aiObject(['confirmation-bias', 'made-up-bias', 'anchoring-bias']),
    )
    const result = await analyzeDecision(DECISION)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.resolvedBiases.map((b) => b.id)).toEqual([
      'confirmation-bias',
      'anchoring-bias',
    ])
  })

  it('returns schema_mismatch when no returned id is in the catalog', async () => {
    generateObjectMock.mockResolvedValue(
      aiObject(['fake-one', 'fake-two', 'fake-three']),
    )
    const result = await analyzeDecision(DECISION)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe('schema_mismatch')
  })
})

describe('analyzeDecision — error classification', () => {
  const cases: Array<{ label: string; error: unknown; kind: string }> = [
    {
      label: 'AbortError → timeout',
      error: Object.assign(new Error('The operation was aborted'), {
        name: 'AbortError',
      }),
      kind: 'timeout',
    },
    {
      label: '429 rate limit → rate_limited',
      error: new Error('429: rate limit exceeded, retry later'),
      kind: 'rate_limited',
    },
    {
      label: 'overloaded provider → provider_unavailable',
      error: new Error('Service overloaded, please retry'),
      kind: 'provider_unavailable',
    },
    {
      label: '503 → provider_unavailable',
      error: new Error('upstream returned 503'),
      kind: 'provider_unavailable',
    },
    {
      label: 'schema validation failure → schema_mismatch',
      error: new Error('response did not match schema: validation failed'),
      kind: 'schema_mismatch',
    },
    {
      label: 'unclassified Error → unknown',
      error: new Error('something entirely unexpected'),
      kind: 'unknown',
    },
    {
      label: 'non-Error throw → unknown',
      error: 'string failure',
      kind: 'unknown',
    },
  ]

  for (const { label, error, kind } of cases) {
    it(label, async () => {
      generateObjectMock.mockRejectedValue(error)
      const result = await analyzeDecision(DECISION)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.kind).toBe(kind)
        expect(result.error).toBeTruthy()
      }
    })
  }
})
