# agents.md: Law AI Tutor, Socratic Practice Drills

> Worked example for the Mini Project (deck page 60).
> This is the "onboarding note" every AI coding tool reads before touching the project.
> Save a copy named CLAUDE.md so Claude Code reads it too.

## Project Overview
One Socratic law tutor whose rules change by user group:

| Group | Inside the classroom | Outside the classroom |
|---|---|---|
| Year 1–2 students | Not allowed (paused during class hours) | Drills to prepare for future recitations and exams |
| Year 3–4 students | In-class Quick Check to aid recitations | Drills to prepare for exams |
| Bar reviewees (first-time and repeaters) | Anytime | Anytime |

There are three features:
- **Recitation drill:** facts → issue → rule → reasoning → application.
- **In-class Quick Check:** Year 3–4 only, 1–3 minutes, the student answers first.
- **Problem drill:** scored on Answer, Legal basis, Application and Conclusion, with coaching on the weakest
  element, a retry, and weak-spot tracking.

The tutor asks before it tells, uses only reviewed Philippine sources, and lets users resume anytime.
Full requirements are in `spec.md`. Follow it. If the code and the spec disagree, the spec wins.

## Tech Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS for all styling
- Anthropic Claude API
- Vitest for tests
- Deployed on Vercel

## Commands
- Start on my computer: `npm run dev` (then open http://localhost:3000)
- Run tests: `npm test`
- Check code style: `npm run lint`

## Architecture (where things live)
- `/app/page.tsx`: home screen. Shows only the features allowed for the user's group and the current time.
- `/app/onboarding/page.tsx`: group choice and the group's usage notice
- `/app/recitation/[topicId]/page.tsx`: recitation drill
- `/app/quick-check/[topicId]/page.tsx`: In-class Quick Check (Year 3–4 only)
- `/app/problem/[topicId]/page.tsx`: problem drill (exam prep and bar)
- `/app/progress/page.tsx`: practice scores and weak spots
- `/app/settings/page.tsx`: group and class schedule
- `/app/api/tutor/route.ts`: server code that calls Claude (the only place the API key is used)
- `/lib/access.ts`: **the single place for usage rules.** Given the group and the time, it decides which
  features are allowed.
- `/lib/prompts/`: tutor instructions for each feature
- `/lib/sources.ts`: loads `sources/*.md`, hides unreviewed topics, filters by year level
- `/lib/storage.ts`: saves group, schedule, progress and scores in the browser only
- `/sources/`: reviewed legal source files, one per topic (see `_TEMPLATE.md`)
- `/tests/`: automated tests, one group per acceptance criterion in spec.md

## Conventions
- Make small, focused changes. Explain what you changed and why, in plain English. I'm not a developer.
- Every acceptance criterion in spec.md gets at least one test. `/lib/access.ts` needs a test for every
  group at class time and outside class time.
- Check layouts at 360 pixels wide (phone) and on a laptop.
- If something in the spec is unclear, ask me a question instead of guessing.

## Critical Constraints
- Usage rules live only in `/lib/access.ts`. Never weaken them:
  - Year 1–2 are always paused during class hours.
  - Quick Check is never shown to Year 1–2.
- NEVER edit files in `/sources/`. Only a law-trained reviewer changes legal content.
- NEVER write legal content (case names, G.R. numbers, articles, quotes) into code or prompts.
  All legal content must come from `/sources/`.
- The tutor must never invent citations. If information isn't in the sources, it says so.
- Quick Check must require the student's answer first and must not produce a script to read aloud.
- Label all scores "Practice score". Never describe them as official bar grading or pass predictions.
- NEVER put the API key in code. Read it from `process.env.ANTHROPIC_API_KEY`.
- NEVER commit `.env.local`. It must stay listed in `.gitignore`.
- No login, database, voice, payments or dashboards in v1. Those are out of scope.
- Do not change `spec.md` without asking me.
