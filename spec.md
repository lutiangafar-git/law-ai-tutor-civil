# Spec: Law AI Tutor, Socratic Practice Drills (v1)

> Worked example for Lab 1 (deck page 15) and Mini Project Phase 1 (deck page 60).
> Based on the Law AI Tutor research (problem statements, personas, VC critique).
> v1 serves all law students and all bar reviewees, but keeps the content narrow: **two subjects, text only.**

## ⭐ When each group may use the tutor

| User group | Inside the classroom | Outside the classroom | Purpose |
|---|---|---|---|
| **Year 1 and 2 students** | ❌ **Not allowed.** The tutor pauses during the student's class hours. | ✅ Allowed | Practice after class to prepare for **future** recitations and exams |
| **Year 3 and 4 students** | ✅ Allowed: **In-class Quick Check** to aid recitations | ✅ Allowed | Aid recitations in class; prepare for exams outside class |
| **Bar reviewees** (first-time takers and repeaters) | ✅ Anytime | ✅ Anytime | Review and answer practice at any time of day |

**Applies to everyone:** never during exams, quizzes, proctored mock bars or the bar exam itself, and never
to write graded work. School, professor and review-center rules take priority over this table.

## 1. Context & Goal
Philippine law faculty report weaker reasoning as students lean on AI. UP Law now keeps first-year core
subjects offline as much as possible, while upper-year students need faster, deeper learning. Each year,
more than 13,000 bar applicants prepare for an all-essay exam, and about 54% of 2025 examinees were repeaters
or refreshers. General chatbots serve none of these groups well: they hand out answers and can get Philippine
law wrong, including invented citations.

Law AI Tutor is one Socratic tutor that adjusts its rules to the user's stage:
- **Year 1–2 (persona: Miko):** build the basics after class through step-by-step questioning, so students
  can answer on their own when called in class or tested later.
- **Year 3–4 (persona: Bea):** check their reasoning quickly during class before or after reciting, and
  prepare for exams outside class.
- **Bar reviewees, first-time takers and repeaters (persona: Carla):** practice bar-style answers anytime,
  get feedback on how each answer is built, and track weak spots. Repeaters start with a diagnostic.

**Content for v1:** two subjects.
- **Obligations and Contracts:** Year 1–2 students, and bar reviewees (Civil Law).
- **One Year 3–4 subject chosen with the pilot school**, e.g. a Remedial Law course.

Y3–4 in-class use only helps if the subject is one students are currently taking, so pick it with the pilot school.

**Out of scope for v1:** lawyers, full timed mock bar exams, voice, logins, payments, school or coach dashboards.

## 2. Inputs & Outputs
**Inputs**
- `userGroup`: `year-1-2` | `year-3-4` | `bar-first-time` | `bar-repeater`. Chosen on first use and changeable in Settings.
- `classSchedule` (students only): class days and times, saved on the device. All times are Philippine time.
  **Pre-filled with the typical law school schedule**, which the student can edit or clear in Settings:
  - **Monday to Friday:** 6:00 PM to 9:00 PM
  - **Saturday and Sunday:** 8:00 AM to 6:00 PM
- `feature`: `recitation-drill` | `in-class-quick-check` | `problem-drill`. Only features allowed for the
  user's group and the current time are offered.
- `topicId`: from the topic list. Only reviewed topics tagged for the user's group appear.
- `studentAnswer`: text in English, Filipino or Taglish.
  - Quick check: up to 1,000 characters.
  - Recitation drill: up to 2,000 characters.
  - Problem drill: up to 4,000 characters.
- `drillState`: current step, previous answers and past scores, saved on the device.

**Outputs, for each turn**
- `verdict`: `correct` | `partly correct` | `not yet`
- `feedback`: 1–3 sentences on what was right or missing, citing the source.
- `nextQuestion`: the next Socratic question, or a hint if the student is stuck.

**Output, at the end of a drill**
- `rubric`: scores of 0–2 per step or element (see Section 3).
- `oneThingToFix`: one concrete improvement.
- `sources`: a list of `{ title, citation, link, reviewedBy, lastReviewed }`.
- Problem drills only, `weakSpots`: the answer elements that scored lowest across the last 10 drills.

**Data the tutor uses**
- `sources/` folder, one file per topic. Each file holds:
  - the reviewed source text, citation, link, reviewer and last-reviewed date
  - the year levels it applies to
  - quick-check key points
  - a recitation fact pattern
  - an exam or bar-style problem with a model answer

