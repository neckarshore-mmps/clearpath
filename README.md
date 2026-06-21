# ClearPath

A mental firewall against cognitive bias. Describe a decision — ClearPath surfaces the three biases most likely distorting your thinking and forces a 60-second pause before you act.

GmanFooFoo side-project. v0.1 prototype.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Vercel AI SDK + Anthropic Claude Sonnet 4.5
- Zod for structured AI output
- Vercel deployment

## Local development

```bash
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000.

## Deployment

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview
vercel deploy --prod
```

## v0.1 scope

- Single page, three states (input → analyzing → veto).
- 18 verified cognitive biases bundled as static JSON.
- No auth, no persistence, no tracking — anonymous use.
- 60-second timer enforces the Friction-by-Design pause before any action.

## Roadmap

- v0.2 — Decision-Cemetery (auth + Vercel Postgres), expand to full Dobelli 52.
- v0.3 — Strategic Deep-Dive (5-Gate workflow).
- v0.4 — Pre-Mortem Generator + voice input.
- v1.0 — Team-mode + Obsidian-Sync.

Detailed spec + roadmap are maintained in the private Neckarshore AI planning workspace.

## FAQ

**What is ClearPath?**
A mental firewall against cognitive bias. You describe a decision; ClearPath names the three biases most likely distorting your thinking and enforces a 60-second pause before you act.

**Can I use it today?**
Yes — it's a working v0.1 prototype: a single page, 18 verified biases, the Friction-by-Design timer. Early, but real.

**Do you store my decisions or track me?**
No. No auth, no persistence, no analytics — use is fully anonymous. Your decision text is sent to the AI model for the single analysis and not retained by ClearPath.

**Where does the analysis come from?**
Anthropic's Claude (via the Vercel AI SDK) reasoning over 18 verified cognitive biases bundled as static data — not a black box of scraped opinions.

**Is this a product or a side-project?**
A GmanFooFoo side-project under the Neckarshore AI umbrella. The roadmap (Decision-Cemetery, full Dobelli 52, team-mode) is above.
