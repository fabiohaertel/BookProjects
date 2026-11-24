# Repository Instructions

## Project

Designing a system that supports millions of users is challenging, and it is a journey that
requires continuous refinement and endless improvement. In this project, we build a system
that supports a single user and gradually scale it up to serve millions of users

- Requirements and business rules: @docs/REQUIREMENTS.md
- Roadmap and architecture decisions: @docs/PLAN.md

## Commands

- 'install': 'npm install'
- 'start': 'npm start' (`http://localhost:3000`, override with the `PORT` env var)
- 'dev': 'npm run dev' (restarts on file changes via `node --watch`)
- 'test': 'npm test' (Vitest, single run)
- 'test:watch': 'npm run test:watch'

## Coding Conventions

- Use JavaScript for new application code (no TypeScript).
- ES modules everywhere (`"type": "module"`, `import`/`export`, relative imports with `.js`).
- Frontend is pure HTML/CSS/JS with no framework and no build step. Browser modules live in
  `src/public/js` and are loaded with `<script type="module">`.
- Keep logic pure and DOM-free where possible (e.g. `geometry.js`, `simulation.js`), so it can be
  unit tested in Node. DOM and canvas code goes in separate modules (`diagram.js`, `main.js`).
- Colors are CSS variables on `:root` with a dark-mode override. The canvas reads them via
  `getComputedStyle` instead of hard-coding colors.
- Insert user-facing text with `textContent`, not `innerHTML`.
- Use English in the UI, code and docs.

## Stack

- Node.js (>= 20)
- JavaScript (ES modules)
- Express 4 (static files + API)
- HTML5, CSS, HTML5 Canvas
- Vitest + supertest (tests)

## Repository Structure

- 'docs': documentation, requirements and plan
- 'src/server': Express backend
  - 'app.js': `createApp()`, builds the app without listening (used by tests)
  - 'index.js': entrypoint that starts the server
  - 'db/': data tier (`database.js`, in-memory). The web tier reads data only through it
  - 'routes/': route modules (`dns.js`, `api.js` for the web tier, `db.js` for the database server)
- 'src/public': static frontend served by Express
  - 'index.html', 'styles.css'
  - 'js/': browser ES modules
- 'tests': Vitest test files (`*.test.js`)

## Adding a new Child Container (CCn)

1. Add its requirements to `docs/REQUIREMENTS.md` and mark progress in `docs/PLAN.md`.
2. Add a `<section class="child-container" id="ccN">` to `index.html`, below the previous one.
3. Define its steps in a pure module (same shape as `CC1_STEPS`) and call `setupChildContainer()`
   in `main.js` with the steps and connections. Give its `.diagram` a `diagram-ccN` class with
   its own `grid-template-areas`.
4. Add any backend routes under `src/server/routes` and mount them in `app.js`.
5. Add tests for the new routes and logic.

## Testing

- Add or update tests when application code changes.
- Route tests use `supertest` against `createApp()` (no real port).
- Frontend tests cover only the pure modules. Don't import DOM-dependent modules in tests.
- Run `npm test` before you finish a task, and all tests must pass.
- On Windows, run the tests from a path with an uppercase drive letter (`C:\...`). With a lowercase
  `c:\...` working directory, Vitest loads itself twice and every file fails with
  `Cannot read properties of undefined (reading 'config')`.