## 3. Behavior Rules
### 3.1 Usage rules by group (the table at the top, as behavior)
**Year 1–2: outside the classroom only**
- On first use, show: "Use this after class to prepare for your next recitations and exams. It isn't
  available during class, and it isn't for exams or graded work."
- If a class schedule is entered, **all** features pause during those hours: "It's class time. Come back
  after class to review." No AI call is made.
- The In-class Quick Check is never offered to this group.

**Year 3–4: in the classroom and outside it**
- On first use, show: "During class, use Quick Check to test your reasoning for recitation. Outside class,
  use drills to prepare for exams. Follow your professor's rules. Never use it during exams or quizzes."
- During entered class hours, the home screen leads with **In-class Quick Check**. Full drills stay available.
- Outside class hours, the home screen leads with Recitation and Problem drills.

**Bar reviewees: anytime**
- No time restrictions. Recitation drills and Problem drills are available 24/7.
- On first use, show: "Practice anytime. Not for use during proctored mock exams (unless your review center
  allows it) or the bar exam itself."
- **Repeaters** are offered a short diagnostic first (3 problem drills across the subject) to find their
  weak spots. First-time takers can choose to take it.

**Everyone**
- Decline requests to write case digests, papers, memoranda or other graded work, and remind the user to
  follow their school's or review center's AI policy.
- v1 relies on the user's self-declared group (honor system). School-managed settings come later.

### 3.2 Features
**Recitation drill (Year 1–4 and bar reviewees, outside class): 5–10 minutes**
Steps: 1. Facts or provision → 2. Issue → 3. Rule or ruling → 4. Reasoning → 5. Apply it to a short new fact pattern.
Each step scores 0 (missing or wrong), 1 (partly right) or 2 (complete and accurate).

**In-class Quick Check (Year 3–4 only): 1–3 minutes**
1. The student picks the topic being discussed and types their own answer first
   (e.g., the issue and ruling as they would recite it).
2. In one reply, the tutor says what's right, what's missing or wrong, and the source citation.
   It doesn't write a script to read aloud.
3. Optionally, one follow-up question the professor might ask. The check ends after at most 2 exchanges.

**Problem drill (Year 1–4 exam prep and bar reviewees): 10–20 minutes**
1. Show an exam or bar-style problem from the topic's source file.
2. The student writes a full answer.
3. Score four elements, each 0–2:
   - **Answer:** a direct conclusion
   - **Legal basis:** the correct provision or doctrine
   - **Application:** the facts tied to the law
   - **Conclusion**

   This is the ALAC structure used in Philippine bar review. Rubric confirmed by a bar coach.
4. Ask Socratic follow-ups on the lowest-scoring element only, then the student retries it and it's re-scored.
5. Show the model answer and source only after the retry.

### 3.3 Socratic first (all features)
- Every drill opens with a question or problem, never an explanation.
- The tutor never gives a full answer before the student has tried.
- If the student asks "just tell me", the tutor gives a hint, not the answer.
- After 2 unsuccessful attempts at the same step, the tutor reveals that step's answer with its citation and moves on.

### 3.4 Grounded and accurate
- Every legal statement in feedback must come from the topic's source file and show its citation.
- The tutor never invents case names, G.R. numbers, article numbers, dates or quotes.
- If the user asks about something outside the topic's sources, reply:
  "That's outside the reviewed materials for this drill. Check the official source or ask your professor or coach."
- Topics whose source file has no `reviewedBy` or `lastReviewed` are hidden.

### 3.5 Private, judgment-free, resumable
- Feedback stays encouraging and specific. Never compare a user with others.
- Scores and weak spots are visible only to the user on their own device.
- Progress is saved after every turn, and "Continue where you left off" restores the exact step.
- All results are labelled "Practice score". Never claim official bar grading or predict bar results.

### 3.6 Edge cases
- Empty answer → no AI call. Show "Type your answer first. A rough one is fine."
- Answer over the length limit → ask the user to shorten it.
- AI unavailable or slower than 30 seconds (10 seconds for Quick Check) → "The tutor is unavailable right
  now. Your answer is saved, so try again in a minute." The typed answer is never lost.
- Never show technical error messages.

## 4. Constraints
- **Tech stack:** Next.js + TypeScript + Tailwind CSS. AI: Anthropic Claude API. Hosting: Vercel.
- **Model and cost:**
  - Use a fast, lower-cost Claude model for Quick Checks and recitation drills.
  - Problem-drill scoring may use a stronger model if testing shows it's needed.
  - Keep usage at or under about ₱5 per 15-minute session.
