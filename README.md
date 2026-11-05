# GEOPIC — Seismic Data Processing Atlas

A full-stack web application for cataloguing, visualising and interpreting seismic
processing surveys over India. Seismic survey footprints are stored in PostGIS and
rendered on an interactive MapLibre map alongside uploadable GeoJSON/SHP layers and
user-drawn interpretation polygons.

This document is a complete, from-scratch guide: prerequisites, setup, running,
credentials, the API, project layout and troubleshooting.

---

## 1. Architecture

```
                      +---------------------------+
  Browser  :3000 ---> |  client/  (Next.js 15)    |
                      |  React 19 + MapLibre GL   |
                      +-------------+-------------+
                                    |  HTTP  /api/*
                                    v
                      +---------------------------+
                      |  server/  (Express 5)     |
                      |  :4000  REST + PostGIS    |
                      +-------------+-------------+
                                    |  pg
                                    v
                      +---------------------------+
                      |  postgis/postgis:16-3.4   |
                      |  container :5433 -> 5432  |
                      +---------------------------+
                                    ^
                      +-------------+-------------+
                      |  pgAdmin  :5050 (optional)|
                      +---------------------------+
```

- **client** — Next.js 15.5 (App Router, Turbopack) + React 19 + Tailwind + MapLibre GL JS.
- **server** — Express 5 + `pg` (node-postgres) + Zod validation, TypeScript run with `tsx`.
- **database** — PostgreSQL 16 with the PostGIS extension, run in Docker via `docker-compose.yml`.
- **pgAdmin** — optional web UI for the database, also via Docker.

---

## 2. Prerequisites

| Tool           | Version      | Notes                                                        |
| -------------- | ------------ | ------------------------------------------------------------ |
| Node.js        | 20 LTS+      | `node -v` / `npm -v`                                         |
| Docker Desktop | recent       | Needed for the PostGIS + pgAdmin containers                  |
| Git            | optional     | Only if you want to clone/version the project                |

> Ports that must be free: **3000** (client), **4000** (API), **5433** (Postgres),
> **5050** (pgAdmin).

---

## 3. Quick start (one command)

1. Install and start **Docker Desktop** and make sure it is running.
2. Double-click **`start.bat`** in the project root.

`start.bat` will:

1. Confirm Docker is running.
2. Start the PostGIS container and wait until it reports **healthy**.
3. Set `DATABASE_URL` to the correct port (`5433`).
4. Install dependencies on first run (root, `server`, `client`).
5. Launch the API + web app together and open the browser.

To stop everything later, double-click **`stop.bat`**.

---

## 4. Manual setup from scratch

If you prefer to run the steps yourself (or are setting up on a new machine):

### 4.1 Get the code

```
cd "C:\Users\Administrator\Desktop\map final\india-map-artistry"
```

### 4.2 Start the database

```
docker compose up -d
```

This starts two containers:

- `geopic-postgres` — PostGIS 16, host port **5433** mapped to container 5432.
  On first start it runs `db/init.sql` to create the schema.
- `geopic-pgadmin` — pgAdmin 4 on port **5050**.

Wait until Postgres is healthy:

```
docker inspect --format "{{.State.Health.Status}}" geopic-postgres
# -> healthy
```

### 4.3 Install dependencies

The repository has three `package.json` files (root, `server`, `client`):

```
npm install
npm install --prefix server
npm install --prefix client
```

### 4.4 Configure environment

Root `.env` (a template — the server reads real values from the shell env):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/geopic"
# EXTERNAL_DATABASE_URL="postgresql://postgres:postgres@HOST:5432/geopic_ext"
```

`client/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 4.5 Run in development

Set the database URL in your shell, then start both apps:

