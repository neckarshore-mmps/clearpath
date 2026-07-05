# Security Policy

ClearPath is a public, source-available side-project under the Neckarshore AI
umbrella. It is a small web application, but it processes a user's own decision
text and reasons over it with a third-party AI model — so we take reports about
its confidentiality, integrity, and availability seriously.

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | Yes                |
| < 0.1   | No                 |

Only the current release line receives security updates. ClearPath is
deployed continuously from `main`; the live deployment always tracks the
newest tagged release.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security problems.** A public
issue discloses the weakness to everyone before a fix exists.

Use one of these private channels instead:

1. **GitHub private vulnerability reporting (preferred).** Open a private
   advisory at
   [github.com/neckarshore-mmps/clearpath/security/advisories/new](https://github.com/neckarshore-mmps/clearpath/security/advisories/new).
   This keeps the report visible only to the maintainer until a fix ships.
2. **Email.** Write to **german@rauhut.com** with `ClearPath security` in the
   subject line. PGP is not required; if you prefer encrypted contact, say so
   and we will arrange a key exchange.

Please include:

1. **What you found** — a description of the vulnerability.
2. **How to reproduce** — the exact steps, request, or input that triggers it.
3. **Impact** — what an attacker could achieve (data exposure, injection,
   denial of service, etc.).
4. **Environment** — the URL, browser, or commit you observed it on.

**Response time:** Best-effort. ClearPath is solo-maintained, not a commercial
service with a contractual SLA. We aim to acknowledge a valid report within a
few working days, agree a disclosure timeline with you, and credit you in the
advisory unless you ask us not to. Please give us a reasonable window to ship a
fix before any public disclosure (coordinated disclosure).

## Data Handling

Understanding what ClearPath does with your input is part of its security
posture, so it is documented here explicitly.

- **No persistence, no accounts, no tracking (v0.1).** ClearPath stores nothing
  server-side: there is no database, no auth, no analytics, and no logging of
  decision content. Use is anonymous.
- **Your decision text is sent to a third-party AI model.** When you submit a
  decision, its text is transmitted to Anthropic's Claude (via the Vercel AI
  SDK) for the single bias analysis, and is not retained by ClearPath after the
  response is returned. Anthropic's data-handling commitments apply to that API
  call: **https://www.anthropic.com/privacy**.
- **Implication.** For decisions you would be comfortable processing through any
  cloud-based AI assistant, the data flow is unremarkable. For highly sensitive
  matters (legal, medical, financial, personal), treat the third-party model
  call as the relevant consideration before entering the text.

## Scope

In scope: the ClearPath application code in this repository and its deployed
instance — for example input handling, the AI request/response path, dependency
and supply-chain issues, and secret exposure.

Out of scope: vulnerabilities in Anthropic's or Vercel's platforms themselves
(report those to the respective vendor), and findings that require a
pre-compromised device or physical access.

## Secrets

ClearPath needs exactly one secret at runtime: `ANTHROPIC_API_KEY`, supplied as
an environment variable and never committed. If you ever find a credential of
any kind committed to this repository's history, treat it as a vulnerability and
report it privately via the channels above so it can be rotated.