- **Speed:** a Quick Check reply should arrive within about 5 seconds, so it's usable in class.
- **Time zone:** all class times are Philippine time (Asia/Manila), whatever time zone the server or device runs in.
- **Secrets:** the API key lives only in the `ANTHROPIC_API_KEY` environment variable. Never in code or on GitHub.
- **Usage limit:** 30 tutor messages per hour per device.
- **Devices:** usable on a 360-pixel-wide phone screen (Quick Checks, short drills) and on a laptop (long answers).
- **Legal content:** only reviewed files in `sources/` count. The app and AI coding tools must not edit them.
- **Privacy:** no names, emails or accounts in v1. Group, schedule, progress and scores are stored only in
  the user's browser. Answers are not stored on the server after the reply is sent.
- **Simplicity:** no database and no login in v1.

## 5. Acceptance Criteria
**All groups**
1. Given any topic, when a drill starts, then the first tutor message is a question or a problem, not an explanation.
2. Given step 1 of a drill, when the user types "just give me the answer", then the tutor gives a hint and
   doesn't reveal the answer.
3. Given two unsuccessful attempts at the same step, then the tutor reveals that step's answer with its
   citation and link and moves on.
4. Given the topic "Civil Code, Article 1156: definition of an obligation", when the user asks about a
   Supreme Court case not in the sources, then the tutor replies with the outside-materials message and no
   citation is invented.
5. Given a user closes the app mid-drill, when they reopen it, then "Continue where you left off" returns
   them to the same step with earlier answers intact.
6. Given an empty answer, when the user taps Send, then no AI call is made.
7. Given the AI service is down, when the user sends an answer, then the friendly message appears and the
   typed answer is still in the box.
8. Given a source file without `lastReviewed`, then that topic doesn't appear.
9. Given a user chooses their group for the first time, then that group's usage notice (Section 3.1) is
   shown before the first drill.

**Usage rules by group**

10. Given a Year 1–2 user with a class schedule of Monday 6:00–9:00 PM, when they open any feature on
    Monday at 7:00 PM, then the class-time pause message is shown and no AI call is made.
11. Given a Year 1–2 user at any time, then the In-class Quick Check is never shown.
12. Given a Year 3–4 user with a class schedule of Monday 6:00–9:00 PM, when they open the app on Monday
    at 7:00 PM, then In-class Quick Check is the first option on the home screen.
13. Given a Year 3–4 Quick Check, then the student must type their answer before any feedback appears.
    The feedback includes a citation, and the check ends within 2 exchanges.
14. Given a bar reviewee (first-time or repeater), when they open any drill at any hour on any day, then it
    is available with no class-time pause.
15. Given any group, when the user asks "write my case digest for class", then the tutor declines and
    mentions the school's AI policy.

**Problem drills**

16. Given a submitted answer, then the tutor scores Answer, Legal basis, Application and Conclusion (0–2
    each) before showing any model answer.
17. Given the lowest score is Legal basis, then the follow-up questions are about Legal basis only, and
    the user is asked to retry it.
18. Given 3 or more finished problem drills, then the weak-spots summary names the lowest-scoring element.
19. Given any score, then it is labelled "Practice score", and nothing mentions official bar grading or pass predictions.
20. Given a bar repeater on first use, then the diagnostic is offered before regular drills.

**Release**

21. Given a 360-pixel-wide screen, then all buttons and text are usable without sideways scrolling.
22. **Accuracy gate:** before release, a law-trained reviewer checks 10 recitation drills, 10 Quick Checks
    and 10 problem drills. There must be zero fabricated citations, and any material legal error blocks release.
23. All automated tests pass (`npm test`).

**Default class schedule (Philippine time)**

24. Given a new Year 1–2 or Year 3–4 user, when they open Settings for the first time, then the class schedule
    already shows Monday–Friday 6:00–9:00 PM and Saturday–Sunday 8:00 AM–6:00 PM, and they can edit or clear it.
25. Given a Year 1–2 user with the default schedule, then they are paused on Wednesday at 7:30 PM and on Saturday
    at 10:00 AM (Manila time), and not paused on Wednesday at 9:00 PM or on Saturday at 6:00 PM.
26. Given a Year 3–4 user with the default schedule, when they open the app on Sunday at 2:00 PM (Manila time),
    then In-class Quick Check is the first option on the home screen.
27. Given a bar reviewee, then no class schedule is shown or applied.
