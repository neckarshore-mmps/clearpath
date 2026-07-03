/**
 * Bias-catalog integrity — data/biases.json is the ground truth the prompt
 * and the id-resolution logic in app/actions.ts both depend on. A malformed
 * entry breaks the core loop silently (bias dropped from the result), so the
 * catalog is contract-tested here.
 */

import { describe, it, expect } from 'vitest'
import biasesData from '../data/biases.json'
import type { Bias } from '../lib/schema'

const biases = biasesData as Bias[]

describe('bias catalog — data/biases.json', () => {
  it('contains exactly 18 biases (the v0.1 promise)', () => {
    expect(biases).toHaveLength(18)
  })

  it('has unique ids', () => {
    const ids = biases.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses kebab-case ids within the schema length bound', () => {
    for (const b of biases) {
      expect(b.id, `id: ${b.id}`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(b.id.length).toBeLessThanOrEqual(64)
    }
  })

  it('has non-empty name, summary, and example on every entry', () => {
    for (const b of biases) {
      expect(b.name.trim(), `name of ${b.id}`).not.toBe('')
      expect(b.summary.trim(), `summary of ${b.id}`).not.toBe('')
      expect(b.example.trim(), `example of ${b.id}`).not.toBe('')
    }
  })
})
