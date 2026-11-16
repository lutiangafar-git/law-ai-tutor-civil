# Reflection: Building Law AI Tutor

**Gafar Lutian · Week 4 Graded Mini Project 4.2 · 16 November 2026**

## What I built
Law AI Tutor is a live web app that helps Philippine law students and bar reviewees practise by answering first. It
scores bar-style answers on Answer, Legal basis, Application and Conclusion (ALAC), coaches the weakest part, and uses
only reviewed source files. It now runs as eight subject apps aligned to the 2027 Bar syllabus.
Live: https://law-ai-tutor-civil.vercel.app

## Key learnings
1. **Validation changed what I built.** The skeptical-VC step showed that three markets meant "three companies", so v1
   focused on one subject, text only, with no accounts.
2. **The spec is the product.** Rules written as tables and Given/When/Then criteria were easy for AI coding tools to
   build and easy to test.
3. **Grounding is a design choice.** Sending the model only one reviewed topic file lets it say "outside the reviewed
   materials" instead of inventing a case.
4. **Let the AI judge, but let code count.** The AI labels each ALAC part; a fixed 5-point rubric in code gives the score.
5. **A human stays in the loop.** People must review the question databank (at least 400 questions per topic) and
   catch where the AI over- or under-emphasises a point, or gives wrong, inaccurate or incomplete answers. For example,
   the AI used the ALAC method even for objective and multiple-choice questions, which forced students to invent facts
   to finish the exercise. Regular reviews of the databank and regular audit tests are needed until the system stabilises.

## Challenges
- No lawyer-reviewed content at launch, so demo topics carry a "pending lawyer review" banner.
- Learning Git, GitHub Actions, Vercel and environment variables as a non-developer.
- Copyright: original model answers only; third-party reviewers are not copied into the public repo.
- Making the apps feel like a real tutor: the tone is still mechanical and standardised.

## What testers told me
Three people tried the app in November 2026.
- **Liked:** fast, easy to navigate, interesting and fun, and well aligned to the Philippine law syllabus and bar review.
- **To improve:** some features load slowly, occasional glitches, smoother navigation between modules, and a help chat
  for "how do I use this?" questions.
- **My response:** speed and stability first, because a slow or glitchy drill breaks a student's focus; then a help
  guide for finding my way around the app.

## What I would improve in v2
Lawyer sign-off with zero fabricated citations before any pilot; faster loading and fewer glitches; a built-in help
guide for navigation (app help only, not legal answers); a server-side usage limit; and a paid-pilot experiment with
30–50 bar reviewees.

## If I did it again
I would load signed-off content and set up the README and CI on day one, and get testers in the first week, not the
last. I would also spend much more time on the specs and the PRD, so there is less iteration, although iterating was a
good way to test and learn.
