"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { analyzeDecision, type AnalysisResult } from "./actions";
import { BiasCard } from "@/components/BiasCard";
import { VetoTimer } from "@/components/VetoTimer";

type View =
  | { kind: "input" }
  | { kind: "analyzing" }
  | { kind: "veto"; result: AnalysisResult; decisionAtSubmit: string }
  | { kind: "error"; message: string };

const VETO_SECONDS = 60;

export default function Home() {
  const [view, setView] = useState<View>({ kind: "input" });
  const [decision, setDecision] = useState("");
  const [timerDone, setTimerDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea when we return to the input view.
  useEffect(() => {
    if (view.kind === "input") {
      textareaRef.current?.focus();
    }
  }, [view.kind]);

  function submit() {
    const text = decision.trim();
    if (text.length < 10) return;
    const submittedDecision = decision;
    setView({ kind: "analyzing" });
    setTimerDone(false);
    startTransition(async () => {
      const r = await analyzeDecision(submittedDecision);
      if (!r.ok) {
        setView({ kind: "error", message: r.error });
        return;
      }
      setView({ kind: "veto", result: r, decisionAtSubmit: submittedDecision });
    });
  }

  function reset() {
    setView({ kind: "input" });
    setDecision("");
    setTimerDone(false);
  }

  function backToInputKeepText() {
    // Preserve the user's typed decision so they can edit + retry.
    setView({ kind: "input" });
    setTimerDone(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd+Enter (mac) or Ctrl+Enter (windows/linux) submits.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-12 bg-zinc-50 dark:bg-black">
      <header className="w-full max-w-2xl mb-10">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ClearPath
          </h1>
          <span className="text-xs uppercase tracking-widest text-zinc-400">
            v0.1 · Quick-Veto
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          A mental firewall against cognitive bias. Describe a decision —
          ClearPath flags the three biases most likely distorting your thinking
          and forces a 60-second pause.
        </p>
      </header>

      <section className="w-full max-w-2xl">
        {view.kind === "input" && (
          <div className="space-y-4">
            <label
              htmlFor="decision"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              What decision are you considering right now?
            </label>
            <textarea
              ref={textareaRef}
              id="decision"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={6}
              placeholder="e.g. I want to invest 50k in a friend's startup that has tripled in valuation over the last six months..."
              className="w-full p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              maxLength={4000}
              autoFocus
            />
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-400 tabular-nums">
                {decision.length}/4000
                <span className="hidden sm:inline ml-3 text-zinc-500">
                  ⌘+↵ to submit
                </span>
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={decision.trim().length < 10 || isPending}
                className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-md font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Run veto check
              </button>
            </div>
          </div>
        )}

        {view.kind === "analyzing" && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-3 text-sm text-zinc-500">
              <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
              Analyzing your decision against the bias catalog…
            </div>
          </div>
        )}

        {view.kind === "error" && (
          <div className="border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-lg p-5">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300 mb-4">
              {view.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={backToInputKeepText}
                className="text-sm font-medium px-4 py-2 bg-red-900 dark:bg-red-200 text-red-50 dark:text-red-900 rounded-md hover:opacity-90"
              >
                Edit and retry
              </button>
              <button
                type="button"
                onClick={reset}
                className="text-sm font-medium px-4 py-2 border border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 rounded-md hover:bg-red-100 dark:hover:bg-red-950/50"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {view.kind === "veto" && (
          <div className="space-y-8">
            <div className="border-l-4 border-zinc-900 dark:border-zinc-100 pl-5 py-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
                Your decision
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 italic">
                &ldquo;{view.decisionAtSubmit}&rdquo;
              </p>
            </div>

            <div>
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
                Likely biases at play
              </h2>
              <div className="space-y-3">
                {view.result.resolvedBiases.map((b, i) => (
                  <BiasCard
                    key={b.id}
                    rank={i + 1}
                    name={b.name}
                    summary={b.summary}
                    why={b.why}
                  />
                ))}
              </div>
            </div>

            <div className="border border-zinc-900 dark:border-zinc-100 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
                Before you act — answer this
              </p>
              <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
                {view.result.analysis.vetoQuestion}
              </p>
            </div>

            <VetoTimer
              seconds={VETO_SECONDS}
              onComplete={() => setTimerDone(true)}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={reset}
                disabled={!timerDone}
                className="flex-1 px-5 py-3 bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-md font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Stop · think more
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={!timerDone}
                className="flex-1 px-5 py-3 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Proceed with decision
              </button>
            </div>
            {!timerDone && (
              <p className="text-xs text-center text-zinc-400">
                Buttons unlock after the forced pause.
              </p>
            )}
          </div>
        )}
      </section>

      <footer className="w-full max-w-2xl mt-16 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 flex justify-between">
        <span>ClearPath v0.1 · 18 verified biases</span>
        <span>Via Negativa · Friction by Design</span>
      </footer>
      {/* The imprint must be directly reachable from the start page (§ 5 DDG,
          planning #3136). The privacy link joins it with step 3 of that ticket. */}
      <nav
        aria-label="Legal"
        className="w-full max-w-2xl mt-4 text-xs text-zinc-600 dark:text-zinc-300"
      >
        <Link
          href="/impressum"
          lang="de"
          className="underline underline-offset-4 decoration-zinc-400 hover:decoration-zinc-900 dark:hover:decoration-zinc-100"
        >
          Impressum
        </Link>
      </nav>
    </main>
  );
}
