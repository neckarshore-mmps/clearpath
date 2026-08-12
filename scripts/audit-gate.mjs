#!/usr/bin/env node
/**
 * Dependency CVE gate with an EXPIRING allowlist.
 *
 * Replaces a bare `npm audit --audit-level=high`, which had no way to say
 * "we know about this one and it has no forward fix". Without that, a single
 * unfixable transitive advisory turns a required check permanently red and
 * blocks every merge — including the merge that fixes the OTHER advisories.
 * That is exactly what happened on 2026-07-27 in neckarshore-website, where
 * this file was written: `sharp` (libvips) pinned that repo shut while six
 * Next.js advisories, among them SSRF in rewrites and unauthenticated
 * disclosure of internal Server Function endpoints, sat waiting behind it.
 *
 * DESIGN RULES, in order of importance:
 *
 *  1. FAIL CLOSED. Every unexpected condition exits non-zero: malformed audit
 *     JSON, an empty payload, a missing `vulnerabilities` key, an allowlist
 *     entry whose shape is wrong, an unparseable date. A gate that fails open
 *     is worse than no gate, because it reports green.
 *  2. AN ENTRY EXPIRES. Past its date the build goes red EVEN IF the advisory
 *     is gone. That forces a human to look again instead of letting a
 *     temporary acceptance become permanent silence. This mirrors the sandbox
 *     repo's decay-check.yml, where a deadline is enforced by a job rather
 *     than by memory.
 *  3. MATCH ON ADVISORY ID, NEVER ON PACKAGE NAME. npm reports a parent
 *     package as high purely because a child is (`next` shows up "via: sharp"
 *     with no advisory of its own). Allowlisting by package name would
 *     therefore suppress far more than intended, and would silently keep
 *     suppressing it after the child was fixed. Collecting the distinct GHSA
 *     ids across the whole tree sidesteps that entirely.
 *  4. NO NEW DEPENDENCY. `audit-ci` and `better-npm-audit` both solve this,
 *     and both mean adding a dependency to the thing whose job is auditing
 *     dependencies. This is ~120 lines of zero-dep Node. (The source file names
 *     a sibling script here as its style precedent; that script exists in
 *     neither clearpath nor ai-phrase-check, so the pointer is dropped rather
 *     than carried forward dead.)
 *
 * PROVENANCE. Ported, not re-derived, from neckarshore-skills/ai-phrase-check
 * (scripts/audit-gate.mjs, PR #44), which carries it byte-identical from
 * neckarshore-websites/neckarshore-website @ 0862089. Per issue #1579 and work
 * order docs/plans/2026-08-12-audit-gate-rollout-clearpath-workorder.md. The
 * expiry semantics are the load-bearing part and the easiest thing to lose in a
 * re-implementation, so the executable logic below arrived unchanged. What was
 * changed on landing, and nothing else: this paragraph, the incident paragraph
 * under it, the allowlist commentary, the cross-repo note's example (which named
 * a dependency clearpath does not have), and the usage line — clearpath's
 * manifest sits at the repository root, not under web/.
 *
 * WHY THIS REPO NEEDED IT. clearpath is a live public site that sat in exactly
 * the trap described above. Measured 2026-08-12 at c078116: 14 distinct high
 * advisories across next, postcss, nanoid and sharp, behind a bare
 * `npm audit --audit-level=high` as a REQUIRED check. Read that 14 in this
 * file's own unit — distinct GHSA ids, which is what the gate counts. The same
 * tree reports "4 high" in npm's summary line (it counts vulnerable package
 * paths) and "8 high" in the Dependabot tab (it counts alerts, and adds 6
 * moderate the gate ignores). Three units, three numbers, one tree — so PR #57, a routine
 * react bump, was blocked by advisories it neither caused nor could remove. The
 * sibling repo ai-phrase-check passed ZERO merges for 25 days behind the same
 * shape, and it was found by a premise-check on an unrelated sentence rather
 * than by any mechanism.
 *
 * Usage:  node scripts/audit-gate.mjs        (cwd = repository root)
 * Tests:  npm test   (the guard runs under vitest as __tests__/audit-gate.test.mjs)
 */

import { execFileSync } from "node:child_process";

/**
 * Advisories we consciously accept, each with a reason and a hard expiry.
 *
 * Adding a line here is a DECISION, not a formality. Two questions must both
 * be answered in the reason: why can this not be fixed today, and what would
 * have to change for it to be removed.
 *
 * DELIBERATELY NOT SHARED ACROSS REPOS. The logic below now exists in four
 * repos, and that is the point: the ALLOWLIST is per-repo because the advisory
 * sets genuinely differ. clearpath proves it on arrival — its 2026-08-12
 * advisory set included nanoid, which reaches this tree only through postcss
 * and which none of the three earlier repos reported at all. A shared package
 * would invite one list to be applied to a repo whose dependency tree it does
 * not describe, suppressing advisories nobody ever looked at. Four files, four
 * decisions.
 */
export const ALLOWLIST = [
  // EMPTY, and that is a measured state rather than a starting default.
  //
  // At c078116 this repo reported 14 distinct high advisories, and every one of
  // them has a forward fix: next@16.3.0 clears ten, and tightening the existing
  // postcss override from `>=8.5.10 <9` to `>=8.5.23 <9` clears the remaining
  // four (two postcss, and the two nanoid advisories that reach this tree only
  // through it). Both landed in the preceding PR, so `npm audit` reports zero
  // at the commit that introduces this file.
  //
  // Nothing here needs accepting, so nothing is accepted. An entry added "while
  // we are here" — to turn a red build green without anyone deciding anything —
  // is how a gate becomes decorative.
];


