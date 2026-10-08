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
import { inspect } from 'node:util'
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
      label: 'credit/billing failure → provider_unavailable (never leak billing state)',
      error: new Error(
        'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing.',
      ),
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

  it('never echoes raw provider error text to the client', async () => {
    generateObjectMock.mockRejectedValue(
      new Error('internal detail: account acct_12345 flagged'),
    )
    const result = await analyzeDecision(DECISION)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).not.toContain('acct_12345')
      expect(result.error).not.toContain('internal detail')
    }
  })
})

/**
 * WHAT THE SERVER LOG MAY HOLD OF A FAILED ANALYSIS — planning #3136, DPO
 * opinion of 2026-10-08, section 2 (MEDIUM, Art. 5(1)(c) and (f)).
 *
 * The AI SDK's errors carry the request and the model's answer as properties
 * (`requestBodyValues`, `responseBody`, `text`, and a `cause` that may hold
 * them again). The request is the visitor's text; the answer quotes it by
 * design. A log line that writes the error object writes both. The privacy
 * page says we store none of it, so the line may hold the error's kind, its
 * name and a status code, and nothing else.
 *
 * WHAT THIS TEST CANNOT DO: it reads what this code hands to console.error.
 * It does not read Vercel's log, and it says nothing about what the platform
 * records of a request on its own.
 */
describe('analyzeDecision — what a failure writes to the log', () => {
  const MARKER = 'MARKER-7f3a-visitor-wrote-this'

  function written(spy: ReturnType<typeof vi.spyOn>): string {
    // util.inspect with unlimited depth and hidden properties: at least as
    // much as Node's console would print of each argument.
    return spy.mock.calls
      .map((args: unknown[]) =>
        args
          .map((a) => inspect(a, { depth: null, showHidden: true, maxStringLength: null }))
          .join(' '),
      )
      .join('\n')
  }

  function sdkError(name: string, statusCode: number | undefined) {
    return Object.assign(new Error(`provider said: ${MARKER}`), {
      name,
      statusCode,
      requestBodyValues: { messages: [{ role: 'user', content: MARKER }] },
      responseBody: `{"error":"echo ${MARKER}"}`,
      text: `The user's situation: ${MARKER}`,
      cause: new Error(`inner ${MARKER}`),
    })
  }

  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    spy.mockRestore()
  })

  it('writes nothing of the request, the answer, the message or the cause', async () => {
    generateObjectMock.mockRejectedValue(sdkError('AI_APICallError', 529))
    await analyzeDecision(`${DECISION} ${MARKER}`)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(written(spy)).not.toContain(MARKER)
  })

  it('writes the kind, the name and the status code', async () => {
    generateObjectMock.mockRejectedValue(sdkError('AI_APICallError', 429))
    await analyzeDecision(DECISION)
    const line = written(spy)
    expect(line).toContain('[clearpath] analysis failed')
    expect(line).toContain('kind=unknown')
    expect(line).toContain('name=AI_APICallError')
    expect(line).toContain('status=429')
  })

  it('writes a name only when it looks like a class name', async () => {
    generateObjectMock.mockRejectedValue(sdkError(`Err ${MARKER} {"x":1}`, undefined))
    await analyzeDecision(DECISION)
    const line = written(spy)
    expect(line).not.toContain(MARKER)
    expect(line).toContain('name=-')
    expect(line).toContain('status=-')
  })

  it('writes a fixed line for a throw that is not an Error', async () => {
    generateObjectMock.mockRejectedValue(`string failure ${MARKER}`)
    await analyzeDecision(DECISION)
    const line = written(spy)
    expect(line).not.toContain(MARKER)
    expect(line).toContain('kind=unknown')
    expect(line).toContain('name=-')
  })

  it('hands console.error one string and no object', async () => {
    generateObjectMock.mockRejectedValue(sdkError('AI_NoObjectGeneratedError', undefined))
    await analyzeDecision(DECISION)
    expect(spy.mock.calls[0]).toHaveLength(1)
    expect(typeof spy.mock.calls[0][0]).toBe('string')
  })
})
