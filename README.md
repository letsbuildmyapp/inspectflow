# InspectFlow

Property inspection + maintenance ops portal. **Brutalist** showcase build for letsbuildmyapp.com.

Niche: residential property management (multi-family rentals + light commercial).

---

## Visual decisions (locked)

- Archetype: **Brutalist / utilitarian** — `rounded-none`, `border-3`, hard `shadow-brut` offsets, no gradients.
- Type: **JetBrains Mono** for display + UI chrome, **IBM Plex Sans** for body.
- Palette: OKLCH stark — black ink, near-white paper, **safety orange** (`oklch(0.74 0.19 60)`) as the only accent.
- Both light + dark mode, both feel utilitarian (grid background pattern in both).
- Hero: oversized mono headline with hazard-orange highlight. No imagery.

## Stack

React 18 + TypeScript + Vite, Tailwind, React Router v6, TanStack Query, react-hook-form + zod, Framer Motion, lucide-react, sonner. Firebase (Auth, Firestore, Functions TS, Storage, Hosting). an LLM SDK in a Cloud Function with prompt caching enabled. Browser-side print-to-PDF for reports (Cloud Function stub left for production `@react-pdf/renderer` swap-in).

## Run locally (no Firebase needed)

```bash
cd "~/Documents/the assistant Code/inspectflow"
npm install
npm run dev
```

The app ships with a **localStorage-backed mock backend** seeded with 4 properties, 9 units, 5 inspections at every status, and 3 tickets — so the entire app is exercisable end-to-end without Firebase. Sign in at `/login` with any of these (any password works):

- `admin@inspectflow.demo` — admin
- `marco@inspectflow.demo` — inspector
- `priya@inspectflow.demo` — inspector
- `jordan@inspectflow.demo` — property manager

Switch active role on the fly under Settings.

## Run against Firebase emulator suite

```bash
# 1. Install function deps + build
cd functions && npm install && npm run build && cd ..

# 2. Start emulators
firebase emulators:start

# 3. In another terminal, run the client pointed at emulators
VITE_USE_MOCK=false VITE_USE_EMULATOR=true npm run dev
```

Emulator UI: http://127.0.0.1:4000

## an LLM API key

For live AI condition summaries:

```bash
cp functions/.env.example functions/.env
# edit functions/.env and set LLM_API_KEY=sk-...
```

If `LLM_API_KEY` is **not** set, the function returns a deterministic fixture summary derived from the inspection data, so the demo never breaks. The same fallback exists in the client when neither emulator nor production functions URL is reachable.

The function uses `the standard model` with `cache_control: ephemeral` on the system prompt — second+ inspections in a session hit the cache.

## Handoff checklist (Alex → production)

1. **Create Firebase project** (`inspectflow-demo` is the default ID; rename in `.firebaserc` if different).
2. `firebase login`, `firebase use --add`, pick your project.
3. **Hosting sites**: `firebase hosting:sites:create inspectflow-staging` and `inspectflow` (or your real prod name), then update `.firebaserc` targets to match.
4. Copy `.env.example` → `.env.local`, paste real Firebase config (these are public identifiers — fine to ship).
5. Set LLM API key: `firebase functions:secrets:set LLM_API_KEY` (or use `functions/.env` for emulator only).
6. **Enable Auth providers**: Email/password + Google in Firebase console.
7. Build + deploy:
   ```bash
   npm run build
   firebase deploy --only functions,firestore:rules,storage
   firebase deploy --only hosting:staging   # confirm
   firebase deploy --only hosting:prod
   ```

## Architecture notes

- `src/lib/api.ts` is the unified data API. Today: localStorage mock. Swap-in: Firestore (the surface area is identical).
- `src/lib/auth.tsx` is the unified auth surface. Same swap-in plan.
- Mobile-first inspection runner at `/app/inspections/:id/run` — designed to be used one-handed, in a hallway, by an inspector with gloves on. Big tap targets, big status colors, dot-grid section nav at the bottom.
- Firestore security rules are role-aware (`admin`, `manager`, `inspector`) and gate property/unit writes to managers, inspection updates to assigned inspector or manager, ticket updates to assignee/creator/manager.

## Things to revisit (post-functional review)

- Is "safety orange" the right accent, or should it be electric yellow / hazard red?
- Inspection templates are baked in. Probably want a template editor for managers.
- PDF currently uses browser print. Production should swap to `@react-pdf/renderer` server-side and store at `reports/{inspectionId}.pdf`.
- Photo storage currently uses dataURL in localStorage (demo). Production: `firebase/storage` with the rules already in `storage.rules`.
- No PostHog / Sentry wired yet — keys live in env, easy to add post-handoff.

---

Built by [letsbuildmyapp.com](https://letsbuildmyapp.com).
