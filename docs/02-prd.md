# PRD: Law AI Tutor v1 (Civil Law Socratic Practice)

**Owner:** Gafar Lutian · **Status:** v1 live (demo content) · **Updated:** 11 Nov 2026  
**Live:** https://law-tutor-drill.vercel.app · **Detailed spec:** [`spec.md`](../spec.md)

## 1. Problem statement
Law students lean on AI shortcuts and faculty report weaker reasoning (UP Law banned AI in first-year core subjects, Aug 2026). Bar reviewees, about 54% repeaters or refreshers, can't tell *why* their essay answers fail (2025 pass rate 48.98%). Chatbots hand out answers and can invent PH citations. Learners need practice that makes them **answer first**, pinpoints the weak part of an answer, and uses only **reviewed Philippine sources**.

## 2. Target users
| User | Need | Usage rule |
|---|---|---|
| **Year 1–2 students** (persona Miko) | Build fundamentals for recitations and exams. Y1: Persons & Family, Obligations · Y2: Sales | After class only (paused during class hours) |
| **Year 3–4 students** (persona Bea) | Check reasoning fast; exam prep. Y3: Succession · Y4: all Civil Law | In-class Quick Check and drills |
| **Bar reviewees, first-time and repeaters** (persona Carla, the beachhead) | Find and fix weak answer elements. All Civil Law | Anytime; repeaters start with a diagnostic |

## 3. Core features (MVP) and acceptance criteria
| # | Feature | Acceptance criterion (Given / When / Then) | Test |
|---|---|---|---|
| F1 | **Year-based access**: the user picks Year 1–4 or bar group; sees only allowed features and that year's topics | Given a Year 1–2 user with class Mon 6–9 PM, when they open the app Mon 7 PM (Manila), then every feature is paused and no AI call is made. Given a Year 2 user, then only Sales topics are listed. | `access.test.ts`, `year-and-demo.test.ts` |
| F2 | **Recitation drill**: 5 Socratic steps (facts → issue → rule → reasoning → application), each scored 0–2 | Given a drill starts, then the first tutor message is a question, not an explanation. Given "just give me the answer", then the tutor gives a hint, not the answer. | `tutor-guards.test.ts`, manual |
| F3 | **In-class Quick Check (Year 3–4 only)**: the student types their recitation first; one-reply feedback with a citation | Given a Year 3–4 user with the default schedule on Sunday 2 PM, then Quick Check is the first option; feedback ends within 2 exchanges. Given Year 1–2, then Quick Check is never shown. | `access.test.ts`, `default-schedule.test.ts` |
| F4 | **Problem drill with ALAC scoring**: a past bar question; scores Answer, Legal basis, Application, Conclusion (0–2 each); coaches the lowest; retry; model answer only after the retry | Given a submitted answer, then all 4 ALAC scores show before any model answer. Given the lowest score is Legal basis, then follow-ups target Legal basis only. Every score is labelled "Practice score". | Manual + live check (11 Nov: scored 1/8, coached Application) |
| F5 | **Grounded in reviewed sources**: the AI sees only the topic's source file; topics need lawyer sign-off or carry a visible demo banner | Given a question about a case not in the sources, then the tutor replies with the outside-materials message and invents no citation. Given a file with neither sign-off nor `status: demo`, then the topic is hidden. | `sources.test.ts`, `source-files.test.ts`, live check |
| F6 | **Progress and resume on the device**: weak spots across the last 10 problem drills; "Continue where you left off" | Given 3+ finished problem drills, then the weak-spots summary names the lowest element. Given the app is closed mid-drill, then it reopens at the same step. | `storage.test.ts` |

## 4. Out of scope (v1)
Accounts and logins, a database, payments, voice, lawyers and paralegals, subjects other than Civil Law, full timed mock bars, school or coach dashboards, writing case digests or any graded work (the tutor declines), and any prediction of bar results.

## 5. Success metrics
| Metric | Target | How measured |
|---|---|---|
| **Accuracy** | 0 fabricated citations; 0 material legal errors in 30 reviewed sessions (10 per feature) | Lawyer accuracy gate before pilot |
| **Engagement** | ≥40% of trial users complete 12+ drills in 3 weeks | Vercel Analytics plus pilot log |
| **Willingness to pay** | ≥20% of qualified trial users buy a ₱199–499 30-day pass | Experiment 1 |
| **Learning** | Unaided mock or recitation scores improve against baseline | Coach- or professor-scored before and after |
| **Reliability** | Tutor reply in under 10 s (Quick Check under 5 s); ≥99% non-error responses | `tutor_call` logs in Vercel |

## 6. Open questions
1. Who signs off the six demo topics, and by when? (They stay labelled "demo" until then; see Issue #1.)
2. Will a pilot school allow the Year 3–4 in-class Quick Check, and which professor will champion it?
3. Which review center would co-run Experiment 1 (paid pass, ₱199–499), and on what revenue share?