**PowerShell**

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/geopic"
npm run dev
```

**cmd.exe**

```
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
npm run dev
```

`npm run dev` uses `concurrently` to run:

- `npm run dev:server` → `tsx watch src/index.ts` (API on **:4000**)
- `npm run dev:client` → `next dev --turbopack` (web app on **:3000**)

You can also run them in separate terminals:

```
npm run dev:server
npm run dev:client
```

### 4.6 Production build (optional)

```
npm run build
npm run start
```

`build:server` compiles `server/src` to `dist/` via `tsconfig.dist.json`;
`build:client` produces the Next.js production build.

---

## 5. Credentials & URLs

| Service            | URL                     | Credentials                          |
| ------------------ | ----------------------- | ------------------------------------ |
| Web application    | http://localhost:3000   | none                                 |
| REST API           | http://localhost:4000/api | none                               |
| pgAdmin            | http://localhost:5050   | `admin@geopic.com` / `admin`         |
| PostgreSQL (direct)| `localhost:5433`        | user `postgres` / password `postgres`, db `geopic` |

To connect pgAdmin to the database, add a server with host `postgres` (container
name) or `host.docker.internal`, port `5432`, user `postgres`, password `postgres`.

---

## 6. REST API reference

Base URL: `http://localhost:4000/api`

### Surveys — `/surveys`

| Method | Path                     | Purpose                                   |
| ------ | ------------------------ | ----------------------------------------- |
| GET    | `/surveys`               | List all processing records (surveys)     |
| POST   | `/surveys`               | Create a survey                           |
| PUT    | `/surveys/:id`           | Update a survey                           |
| DELETE | `/surveys/:id`           | Delete a survey                           |
| DELETE | `/surveys`               | Delete **all** surveys                    |
| DELETE | `/surveys/rollback`      | Roll back to the previous import batch    |
| POST   | `/surveys/reprocess`     | Re-run CRS conversion / footprint rebuild |
| GET    | `/surveys/:id/interpretations` | Interpretations linked to a survey  |
| GET    | `/surveys/:id/pdf`       | Rendered PDF for a survey                 |

### Reports — `/reports`

| Method | Path       | Purpose                        |
| ------ | ---------- | ------------------------------ |
| GET    | `/reports` | Aggregated report/dashboard data |

### Audit logs — `/audit-logs`

| Method | Path          | Purpose              |
| ------ | ------------- | -------------------- |
| GET    | `/audit-logs` | List audit entries   |
| POST   | `/audit-logs` | Append an audit entry|

### Interpretation polygons — `/interpretation`

| Method | Path                        | Purpose                                  |
| ------ | --------------------------- | ---------------------------------------- |
| GET    | `/interpretation`           | List interpretation polygons             |
| GET    | `/interpretation/:siCode`   | Get one by SI code                       |
| GET    | `/interpretation/:id/surveys` | Surveys linked to a polygon            |
| POST   | `/interpretation`           | Create polygon (GeoJSON geometry)        |
| PATCH  | `/interpretation/:id`       | Update name/colour/opacity/visibility    |
| DELETE | `/interpretation/:id`       | Delete polygon                           |

### Layers — `/layers`

| Method | Path                      | Purpose                              |
| ------ | ------------------------- | ------------------------------------ |
| GET    | `/layers`                 | List layers                          |
| POST   | `/layers`                 | Create a layer                       |
| GET    | `/layers/:id`             | Get a layer                          |
| PUT    | `/layers/:id`             | Update a layer                       |
| DELETE | `/layers/:id`             | Delete a layer                       |
| PUT    | `/layers/reorder/batch`   | Reorder layers                       |
| GET    | `/layers/:id/features`    | Features in a layer                  |
| POST   | `/layers/:id/features`    | Add features to a layer              |
| GET    | `/layers/batch/features`  | Features across layers (map render)  |

Errors are returned as JSON: `{ "error": "..." }`, or `{ "error": "Validation failed", "issues": [...] }` for Zod validation failures.

> **Note:** The client ships extra screens under `/gis/*` (projects, polygons, a GIS map)
> and an "External DB" import tab that call `/api/gis/*` and `/api/external/*`. Those
> server routers are **not part of this server** (see *Known limitations*), so those
> screens will not return data.

---

## 7. Project structure

