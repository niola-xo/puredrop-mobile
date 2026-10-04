# AGENTS.md: PureDrop Mobile project rules

## Source of truth
- Requirements are in `docs/PRD-lesson3.md`. Read the whole file before any task.
- If this file and the PRD disagree, the PRD decides WHAT to build and this file decides HOW to work.
- This repo is the MOBILE repo. Only do phases tagged [MOBILE]. The website lives in a different repo.

## How to work
- Work one phase at a time, in the order of PRD section 8. Stop at the end of each phase and wait for me to say "continue".
- Before saying a phase is finished, verify it yourself: run the type check, lint, and the web export build, start the app, and go through that phase's test steps.
- Report every acceptance criterion as PASS, FAIL or MANUAL. PASS needs evidence (what you ran, what you saw). Anything that needs my physical phone or a dashboard step is MANUAL with exact steps for me. Never mark MANUAL items as PASS.
- Never skip, shrink or quietly change a requirement. If blocked or unsure, say so and ask.
- Do not use the words "done", "complete" or "working" without evidence.
- Keep `PROGRESS.md` at the project root: one line per phase with its status and what was verified.

## Stack and commands
- Expo (React Native), TypeScript, Expo Router, `@supabase/supabase-js`, deployed to Vercel as a web export, Android `.apk` built with EAS.
- Check the current Expo docs before using any API. Do not rely on memory for Expo, Supabase auth for React Native, or EAS setup.
- Commands: `npm install`, `npx expo start`, `npx expo export --platform web`, `npx tsc --noEmit`, `npm run lint`.

## Conventions
- The mobile app uses ONLY public values: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_WEB_URL`. Never add a service role key or any other secret to this repo.
- `EXPO_PUBLIC_` values are baked in at build time. After changing them, remind me to rebuild and redeploy.
- Session storage: AsyncStorage on native, the default browser storage on web. Turn off URL session detection on native.
- Keep Supabase code in one place (`lib/supabase.ts`). Keep cart logic in one hook or context so the Products and Cart tabs stay in sync.
- Money is shown like `₦2,400`. Keep the UI simple, clean and consistent with the website (blue and white).
- No new dependencies without telling me why.

## Secrets and safety
- Never invent keys. When you need a value, list the exact variable name and stop.
- Never commit `.env*` files. Keep `.env.example` up to date (names only).
- Do not run destructive commands (deleting files outside the project, force pushes) without asking.
- Do not change Vercel, Supabase, Google or Expo dashboard settings yourself. Give me the exact steps and I will do them.

## Known pitfalls
- Google login must be tested on the deployed Vercel link, in Expo Go, and in the `.apk`. Each uses a different redirect URL, and each must be allowed in Supabase Auth URL Configuration. List the exact URLs for me.
- The Vercel link must open in an incognito window without a Vercel login (Deployment Protection). Remind me to check.
- Every route must work on page refresh in the web build (single page app rewrite).
- The mobile app and the website must resolve to the SAME Supabase user. Check there is one user, not two.
- Realtime only works if the table is in the `supabase_realtime` publication and row level security allows the user to select their rows.

## Communication
- Start each phase with a plan in at most 5 bullets.
- End each phase with the PASS, FAIL and MANUAL list and a short list of the steps I must do.
- Keep messages short and plain. Do not use em dashes.