const GATED = new Set(["high", "critical"]);

function die(message) {
  console.error(`\n[31mFAIL: ${message}[0m`);
  process.exit(1);
}

/** Runs npm audit and returns the parsed payload. npm exits non-zero when it finds
 *  anything, so a non-zero exit is expected and only the STDOUT matters. */
export function runAudit() {
  let raw;
  try {
    raw = execFileSync("npm", ["audit", "--json"], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    raw = err.stdout;
    // No stdout at all means npm itself failed (offline, bad registry, no lockfile).
    // That is NOT "no vulnerabilities" — fail closed.
    if (!raw || !raw.trim()) {
      die(`npm audit produced no output (exit ${err.status}). Cannot verify — refusing to pass.`);
    }
  }
  return raw;
}

/** Extracts the distinct gated advisories from an npm-audit payload. Throws rather
 *  than returning empty on anything it does not recognise. */
export function collectAdvisories(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("npm audit did not return valid JSON — refusing to pass.");
  }
  if (!data || typeof data !== "object") {
    throw new Error("npm audit JSON was not an object — refusing to pass.");
  }
  if (!("vulnerabilities" in data)) {
    throw new Error(
      "npm audit JSON has no `vulnerabilities` key — the format changed or the run failed. " +
        "Refusing to pass.",
    );
  }

  const found = new Map();
  for (const entry of Object.values(data.vulnerabilities)) {
    if (!entry || !GATED.has(entry.severity)) continue;
    for (const via of entry.via ?? []) {
      // Strings are parent-package pointers, not advisories. Only objects carry an id.
      if (typeof via !== "object" || via === null) continue;
      const id = String(via.url ?? "").split("/").pop();
      if (!id) continue;
      found.set(id, { id, title: via.title ?? "(no title)", pkg: entry.name ?? via.name ?? "?" });
    }
  }
  return found;
}

/** Validates allowlist shape and returns the entries that are past their date. */
export function findExpired(allowlist, today) {
  const expired = [];
  for (const entry of allowlist) {
    if (!entry?.id || !entry?.expires || !entry?.reason) {
      throw new Error(`allowlist entry is missing id/expires/reason: ${JSON.stringify(entry)}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.expires)) {
      throw new Error(`allowlist entry ${entry.id} has a malformed expires date: ${entry.expires}`);
    }
    if (entry.expires < today) expired.push(entry);
  }
  return expired;
}

export function evaluate(raw, allowlist, today) {
  const found = collectAdvisories(raw);
  const expired = findExpired(allowlist, today);
  const allowed = new Map(allowlist.map((e) => [e.id, e]));

  const unlisted = [...found.values()].filter((a) => !allowed.has(a.id));
  const suppressed = [...found.values()].filter((a) => allowed.has(a.id));

  return { found, unlisted, suppressed, expired, allowed };
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  let result;
  try {
    result = evaluate(runAudit(), ALLOWLIST, today);
  } catch (err) {
    die(err.message);
    return;
  }

  console.log("=== Dependency CVE gate (high/critical, expiring allowlist) ===\n");

  if (result.suppressed.length) {
    console.log("Accepted advisories — each expires and will turn this gate red:");
    for (const a of result.suppressed) {
      const e = result.allowed.get(a.id);
      console.log(`  [33m~[0m ${a.id}  ${a.pkg}${e.devOnly ? "  [dev-only]" : ""}`);
      console.log(`      ${a.title}`);
      console.log(`      expires ${e.expires} — ${e.reason}`);
    }
    console.log("");
  }

  const staleEntries = ALLOWLIST.filter(
    (e) => !result.found.has(e.id) && !result.expired.includes(e),
  );
  if (staleEntries.length) {
    console.log("Listed but no longer reported — the advisory is gone, drop these lines:");
    for (const e of staleEntries) console.log(`  [36m·[0m ${e.id}  ${e.pkg}`);
    console.log("");
  }

  if (result.expired.length) {
    console.error("[31mEXPIRED allowlist entries — re-decide, do not just extend:[0m");
    for (const e of result.expired) {
      console.error(`  [31mx[0m ${e.id}  ${e.pkg}  expired ${e.expires}`);
      console.error(`      ${e.reason}`);
    }
  }

  if (result.unlisted.length) {
    console.error("[31mUNACCEPTED high/critical advisories:[0m");
    for (const a of result.unlisted) {
      console.error(`  [31mx[0m ${a.id}  ${a.pkg}`);
      console.error(`      ${a.title}`);
    }
  }

  if (result.expired.length || result.unlisted.length) {
    die(
      `${result.unlisted.length} unaccepted advisory/advisories, ` +
        `${result.expired.length} expired allowlist entry/entries.`,
    );
  }

  console.log(
    `[32mPASS[0m — ${result.found.size} gated advisory/advisories, all explicitly accepted and unexpired.`,
  );
}

// Only run when invoked directly, so the tests can import the pure helpers.
if (process.argv[1] && process.argv[1].endsWith("audit-gate.mjs")) main();
