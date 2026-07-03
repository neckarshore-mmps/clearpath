/**
 * Zod-schema contract on the AI output — the shape the model MUST return.
 *
 * These tests bind to the exact schema `generateObject` validates against in
 * app/actions.ts, so a schema loosening (e.g. dropping the exactly-3 rule)
 * fails here before it can silently change the product promise.
 */

import { describe, it, expect } from 'vitest'
import { biasAnalysisSchema } from '../lib/schema'

const validBias = (id: string) => ({
  id,
  why: `Your framing suggests ${id} may be steering this decision strongly.`,
})

const validPayload = () => ({
  topBiases: [
    validBias('confirmation-bias'),
    validBias('sunk-cost-fallacy'),
    validBias('anchoring-bias'),
  ],
  vetoQuestion: 'What evidence would change your mind before you commit?',
})

describe('biasAnalysisSchema — AI output contract', () => {
  it('accepts a valid payload', () => {
    const result = biasAnalysisSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })

  it('rejects fewer than three biases', () => {
    const payload = validPayload()
    payload.topBiases = payload.topBiases.slice(0, 2)
    expect(biasAnalysisSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects more than three biases', () => {
    const payload = validPayload()
    payload.topBiases.push(validBias('survivorship-bias'))
    expect(biasAnalysisSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects an empty bias id', () => {
    const payload = validPayload()
    payload.topBiases[0].id = ''
    expect(biasAnalysisSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects a "why" shorter than 20 characters', () => {
    const payload = validPayload()
    payload.topBiases[0].why = 'too short'
    expect(biasAnalysisSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects a vetoQuestion shorter than 15 characters', () => {
    const payload = validPayload()
    payload.vetoQuestion = 'Why?'
    expect(biasAnalysisSchema.safeParse(payload).success).toBe(false)
  })

  it('rejects a vetoQuestion longer than 250 characters', () => {
    const payload = validPayload()
    payload.vetoQuestion = 'x'.repeat(251)
    expect(biasAnalysisSchema.safeParse(payload).success).toBe(false)
  })
})
