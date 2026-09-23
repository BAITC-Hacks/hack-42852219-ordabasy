<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

<!-- check 1
  -->


This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend Architecture

The project uses Next.js, TypeScript, and a lightweight Feature-Sliced Design.

`src/app` is the Next.js App Router: routes, layout, providers, global styles. It composes screens. It does not hold page-sized JSX, data fetching, effects, or business state.

`src/views` is the FSD layer of ready-made screens. Do not create `pages/` or `src/pages`. Next.js reserves that path for the Pages Router and type-checks every file there as a route module, which breaks `next build`.

Layers:

- app
- views
- widgets
- features
- entities
- shared

## Architecture

Follow the FSD dependency direction:

app → views → widgets → features → entities → shared

Lower layers must not import higher layers.

Grow the structure with the product. Do not create empty slices or nested folders for a single type.

## TypeScript

- Do not use `any`.
- Prefer explicit domain types.
- Do not suppress TypeScript errors.
- Do not use `@ts-ignore` unless explicitly requested.

## React

- Prefer Server Components.
- Add `"use client"` only when client-side interactivity is required, as low in the tree as possible.
- Do not store derived values in state.
- Avoid unnecessary `useEffect`.
- Keep components focused on one responsibility.

## FSD

- Business actions belong in `features` (`upload-document`, not `button`).
- Business entities belong in `entities`.
- Reusable business-independent UI belongs in `shared/ui`.
- Large page sections belong in `widgets`.
- Routes and application configuration belong in `app`.
- Page components compose other parts of the app.

Import a slice only through its public `index.ts`:

```ts
import { UploadDocument } from "@/features/upload-document";
```

Do not import internal `ui`, `model`, or `api` paths from outside the slice.

Keep HTTP details in `shared/api` and in the slice `api` module. UI calls a typed function, not `fetch` with a URL.

Separate state:

- Server data: TanStack Query, only if it is actually needed.
- Shared UI state: Zustand, only for real cross-screen client state.
- Local UI state: `useState`.

Do not put server data, modals, and domain objects into one store.

Do not create abstractions unless they solve an actual problem.

## Code Quality

- Use descriptive names.
- Avoid duplicated logic.
- Keep API requests outside UI components.
- Handle loading and error states.
- Do not leave `console.log` or dead code.
- Keep secrets out of client code.

Before finishing a task:

1. Run TypeScript checks (`npm run typecheck`).
2. Run ESLint (`npm run lint`).
3. Fix errors caused by your changes.
4. Run `npm run build` before handoff. A clean FSD tree does not matter if the production build fails.
