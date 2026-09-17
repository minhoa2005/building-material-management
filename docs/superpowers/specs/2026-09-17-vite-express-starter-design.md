# Vite + Express Starter Design

## Goal

Create a small full-stack starter in `client/` and `be/`. The frontend uses Vite with vanilla JavaScript, Tailwind CSS, Axios, Day.js, and Lucide. The backend uses Express, dotenv, cookie-parser, and Mongoose. Both development servers run from the repository root.

## Structure

Use npm workspaces with a separate package in each application directory.

```text
src/
  package.json
  package-lock.json
  .gitignore
  client/
    package.json
    index.html
    vite.config.js
    public/favicon.svg
    src/
      main.js
      style.css
      lib/api.js
  be/
    package.json
    .env.example
    src/
      index.js
      config/database.js
      routes/health.js
```

The starter page stays small and includes a button that checks `GET /api/health`.

## Dependencies

### Client

- Runtime: `axios`, `dayjs`, `lucide`
- Development: `vite`, `tailwindcss`, `@tailwindcss/vite`

Axios uses `/api` as its base URL and `withCredentials: true`. Day.js and Lucide are installed for future frontend code.

### Backend

- Runtime: `express`, `dotenv`, `cookie-parser`, `mongoose`
- Development: `nodemon`

The root package uses `concurrently` to run both applications together.

## Runtime and data flow

Vite listens on `5173` and proxies `/api` to Express on `3000`. Express loads environment variables with dotenv, parses JSON and cookies, mounts the health route, and listens on `PORT` (default `3000`).

Mongoose connects only when `MONGODB_URI` is set. Without it, the API starts and logs that database connection was skipped. If a URI is set but the connection fails, startup logs the error and exits unsuccessfully. `be/.env.example` documents `PORT` and a local MongoDB URI; real credentials belong in the ignored `be/.env` file.

## Error handling

The health route returns `{ "status": "ok" }`. Express returns JSON for unknown routes and request errors. Startup errors are logged clearly. The starter does not add authentication, sessions, cookie signing, business models, or deployment configuration.

## Commands

- `npm install` installs dependencies for all workspaces.
- `npm run dev` starts Vite and Express together.
- `npm run dev:client` and `npm run dev:server` start one app at a time.
- `npm run build` creates the production Vite build.

The client is vanilla JavaScript; no TypeScript or React dependency is included.

## Verification

1. Install dependencies successfully from the root workspace.
2. Run the production frontend build successfully.
3. Start the backend without `MONGODB_URI` and confirm `/api/health` responds.
4. Start both servers with `npm run dev`, confirm Vite proxies `/api/health`, and exercise the page health-check button.

## Scope notes

Day.js and Lucide are installed but are not used by a domain feature yet. Zod is not included. The setup adds no authentication, database schema, or business logic.
