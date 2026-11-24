# REQUIREMENTS.md

## 1. Architecture

The project uses the following technologies:

- Pure HTML for the frontend (no frameworks, no build step)
- JavaScript (ES modules) for application development, both in the browser and on the server
- HTML5 Canvas for drawing (arrows and animated packets)
- CSS for styling
- Node.js + Express for the backend, which:
  - serves the static frontend (`src/public`)
  - exposes a minimal API that the simulations call, so the diagrams show real server responses
- Vitest + supertest for automated tests

## 2. Functional Requirements

### 2.1 Child Container 1 - CC1 (Single server setup)

CC1 shows the request flow of a single-server setup, as described in Chapter 1 of
*System Design Interview* (Alex Xu).

#### 2.1.1 Request flow

The simulation has 4 steps:

| Step | From → To | Message | Data source |
| --- | --- | --- | --- |
| 1 | User Browser → DNS Server | `www.mysite.com ?` | — |
| 2 | DNS Server → User Browser | `15.125.23.214` | `GET /dns/resolve?host=www.mysite.com` |
| 3 | User Browser → Web Server | `GET /users/12` | — |
| 4 | Web Server → User Browser | `200 OK · JSON` | `GET /api/users/12` |

#### 2.1.2 Controls

- **Simulate request**: resets the diagram and plays all 4 steps in sequence.
- **Next step**: plays only the next step. It is disabled after the last step.
- **Reset**: returns to the initial state (no step played).
- All buttons are disabled while an animation is running.

#### 2.1.3 Behavior

- Each step animates a labeled "packet" along the arrow that connects the two containers.
- The arrow being used by the current step is highlighted.
- A step list next to the diagram shows every step; the current step is highlighted and
  previous steps are marked as done.
- Steps 2 and 4 call the real backend. The packet label comes from the response
  (e.g. the resolved IP), and the raw JSON response is shown in a response panel.
- If a request fails, the packet shows an error label (`<status> error` or `network error`)
  and the response panel shows the error.

#### 2.1.4 Backend API

| Method | Route | Response |
| --- | --- | --- |
| GET | `/api/health` | `200 { "status": "ok" }` |
| GET | `/dns/resolve?host=<host>` | `200 { host, ip }`; `400` if `host` is missing; `404` if unknown |
| GET | `/api/users/:id` | `200` user JSON; `404` if unknown |
| any | unknown route | `404 { "error": "Not found" }` |

- The DNS lookup is case-insensitive. Known hosts: `www.mysite.com`, `api.mysite.com`
  (both resolve to `15.125.23.214`).
- DNS is simulated: in the book, DNS is a third-party service and not hosted by us.

### 2.2 Child Container 2 - CC2 (Database)

CC2 separates the web tier from the data tier: the Web Server no longer stores the data
itself, it queries a separate Database Server. With two servers, each tier can be scaled
independently (Chapter 1, "Database").

#### 2.2.1 Request flow

The simulation has 6 steps. Steps 1 to 3 are the same as in CC1:

| Step | From → To | Message | Data source |
| --- | --- | --- | --- |
| 1 | User Browser → DNS Server | `www.mysite.com ?` | — |
| 2 | DNS Server → User Browser | `15.125.23.214` | `GET /dns/resolve?host=www.mysite.com` |
| 3 | User Browser → Web Server | `GET /users/12` | — |
| 4 | Web Server → Database Server | `SELECT users id=12` | — |
| 5 | Database Server → Web Server | `1 row` (row count from the response) | `GET /db/users/12` |
| 6 | Web Server → User Browser | `200 OK · JSON` | `GET /api/users/12` |

#### 2.2.2 Controls and behavior

- Same controls and behavior as CC1 (2.1.2 and 2.1.3), applied to the 6 CC2 steps.
- Each CC runs on its own: playing CC2 does not change CC1, and the reverse.
- Steps 2, 5 and 6 call the real backend and show the raw JSON in the response panel.

#### 2.2.3 Backend API

The data tier is a separate module (`src/server/db/`) exposed under `/db`. The web tier
(`/api`) reads users only through the data tier, so `/api/users/:id` and `/db/users/:id`
always return the same user.

| Method | Route | Response |
| --- | --- | --- |
| GET | `/db/users/:id` | `200 { query, rowCount, rows }`. An unknown id returns `rowCount: 0` and `rows: []`. `400` if `id` is not a positive integer |

- `query` is the SQL the web server would send, e.g. `SELECT * FROM users WHERE id = 12`.
- The database is in-memory and read-only. A query returns copies of rows, so callers
  cannot change the stored data.

## 3. Non-Functional Requirements

- **Testability**: geometry and simulation logic are pure modules (no DOM) and are covered by unit
  tests. Every API route is covered by HTTP tests. Tests are added or updated whenever
  application code changes.
- **Responsiveness**: the layout works at phone width (≤ 800px) with no horizontal scroll.
  The canvas redraws when the diagram is resized.
- **Sharp rendering**: the canvas respects `devicePixelRatio`.
- **Theming**: light and dark themes follow `prefers-color-scheme`. The canvas reads its colors
  from CSS variables.
- **Accessibility**: the container labels are DOM text (not drawn on the canvas). The step list
  and response panel are `aria-live` regions. Animations are skipped when
  `prefers-reduced-motion` is set.
- **Extensibility**: each future scaling stage is a new Child Container (CC2, CC3, …) with its
  own steps, routes and tests (see `docs/PLAN.md`).

## 4. UI / UX Requirements

### 4.1 General Layout

- The application is a simple, single page HTML interface.
- UI text is in English, matching the book.

### 4.2 Main container

- Must have a width of 100% and a dynamic height based on the number of child containers.

### 4.3 Child containers

- Width of 100%
- Will be placed below each other inside the main container.
- Each one has a header (tag such as `CC1`, a title and a short description), a diagram area,
  and a side panel (controls, step list, response panel). On narrow screens the side panel
  moves below the diagram.

#### 4.3.1 CC1

- Will have 3 inner containers, laid out as a triangle:
  - Container A at the top left, representing a User Browser
  - Container B at the top right, representing a DNS server
  - Container C at the bottom center, representing a Web Server
- Container A is connected to containers B and C through arrows drawn on an HTML5 Canvas
  overlaid on the diagram.
- Each connection has two parallel, one-way arrows: one for the request and one for
  the response.

#### 4.3.2 CC2

- Same layout as CC1, plus a fourth inner container:
  - Container A at the top left, representing a User Browser
  - Container B at the top right, representing a DNS server
  - Container C at the bottom center, representing a Web Server (web tier)
  - Container D at the bottom right, to the right of Container C, representing a
    Database Server (data tier)
- Arrows connect A ↔ B, A ↔ C and C ↔ D, with the same two-lane request/response style
  as CC1. The C ↔ D arrows show the communication between the web server and the database.
- The gap between C and D is wider than the other column gaps, so the C ↔ D arrows stay
  visible on narrow screens.
