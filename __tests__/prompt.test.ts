/**
 * Prompt-building contract — the system prompt must carry the full catalog
 * (the model may only pick ids from it) and the behavioral constraints; the
 * user prompt must deliver the trimmed decision text.
 */

import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from '../lib/prompt'
import biasesData from '../data/biases.json'
import type { Bias } from '../lib/schema'

const biases = biasesData as Bias[]

describe('buildSystemPrompt', () => {
  const system = buildSystemPrompt(biases)

  it('lists every bias id from the catalog', () => {
    for (const b of biases) {
      expect(system).toContain(`id: ${b.id}`)
    }
  })

  it('carries the no-recommendation constraint (friction layer, not advisor)', () => {
    expect(system).toContain('Never recommend FOR or AGAINST')
  })

  it('forbids inventing biases outside the supplied list', () => {
    expect(system).toContain('Do not invent biases')
  })
})

describe('buildUserPrompt', () => {
  it('embeds the decision text', () => {
    const prompt = buildUserPrompt('Should I invest 50k in my friend\'s startup?')
    expect(prompt).toContain('Should I invest 50k in my friend\'s startup?')
  })

  it('trims surrounding whitespace from the decision', () => {
    const prompt = buildUserPrompt('   my decision text here   ')
    expect(prompt).toContain('"""\nmy decision text here\n"""')
  })
})
