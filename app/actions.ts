"use server";

import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import biasesData from "@/data/biases.json";
import { biasAnalysisSchema, type Bias, type BiasAnalysis } from "@/lib/schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";

const biases = biasesData as Bias[];

const ANALYSIS_TIMEOUT_MS = 30_000;

export interface AnalysisResult {
  ok: true;
  analysis: BiasAnalysis;
  resolvedBiases: Array<{
    id: string;
    name: string;
    summary: string;
    why: string;
  }>;
}

export type AnalysisErrorKind =
  | "input_too_short"
  | "input_too_long"
  | "missing_api_key"
  | "rate_limited"
  | "timeout"
  | "schema_mismatch"
  | "provider_unavailable"
  | "unknown";

export interface AnalysisError {
  ok: false;
  kind: AnalysisErrorKind;
  error: string;
}

function classifyError(err: unknown): {
  kind: AnalysisErrorKind;
  message: string;
} {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (err.name === "AbortError" || m.includes("aborted") || m.includes("timeout")) {
      return {
        kind: "timeout",
        message: "The model took too long to respond. Please try again.",
      };
    }
    if (m.includes("rate") && (m.includes("limit") || m.includes("429"))) {
      return {
        kind: "rate_limited",
        message: "Rate limit reached. Wait a moment and try again.",
      };
    }
    if (m.includes("503") || m.includes("502") || m.includes("overloaded")) {
      return {
        kind: "provider_unavailable",
        message: "The AI provider is temporarily unavailable. Please try again shortly.",
      };
    }
    if (m.includes("schema") || m.includes("validation") || m.includes("parse")) {
      return {
        kind: "schema_mismatch",
        message: "The model returned an unexpected format. Please try again.",
      };
    }
    return { kind: "unknown", message: `Analysis failed: ${err.message}` };
  }
  return { kind: "unknown", message: "Analysis failed: unknown error." };
}

export async function analyzeDecision(
  decision: string,
): Promise<AnalysisResult | AnalysisError> {
  const trimmed = decision.trim();
  if (trimmed.length < 10) {
    return {
      ok: false,
      kind: "input_too_short",
      error: "Please describe the decision in at least a sentence or two.",
    };
  }
  if (trimmed.length > 4000) {
    return {
      ok: false,
      kind: "input_too_long",
      error: "Please keep the decision under 4000 characters.",
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      kind: "missing_api_key",
      error:
        "Server is missing ANTHROPIC_API_KEY. Set it in Vercel environment variables and redeploy.",
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);
    try {
      const { object } = await generateObject({
        model: anthropic(process.env.CLEARPATH_MODEL ?? "claude-sonnet-4-5"),
        schema: biasAnalysisSchema,
        system: buildSystemPrompt(biases),
        prompt: buildUserPrompt(trimmed),
        temperature: 0.3,
        abortSignal: controller.signal,
      });

      const byId = new Map(biases.map((b) => [b.id, b]));
      const resolvedBiases = object.topBiases
        .map((tb) => {
          const found = byId.get(tb.id);
          if (!found) return null;
          return {
            id: found.id,
            name: found.name,
            summary: found.summary,
            why: tb.why,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (resolvedBiases.length === 0) {
        return {
          ok: false,
          kind: "schema_mismatch",
          error:
            "The model returned no recognizable biases. Please try again.",
        };
      }

      return { ok: true, analysis: object, resolvedBiases };
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const { kind, message } = classifyError(err);
    return { ok: false, kind, error: message };
  }
}
