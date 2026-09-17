# Vite + Express Starter Implementation Plan

> **For agentic workers:** Use this plan to verify the completed starter. Steps use checkbox (`- [x]`) syntax to record completed work.

**Goal:** Provide a runnable Vite vanilla JavaScript frontend and an Express + Mongoose backend managed through npm workspaces.

**Architecture:** The root package manages `client` and `be` workspaces and starts them together with `concurrently`. Vite proxies `/api` to Express; MongoDB remains optional unless `MONGODB_URI` is set.

**Tech Stack:** npm workspaces, Vite, vanilla JavaScript, Tailwind CSS, Axios, Day.js, Lucide, Express, dotenv, cookie-parser, Mongoose, Nodemon, concurrently.

**Spec:** `docs/superpowers/specs/2026-09-17-vite-express-starter-design.md`

## Global Constraints

- Use vanilla JavaScript in `client/`; include no TypeScript or React dependency.
- Keep the backend in JavaScript ESM.
- Keep `client/` and `be/` as separate npm workspaces.
- Include Axios, Day.js, and Lucide in the client; exclude Zod.
- Connect Mongoose only when `MONGODB_URI` is set.
- Use Vite port `5173` and Express default port `3000`.
- Do not add authentication, sessions, cookie signing, business models, or deployment configuration.
- Do not create commits.

---

## Completed Tasks

### Task 1: Recreate the Vite Client as Vanilla JavaScript

**Files:** `client/package.json`, `client/index.html`, `client/vite.config.js`, `client/public/favicon.svg`, `client/src/main.js`, `client/src/style.css`, `client/src/lib/api.js`.

- [x] Replace the previous client directory with a fresh Vite vanilla JavaScript structure.
- [x] Configure Tailwind CSS through `@tailwindcss/vite` and proxy `/api` to `http://localhost:3000`.
- [x] Keep Axios configured with `baseURL: '/api'` and `withCredentials: true`.
- [x] Keep Day.js and Lucide installed as frontend runtime dependencies.
- [x] Remove TypeScript-specific files and the TypeScript dependency.
- [x] Keep a minimal page with a button that checks `/api/health` and shows the response.

### Task 2: Synchronize Workspace Dependencies

**Files:** `client/package.json`, `package-lock.json`.

- [x] Keep Vite, Tailwind CSS, and the Tailwind Vite plugin in client development dependencies.
- [x] Run `npm install` to update the root lockfile and remove stale client dependencies.
- [x] Confirm `npm ls --workspace=client --depth=0` lists Vite, Tailwind CSS, Axios, Day.js, and Lucide with no TypeScript dependency.

### Task 3: Verify the Client and API Integration

**Files:** `AGENTS.md`, this plan, `docs/superpowers/specs/2026-09-17-vite-express-starter-design.md`.

- [x] Run `npm run build` successfully.
- [x] Start both servers with `npm run dev` and confirm `/` loads over HTTP.
- [x] Confirm `/api/health` returns `{ "status": "ok" }` through the Vite proxy.
- [x] Click the frontend health-check button in the browser and confirm it displays `API phản hồi: ok` with no console errors.
- [x] Update workspace documentation to describe vanilla JavaScript and remove obsolete TypeScript instructions.

## Verification Record

- `npm install`: completed; audit reported zero vulnerabilities.
- `npm run build`: passed after the vanilla JavaScript recreation.
- Browser smoke test: page loaded, the health-check button received an OK response, and the browser reported no console errors.
- No Git repository is present in the workspace; no commit was created.