```
india-map-artistry/
├─ start.bat                 # one-click launcher (Windows)
├─ stop.bat                  # stop apps + containers
├─ docker-compose.yml        # PostGIS + pgAdmin
├─ package.json              # root scripts (dev/build/start) via concurrently
├─ tsconfig.dist.json        # production compile config for the server
├─ .env                      # DB URL template
├─ db/
│  └─ init.sql               # PostGIS schema, loaded on first DB start
├─ server/
│  ├─ src/
│  │  ├─ index.ts            # Express app, helmet/CSP, CORS, migrate()
│  │  ├─ db.ts               # pg Pool (reads DATABASE_URL)
│  │  ├─ lib/                # crs.ts, reproject.ts (coordinate transforms)
│  │  └─ routes/             # index, surveys, reports, audit-logs, interpretation, layers
│  └─ package.json
└─ client/
   ├─ app/                   # Next.js App Router
   │  ├─ page.tsx            # main atlas dashboard
   │  └─ gis/                # GIS sub-app (map, projects, polygons, audit)
   ├─ components/            # UI + seismic map components
   ├─ lib/                   # api.ts, gis.ts, external.ts, converter.ts, interpretations.ts
   ├─ public/                # maplibre-gl worker/shared .mjs files
   └─ package.json
```

---

## 8. Data model (PostGIS)

- **projects** — project metadata (`project_id`).
- **processing_records** — the seismic survey table. Key columns: bbox
  (`bbox_min_lon/lat`, `bbox_max_lon/lat`), `centroid_lon/lat`, `footprint`
  `geometry(Polygon,4326)`, `centroid_geom geometry(Point,4326)`, and CRS
  metadata (`source_crs`, `source_epsg`, `target_epsg`, `conversion_status`,
  `validation_issues text[]`).
- **project_reports** — report rows.
- **interpretation_polygons** — user-drawn polygons `geometry(Geometry,4326)`
  with colour/opacity/visibility.
- **layers** / **layer_features** — uploaded vector layers and their features
  (`geometry(Geometry,4326)`, `properties jsonb`).

Spatial indexes (GiST) exist on `processing_records.footprint`,
`interpretation_polygons.geometry` and `layer_features.geometry`.

---

## 9. Troubleshooting

**"API key required" / blank map.** This project needs **no API key**. All basemaps
(OpenStreetMap, CARTO, Esri World Imagery) are key-free. If you see this, the app is
running from a broken/stale build — run `stop.bat` then `start.bat`, and hard-refresh
the browser (Ctrl+Shift+R). Delete `client/.next` if it persists.

**`DATABASE_URL` / connection refused.** The container listens on host port **5433**,
not 5432. Use
`postgresql://postgres:postgres@localhost:5433/geopic`, and make sure
`docker inspect --format "{{.State.Health.Status}}" geopic-postgres` says `healthy`.

**Server starts but API returns DB errors.** The server does not read `.env`
automatically — export `DATABASE_URL` in the same shell that runs `npm run dev`.

**`@mapbox/shp-write` not found / homepage 500.** The SHP export path dynamically
imports `@mapbox/shp-write`. Ensure `npm install --prefix client` completed.

**Next.js "multiple lockfiles / inferred workspace root" warning.** Harmless. It is
caused by a stray `package-lock.json` in a parent folder; `client/next.config.ts`
already pins the Turbopack root.

**Port already in use.** Run `stop.bat` (or close the stray shell) before starting.

**npm lifecycle scripts skipped.** If your npm is configured to block install
scripts, native binaries (`esbuild`, `sharp`, `@next/swc-win32-x64-msvc`) may be
skipped. They are already present for this project; otherwise re-run the relevant
`npm install` with scripts enabled.

---

## 10. Known limitations

- **No authentication.** The API is open; do not expose it publicly as-is.
- **`/gis/*` and `/external/*` API routes are missing** on this server. The client
  has pages and an "External DB" tab that call them, but only `/surveys`,
  `/reports`, `/audit-logs`, `/interpretation` and `/layers` are mounted. Those
  screens are effectively read-only placeholders until the routers are added.
- **CORS** is restricted to `localhost:3000/3001` and `127.0.0.1:3000/3001`
  (extendable via the `CLIENT_ORIGIN` env var).
- `docker-compose.yml` still carries an obsolete top-level `version:` key (harmless
  warning).

---

## 11. NPM scripts (root)

| Script              | Action                                                        |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Run server + client together (concurrently)                   |
| `npm run dev:server`| API only (`tsx watch`)                                        |
| `npm run dev:client`| Web app only (Next dev, Turbopack)                            |
| `npm run build`     | Build server (`dist/`) then client                            |
| `npm run start`     | Start built server + client                                   |
| `npm run docker:up` | `docker compose up -d`                                        |
| `npm run docker:down`| `docker compose down`                                        |
