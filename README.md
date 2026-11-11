# Law AI Tutor: Socratic Civil Law Practice

[![CI](https://github.com/lutiangafar-git/law-tutor-drill/actions/workflows/test.yml/badge.svg)](https://github.com/lutiangafar-git/law-tutor-drill/actions/workflows/test.yml)

**Live app:** https://law-tutor-drill.vercel.app
**Demo video (2 min):** _link added at submission_
**Course:** Week 4 Graded Mini Project 4.2, AI-Powered Web Application

An AI tutor for **Philippine law students and bar reviewees** that makes you **answer first**, then scores your
bar-style answer on **Answer, Legal basis, Application and Conclusion (ALAC)**, coaches the weakest part, and
uses **only reviewed Philippine sources**. It never invents a citation. Its usage rules follow school AI
policies: Year 1–2 students are paused during class hours, and Year 3–4 students get a quick in-class check.

> **Why:** UP Law restricted AI in first-year core subjects in 2026, citing weaker reasoning. About 54% of 2025
> bar examinees were repeaters or refreshers, and general chatbots give answers away and can invent
> Philippine citations. See the [validation report](docs/01-idea-validation-report.md).

## What it does

| Who | Civil Law topics | When |
|---|---|---|
| Year 1 student | Persons & Family Relations, Obligations | After class only (paused in class hours) |
| Year 2 student | Sales | After class only |
| Year 3 student | Succession | In class (Quick Check) and after |
| Year 4 student | All Civil Law | In class (Quick Check) and after |
| Bar reviewee (first-time or repeater) | All Civil Law | Anytime; repeaters start with a diagnostic |

**Three AI features**
1. **Recitation drill:** five Socratic steps (facts → issue → rule → reasoning → application), each scored 0–2. Asking "just tell me" gets you a hint, not the answer.
2. **In-class Quick Check (Year 3–4 only):** type your recitation first, then get one reply with what's right, what's missing and the citation. It never writes a script to read aloud.
3. **Problem drill:** a real past bar question (2010–2024) → ALAC Practice score → coaching on your weakest element → retry → the model answer is revealed only after the retry. Weak spots are tracked across drills.

**Trust rules:** the AI sees only the topic's source file. Questions outside it get *"That's outside the
reviewed materials for this drill."* Every score is labelled **"Practice score"**, never official bar grading.

> ⚠️ **Demo content.** The six current topics (Civil Code Arts. 40–41, 854, 810/814, 1156–1157, 1544/1874 and
> Family Code Arts. 2–4) are marked **"Demo content: pending lawyer review"** in the app until a law-trained
> reviewer signs them off. Do not rely on them as legal advice.

## Tech stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Anthropic Claude API (`claude-haiku-5-5` for fast turns,
`claude-sonnet-5-5` for ALAC scoring) · Vitest · GitHub Actions · Vercel (hosting and Web Analytics).
No database and no login: progress stays in the user's browser.

## Run it on your computer
Requirements: Node.js 20+ and an Anthropic API key.

```bash
git clone https://github.com/lutiangafar-git/law-tutor-drill.git
cd law-tutor-drill
npm install
cp .env.example .env.local      # then paste your key after ANTHROPIC_API_KEY=
npm run dev                     # open http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally |
| `npm test` | Run the 48 automated tests (the Claude API is faked; no key needed) |
| `npm run lint` | Check code style |
| `npx tsc --noEmit` | Check types |
| `npm run build` | Production build (what Vercel runs) |

## Environment variables and secrets

| Variable | Where it lives | Used by |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.env.local` on your computer (git-ignored) and Vercel → Settings → Environment Variables | `app/api/tutor/route.ts` only, on the server |

There are no secrets in the code or the Git history. `.env*.local` is git-ignored, `.env.example` is an empty
template, and CI runs a **Gitleaks** scan over the full history on every push. The key is never sent to the browser.

## CI/CD
- **GitHub Actions** ([`.github/workflows/test.yml`](.github/workflows/test.yml)), on every push and pull request: lint → typecheck → 48 tests → production build, plus a Gitleaks secret scan.
- **Vercel** deploys `main` automatically to https://law-tutor-drill.vercel.app after each push.
- **Monitoring:** Vercel Web Analytics (page views, no cookies); one JSON log line per Claude call (feature, model, latency, outcome; never student text) in Vercel → Logs; health check at [`/api/health`](https://law-tutor-drill.vercel.app/api/health).

## Project documents
| Document | What's in it |
|---|---|
| [docs/01-idea-validation-report.md](docs/01-idea-validation-report.md) | All 7 validation steps with evidence, "why now" and target user |
| [docs/02-prd.md](docs/02-prd.md) | One-page PRD with acceptance criteria for each feature |
| [spec.md](spec.md) | Full spec: context, inputs/outputs, behavior rules, constraints, 36 acceptance criteria, revision log |
| [docs/03-architecture.md](docs/03-architecture.md) | Architecture diagram, data flow, design decisions, security |
| [CLAUDE.md](CLAUDE.md) · [agents.md](agents.md) · [.cursorrules](.cursorrules) | Rules for AI coding tools (Claude Code, other agents, Cursor) |
| [docs/04-reflection.md](docs/04-reflection.md) | What I learned, challenges, v2 improvements |
| [docs/05-demo-script.md](docs/05-demo-script.md) | Script for the 2-minute demo |

## Project structure
```
app/            pages (onboarding, home, drills, progress, settings) + API routes (tutor, topics, health)
components/     UI pieces (DemoBanner, FeatureCard, AnswerBox, ClassPauseBanner, GroupGuard)
lib/            access rules, year profiles, topic loader, prompts, on-device storage, monitoring
sources/        one Markdown file per topic: article text, key points, fact pattern, bar problem, model answer
tests/          Vitest tests mapped to the spec's acceptance criteria
docs/           validation, PRD, architecture, reflection, demo script
```

## Adding or reviewing a topic
Copy `sources/_TEMPLATE.md`, fill in every section, and set `yearLevels` (e.g. `[year-2, year-4, bar]`).
While it is unreviewed, add `status: demo`. A law-trained reviewer then fills `reviewedBy` and `lastReviewed`
and deletes `status: demo`. A file with neither is hidden. `npm test` checks that every topic file is complete.

## Known limitations (v1)
- Content is six demo topics in Civil Law; lawyer sign-off is pending.
- The 30-messages-per-hour limit is per device, not per server (to fix before a real pilot).
- The user's group is self-declared (honor system); school-managed settings come later.
- Progress doesn't sync across devices (no accounts, by design).

v2 ideas are tracked in [GitHub Issues](https://github.com/lutiangafar-git/law-tutor-drill/issues).

## How AI was used to build this
The spec, rules files and code were written with **Cursor** and **Claude Code**, following `CLAUDE.md`. All
code changes were reviewed, tested (`npm test`) and committed in small steps. Legal content is kept apart
from code, in `sources/`, for human review.
