---
inclusion: manual
---

# Demo-ready checklist

Run with `/demo-ready` in chat before submitting. Work through each item, fix what fails, then report a short pass/fail list.

## 1. App is demo-proof
- [ ] `npm run build` passes, the latest `main` is deployed on Vercel, and the deployed URL works in an incognito window.
- [ ] The ONE demo flow (see `.kiro/steering/product.md`) works end-to-end on the deployed URL, 3 times in a row.
- [ ] Demo fallback works: `?demo=1` or a failed upstream/AI call shows a cached good result instead of an error.
- [ ] Sample inputs are ready in `public/samples/`, with a "Try an example" button on the page.
- [ ] Loading states are visible and look intentional; no console errors; works at phone width and in dark mode.
- [ ] No placeholder text, lorem ipsum or broken images; favicon and page title are set.
- [ ] A health, legal or civic disclaimer is shown where relevant.

## 2. Repo is judge-friendly
- [ ] `README.md` has: one-liner, problem, screenshot or GIF, how it works (a diagram or 3 bullets), tech stack, how AI is used, run instructions, and the team.
- [ ] `.env.example` is present, and there are no secrets in git history.
- [ ] `.kiro/` (specs, steering, hooks) is committed and up to date: spec tasks checked off match what's actually built.

## 3. Pitch (3 minutes)
Draft `PITCH.md`:
1. **Hook (20 s):** one real person and their pain, with one number.
2. **Live demo (90 s):** the ONE flow, narrated in user language, ending on the "wow" moment.
3. **How it works (30 s):** the pipeline in one sentence, plus what makes it technically interesting.
4. **Impact & next steps (30 s):** who else benefits, and what you would build next.
5. **Close (10 s):** name and one-liner again.

Also list 5 likely judge questions with short answers.
