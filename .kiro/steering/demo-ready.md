---
inclusion: manual
---

# Demo-ready checklist

Run with `/demo-ready` in chat before submitting. Work through each item, fix what fails, then report a short pass/fail list.

## 1. App is demo-proof
- [ ] `npm run build` passes, the latest `main` is deployed on Vercel, and the deployed URL works in an incognito window.
- [ ] The ONE demo flow (see `.kiro/steering/product.md`) works end-to-end on the deployed URL, 3 times in a row, on a phone.
- [ ] Demo fallback works: with `DEMO_MODE=1` (or a failed live call) every screen still shows real data from `lib/data/`, and says what's missing. Nothing on screen is invented.
- [ ] Feature flags in `lib/features.ts` match what you'll show: nothing in the demo path says "Coming soon".
- [ ] Sample inputs are ready (e.g. tick photos in `public/samples/`), and the demo town (Amherst) has a clear story in "Why this level".
- [ ] Loading states are visible and look intentional; no console errors; works at phone width.
- [ ] No placeholder text, lorem ipsum or broken images; favicon, page title and the PWA icon are set.
- [ ] The health disclaimer (`Disclaimer` in `components/states.tsx`) shows wherever the app talks about risk, species or scan results.

## 2. Repo is judge-friendly
- [ ] `README.md` has: one-liner, problem, screenshot or GIF, how it works (a diagram or 3 bullets), tech stack, how AI is used, run instructions, and the team.
- [ ] `.env.example` lists every variable, and there are no secrets in git history.
- [ ] `.kiro/` (steering, hooks, specs) is committed and up to date.

## 3. Pitch (3 minutes)
Draft `PITCH.md`:
1. **Hook (20 s):** one real person and their pain, with one number.
2. **Live demo (90 s):** the ONE flow, narrated in user language, ending on the "wow" moment.
3. **How it works (30 s):** the pipeline in one sentence, plus what makes it technically interesting.
4. **Impact & next steps (30 s):** who else benefits, and what you would build next.
5. **Close (10 s):** name and one-liner again.

Also list 5 likely judge questions with short answers.
