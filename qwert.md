# `manish.md` — GEOPIC · Seismic Data Processing Atlas

**Complete guide: build from scratch → run → use → stop → host on your business network.**

This single file is the full reference. It covers:

1. [What the system is & its use case](#1-what-the-system-is-and-its-use-case)
2. [Architecture](#2-architecture)
3. [Dependencies — everything you must install](#3-dependencies--everything-you-must-install)
4. [Folder structure](#4-folder-structure)
5. [Build from scratch (step by step)](#5-build-from-scratch-step-by-step)
6. [Configuration & environment variables](#6-configuration--environment-variables)
7. [Start and Stop](#7-start-and-stop)
8. [Use case — step-by-step operating the app](#8-use-case--step-by-step-operating-the-app)
9. [Hosting on a business network (LAN) — let everyone use it](#9-hosting-on-a-business-network-lan--let-everyone-use-it)
10. [Database admin with pgAdmin](#10-database-admin-with-pgadmin)
11. [Production build (optional)](#11-production-build-optional)
12. [Troubleshooting](#12-troubleshooting)
13. [Security notes](#13-security-notes)
14. [Command cheat sheet](#14-command-cheat-sheet)

> **Tested environment (the machine this was verified on):**
> Node.js `v24.19.0`, npm `11.17.0`, Docker `29.7.2`, Docker Compose v2+, PostGIS `16-3.4`, pgAdmin 4.
> Instructions are Windows‑first; a [Linux/macOS note](#linuxmacos) is included.

---

## 1. What the system is and its use case

**GEOPIC — Seismic Data Processing Atlas** is an internal, map‑centric catalogue for a
seismic data‑processing centre (the kind of work ONGC/GEOPIC does in India).

Over decades a centre processes thousands of **2D/3D seismic surveys** across India's
sedimentary basins. Historically this lived in Excel sheets and PDF dossiers. This app
turns that archive into **one interactive map** where every processed survey is
georeferenced (stored as a polygon in PostGIS), searchable, filterable, exportable, and
annotated.

### Typical questions it answers

- *"What seismic data do we have in the **Cambay** basin, and exactly where is it?"*
- *"Which **3D** surveys were processed in **2018**?"*
- *"Where are the coverage gaps between blocks?"*
- *"Pull the processing **dossier (PDF)** for survey `SI-1234`."*
- *"Overlay our **shapefile** of lease/pipeline boundaries and mark an area of interest."*

### Users

Geophysicists, data managers, project managers, and GIS analysts — read/consult mostly,
plus data stewards who import new survey records.

### Core concepts (glossary)

| Term | Meaning |
| --- | --- |
| **Survey / processing record** | One processed seismic dataset: project, basin, SI code, year, processing type, acquisition parameters, and its geographic **footprint**. |
| **Project** | A grouping (`project_name`, `basin`, `project_type`, `data_dimension` = 2D/3D). |
| **Footprint** | The polygon (bounding box or 4 corners) of the survey on the map — PostGIS `geometry(Polygon,4326)`. |
| **Basin** | Sedimentary basin (Cambay, Assam‑Arakan, Mumbai Offshore, …). |
| **Data dimension** | `2D` or `3D`. |
| **Quantum** | Size of survey: area km² (`quantum_skm`) or line km (`quantum_slkm`). |
| **SI code** | Survey Index code — a stable identifier. |
| **Dossier / report** | Generated PDF of a survey's processing details. |
| **Layer** | An uploaded GIS file (shapefile/GeoJSON/…) rendered over the map. |
| **Interpretation polygon** | An area you draw on the map to mark areas of interest, optionally linked to surveys. |
| **Audit log** | Automatic record of who did what (view/filter/export/tool/timeline). |

---

## 2. Architecture

```
   Any device on the network
        browser  http://<SERVER-IP>:3000
              |
              v
   +---------------------------+
   |  client/  Next.js 15      |  :3000   React 19 · MapLibre GL · Tailwind
   |  (web app)                |
   +-------------+-------------+
                 |  HTTP  /api/*        (CORS + NEXT_PUBLIC_API_URL)
                 v
   +---------------------------+
   |  server/  Express 5       |  :4000   REST API · Zod · jspdf · tsx
   +-------------+-------------+
                 |  pg (PostgreSQL wire protocol)
                 v
   +---------------------------+
   |  postgis/postgis:16-3.4   |  container :5432  ->  host :5433
   |  DB: geopic               |
   +---------------------------+
                 ^
   +---------------------------+
   |  pgAdmin 4                |  host :5050   (admin UI, optional)
   +---------------------------+

   Basemaps (OSM / CARTO / Esri) come from the Internet — no API key needed.
```

- **Docker Compose** runs the database and pgAdmin.
- **Node.js** runs the API server and the web app.
- The web app calls the API from the **user's browser**, so it must know the server's
  network address (see [§9](#9-hosting-on-a-business-network-lan--let-everyone-use-it)).

---

## 3. Dependencies — everything you must install

### 3.1 System software (required)

| # | Software | Version | Why | Check |
| --- | --- | --- | --- | --- |
| 1 | **Node.js** | **20 LTS or newer** (22/24 fine) | Runs API + web app. Next 15 needs ≥ 18.18. | `node -v` |
| 2 | **npm** | 9+ (ships with Node) | Installs packages. | `npm -v` |
| 3 | **Docker Desktop** | Any recent (with **Compose v2**) | Runs PostGIS DB + pgAdmin. | `docker --version` && `docker compose version` |

Install Node: https://nodejs.org (LTS). Install Docker Desktop: https://www.docker.com/products/docker-desktop.

> Docker Desktop must be **running** (whale icon in system tray) before the app starts.

### 3.2 Optional software

| Software | When you need it |
| --- | --- |
| **Git** | Only to clone the repo from a remote (not needed to run a local copy). |
| **pgAdmin (desktop)** / DBeaver | Alternative to the containered pgAdmin. |
| **PM2** or **NSSM** | Keep the app running 24/7 automatically (see §9.7). |
| Internet access | Needed for first‑time image/npm downloads **and for map tiles**. |

### 3.3 Hardware / resources

| Resource | Minimum | Recommended |
| --- | --- | --- |
| RAM | 4 GB free | 8 GB free (Docker + Node + Next) |
| Disk | ~3 GB | 8+ GB (images ≈ 1.2 GB, node_modules ≈ 1 GB, DB volume grows) |
| Network | — | Office LAN (or internet for basemap tiles) |

### 3.4 Application packages (installed automatically — do NOT install by hand)

These come from the three `package.json` files when you run `npm install`:

**Root (`package.json`)**
- `concurrently` — runs server and client together.

**Server (`server/package.json`)** — `geopic-server`
- Runtime: `express` ^5, `cors`, `helmet`, `pg`, `zod`, `jspdf`, `jspdf-autotable`
- Dev: `tsx`, `typescript`, `@types/*`

**Client (`client/package.json`)** — `geopic-client`
- Framework: `next` ^15, `react` ^19, `react-dom` ^19
- Data/state: `@tanstack/react-query`
- Mapping: `maplibre-gl` ^6, `proj4`
- File I/O: `xlsx` (Excel), `shpjs` (Shapefile), `@mapbox/shp-write` (Shapefile **export**), `jspdf` + `jspdf-autotable` (PDF)
- UI: `lucide-react`, `tailwindcss` ^4, ~40× `@radix-ui/*`, `recharts`, `sonner`, `react-hook-form`, `zod`
- Dev: `typescript`, `@tailwindcss/postcss`, `@types/*`

> ⚠️ **Never delete `@mapbox/shp-write`** — removing it breaks the home page
> (used for Shapefile export in `client/lib/converter.ts`).

### 3.5 Native binaries

`esbuild` (for `tsx`), `@next/swc-win32-x64-msvc` (Turbopack) and `sharp` install
platform binaries. If your npm is configured to **block lifecycle scripts**, these may be
skipped. They are normally present in this project; if the build fails, re‑run the
relevant `npm install` with scripts allowed.

---

## 4. Folder structure

```
india-map-artistry/
├─ start.bat              # one-click START (DB + install + apps + browser)
├─ stop.bat               # one-click STOP (apps + containers)
├─ manish.md              # this file
├─ docker-compose.yml     # PostGIS + pgAdmin
├─ package.json           # root scripts (dev / build / start) via concurrently
├─ tsconfig.dist.json     # production compile config for the server
├─ .env                   # DATABASE_URL template (server reads env, not this file)
├─ db/
│  └─ init.sql            # PostGIS schema — runs on first DB start
├─ server/
│  ├─ src/
│  │  ├─ index.ts         # Express app, CSP, CORS, migrate()
│  │  ├─ db.ts            # pg Pool (reads process.env.DATABASE_URL)
│  │  ├─ lib/             # crs.ts, reproject.ts (coordinate transforms)
│  │  └─ routes/          # surveys, reports, audit-logs, interpretation, layers
│  └─ package.json
└─ client/
   ├─ app/                # Next.js App Router: page.tsx + /gis/* sub-app
   ├─ components/seismic/ # Map, ribbon, filters, dialogs, panels
   ├─ components/ui/      # shadcn/Radix primitives
   ├─ lib/                # api, seismic, gis, external, converter, layers, interpretations
   ├─ public/             # maplibre-gl-worker.mjs, maplibre-gl-shared.mjs
   ├─ .env.local          # NEXT_PUBLIC_API_URL
   └─ package.json
```

---

## 5. Build from scratch (step by step)

Assumes an empty machine. Adjust the path as needed.

### Step 0 — Install prerequisites

1. Install **Node.js** (LTS) → verify `node -v`, `npm -v`.
2. Install **Docker Desktop** → start it → verify `docker --version`.
3. (Windows) Allow Docker/Node through the firewall when prompted.

### Step 1 — Get the code

Place the project folder anywhere (example used here):

```
C:\Projects\india-map-artistry
```

Open a terminal in the project root (the folder containing `package.json`).

### Step 2 — Install dependencies

Run once per machine (creates `node_modules` in root, `server`, and `client`):

```
npm install
npm install --prefix server
npm install --prefix client
```

### Step 3 — Configure environment

**`client/.env.local`** (points the web app at the API):

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

**Root `.env`** (documentation/template — the server reads the real value from your shell):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
```

> The **5433** is the host port mapped to the container's 5432 (see `docker-compose.yml`).

### Step 4 — Start the database

```
docker compose up -d
```

Wait until healthy (~10 s on first start, longer while pulling the image):

```
docker inspect --format "{{.State.Health.Status}}" geopic-postgres
# expected: healthy
```

On first run `db/init.sql` creates the schema (PostGIS extension + tables).

### Step 5 — Start the application

**One‑click:** double‑click **`start.bat`**.

**Manual (cmd):**

```
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
npm run dev
```

**Manual (PowerShell):**

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/geopic"
npm run dev
```

`npm run dev` uses `concurrently` to launch both:

- `npm run dev:server` → `tsx watch src/index.ts` → **http://localhost:4000**
- `npm run dev:client` → `next dev --turbopack` → **http://localhost:3000**

### Step 6 — Verify

| Check | Expected |
| --- | --- |
| http://localhost:3000 | Page loads, title "Seismic Data Processing" |
| http://localhost:4000/api/surveys | `[]` (JSON array) |
| http://localhost:5050 | pgAdmin login (see §10) |
| Docker containers | `geopic-postgres` (healthy), `geopic-pgadmin` (Up) |

You're running. 🎉

---

## 6. Configuration & environment variables

### Where values live

| Variable | Where set | Consumed by | Required? |
| --- | --- | --- | --- |
| `DATABASE_URL` | Shell env (set in `start.bat` / your terminal) | `server/src/db.ts` | **Yes** — API won't start DB correctly without it |
| `NEXT_PUBLIC_API_URL` | `client/.env.local` (dev) / env before build (prod) | Browser (inlined into JS) | **Yes** |
| `CLIENT_ORIGIN` | Shell env (optional) | `server/src/index.ts` CORS | For LAN access (§9) |
| `PORT` | Shell env | API port (default `4000`) | No |
| `EXTERNAL_DATABASE_URL` | Root `.env` (optional) | "External DB" import tab | No |

> **Important:** the server does **not** load `.env` automatically (no `dotenv`). It reads
> real OS environment variables. Always export `DATABASE_URL` in the shell that runs the
> server — or use `start.bat`, which sets it for you.

### `docker-compose.yml` summary

| Service | Container | Host:Container port | Credentials |
| --- | --- | --- | --- |
| `postgres` (PostGIS) | `geopic-postgres` | `5433:5432` | user `postgres`, password `postgres`, db `geopic` |
| `pgadmin` | `geopic-pgadmin` | `5050:80` | `admin@geopic.com` / `admin` |

DB data persists in the Docker volume `postgres-data`; pgAdmin config in `pgadmin-data`.

---

## 7. Start and Stop

### 7.1 Start

| Method | Action |
| --- | --- |
| **Easiest** | Double‑click **`start.bat`** (checks Docker → starts DB → installs deps if missing → runs both apps → opens browser). |
| **Manual** | `docker compose up -d`, then set `DATABASE_URL`, then `npm run dev`. |
| **DB only** | `docker compose up -d` (or `npm run docker:up`) |
| **Server only** | `set DATABASE_URL=...` then `npm run dev:server` |
| **Client only** | `npm run dev:client` |

### 7.2 Stop

| Method | Action |
| --- | --- |
| **Easiest** | Double‑click **`stop.bat`** (kills app processes + `docker compose down`). |
| **Manual** | Press **Ctrl+C** in the app terminal, then `docker compose down` (or `npm run docker:down`). |

> `docker compose down` **keeps** your data (the `postgres-data` volume is not deleted).
> To delete data too: `docker compose down -v` (destructive — loses all surveys).

### 7.3 Useful states

```
docker compose ps             # container status
docker compose logs -f        # tail all container logs
docker compose restart        # restart DB/pgAdmin
```

---

## 8. Use case — step-by-step operating the app

> The database starts **empty** (0 surveys, 0 layers, 0 polygons). Add data first
> (step 1) or you'll see a blank map.

Open **http://localhost:3000**.

### Step 1 — Add data (required first)

Click **`Add`** in the top ribbon → four tabs:

| Tab | What it does |
| --- | --- |
| **Manual entry** | Type one survey: project, basin, SI code, year, processing type, quantum, corners/bbox. |
| **Import files** | Drop **CSV / XLSX / XLS** (parsed with SheetJS) or a **zipped Shapefile** (`.shp`+`.shx`+`.dbf`) — bulk import. |
| **External DB** | Pull rows from another Postgres (needs `EXTERNAL_DATABASE_URL` set + restart). |
| **Manage records** | Edit / delete existing surveys (bulk edit fields). |

After a bulk import a **blue bar** appears with **Undo** — rolls back that batch
(`/surveys/rollback`).

Records are saved to PostgreSQL, converted to a footprint polygon by the server, and
appear on the map.

### Step 2 — Explore the map

- **Tools** (ribbon): **Hand** = pan · **Draw box** = rectangle‑zoom · **Inspect** = click a footprint to select.
- **Zoom in/out** · **Fit India** (reset view).
- Toggle **2D / 3D** (control on the map) and change basemap.

### Step 3 — Filter, search, animate

- **Left sidebar (FilterRail):** multi‑select facets — *Basin*, *Area (UTM zone)*, *Data Dimension*, *Year of Processing*, *Type of Processing*. Each shows counts. Header shows total vs. shown.
- **Find** (magnifier): free text over project / processing / SI code.
- **Timeline slider + Play:** animates surveys appearing year‑by‑year (1.2 s/step) — shows how coverage grew over time.
- Header stats: **Mapped** (has geometry), **Adjusted** (geometry notes), **Year**.

### Step 4 — Inspect a survey

Click a footprint (Inspect) or a row in the **bottom table** → the right **details panel**
shows full metadata, linked reports, and interpretations. **Details** opens the full dialog.

### Step 5 — Export a dossier (PDF)

Click **`Print`** → downloads a generated PDF for the selected survey
(`GET /api/surveys/:id/pdf`) and logs a `REPORT_EXPORTED` audit entry.

### Step 6 — Overlay GIS layers

Open the **Layers** panel (layers icon in header) → **upload a shapefile**, or simply
**drag & drop files onto the map**. Each layer gets:
visibility toggle · rename · zoom‑to · reorder (stacking) · **style** (colour/width/fill).

### Step 7 — Draw interpretation polygons

In the Layers panel → **Interpretation panel** → choose colour → **Start draw** →
click points on the map → **Finish** → saved to PostGIS. Then rename / hide / delete, and
**Link surveys** to group related surveys under one drawn area.

### Step 8 — Convert datasets

Click **`Convert`** → drop **GeoJSON / CSV / Excel / KML / Shapefile ZIP** → click
**Download Shapefile** → produces a `.zip` shapefile (for use in ArcGIS/QGIS).

### Step 9 — Audit trail

Every view / filter apply / filter clear / export / map tool / timeline play / details open
is posted to `/api/audit-logs` with a per‑session id. Also available in the GIS sub‑app.

### Extras

- **Themes & font size** — palette icon (3 dark + 3 light themes; S/M/L text).
- **Reprocess geometry** — palette menu → rebuilds footprints from raw coordinates.
- **GIS sub‑app** — `Atlas → Processing Projects / Map Viewer / Acquisition Polygons / Audit History`.
  ⚠️ These call `/api/gis/*`, which this server does **not** implement yet — they show empty/errors.

---

## 9. Hosting on a business network (LAN) — let everyone use it

Goal: **one machine hosts the app; anyone in the office opens it in their browser.**

```
 Host machine (192.168.1.50)                Other PCs / phones
 ├─ client  :3000  ───────────────►  http://192.168.1.50:3000
 ├─ API     :4000  ◄──────────────  (browser calls this directly)
 ├─ PostGIS :5433  (localhost only — not needed by users)
 └─ pgAdmin :5050  (admin only)
```

> Two things must change from "localhost" mode, or remote users get blank screens /
> CORS errors:
> 1. The **client** must know the API's network address (`NEXT_PUBLIC_API_URL`).
> 2. The **API** must allow the web page's origin (`CLIENT_ORIGIN` — CORS).

### Step 1 — Find the host's LAN IP

On the **host machine** (cmd/PowerShell):

```
ipconfig
```

Note the **IPv4 Address** of the active network card — example here: **`192.168.1.50`**.
(Replace it everywhere below with your real IP.)

> 💡 Keep this address stable: set a **DHCP reservation** or **static IP** for the host,
> otherwise the URL changes after a reboot and bookmarks break.

### Step 2 — Open the firewall (Windows, run as Administrator)

```bat
netsh advfirewall firewall add rule name="GEOPIC Web 3000"  dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="GEOPIC API 4000"  dir=in action=allow protocol=TCP localport=4000
```

Optional (admin tools — only if others need pgAdmin):

```bat
netsh advfirewall firewall add rule name="GEOPIC pgAdmin 5050" dir=in action=allow protocol=TCP localport=5050
```

Leave **5433** (database) closed — the app talks to it over `localhost` on the host.

Remove a rule later: `netsh advfirewall firewall delete rule name="GEOPIC Web 3000"`.

### Step 3 — Point the client at the LAN API address

**Dev mode** — edit `client/.env.local`:

```
NEXT_PUBLIC_API_URL=http://192.168.1.50:4000/api
```

then **restart the client** (Ctrl+C → start again).

> `NEXT_PUBLIC_*` values are **baked into the JavaScript bundle**. In **production** you
> must set this **before** running `next build` and re‑build.

### Step 4 — Allow the origin on the API (CORS)

The API only accepts `localhost` origins by default. Set `CLIENT_ORIGIN` to the page URL
users will type (scheme + IP + port):

**PowerShell:**

```powershell
$env:DATABASE_URL  = "postgresql://postgres:postgres@localhost:5433/geopic"
$env:CLIENT_ORIGIN = "http://192.168.1.50:3000"
npm run dev
```

**cmd:**

```bat
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
set CLIENT_ORIGIN=http://192.168.1.50:3000
npm run dev
```

**…or make it permanent** by putting those two `set` lines into `start.bat` (or create a
`start-lan.bat`):

```bat
@echo off
cd /d "%~dp0"
set "DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic"
set "NEXT_PUBLIC_API_URL=http://192.168.1.50:4000/api"
set "CLIENT_ORIGIN=http://192.168.1.50:3000"
docker compose up -d
call npm run dev
```

#### Optional but recommended: accept any private-network origin

If people will open the app via **IP *and* hostname** (e.g. `geopic.office`), one
`CLIENT_ORIGIN` isn't enough. In `server/src/index.ts`, **replace this whole block** (lines ~29‑32):

```ts
// ---- CURRENT CODE to replace ----
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"]
const clientOrigin = process.env.CLIENT_ORIGIN
if (clientOrigin && !allowedOrigins.includes(clientOrigin)) allowedOrigins.push(clientOrigin)
app.use(cors({ origin: allowedOrigins }))
```

**with:**

```ts
// ---- NEW CODE ----
const extra = (process.env.CLIENT_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean)
const allowedOrigins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", ...extra]
const PRIVATE = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3})(:\d+)?$/
app.use(cors({ origin: (o, cb) => cb(null, !o || allowedOrigins.includes(o) || PRIVATE.test(o)) }))
```

*(Hot‑reloads automatically via `tsx watch`. Only do this if you also replace the whole
block — mixing the old and new lines would redeclare `allowedOrigins` and break startup.)*


### Step 5 — Start the host

Use your chosen method (§7). Verify on the host first: open **http://192.168.1.50:3000**.

### Step 6 — Users open the URL

From **any** device on the network (PC/tablet/phone):

```
http://192.168.1.50:3000
```

That's it — the whole network now uses the same database and app.

### Step 7 — Keep it running 24/7 (pick one)

**Option A — Task Scheduler (simplest, no extra tools):**
Create a task that runs your `start-lan.bat` at system startup:

```bat
schtasks /create /tn "GEOPIC" /tr "C:\Projects\india-map-artistry\start-lan.bat" /sc onstart /ru SYSTEM /rl highest
schtasks /run /tn "GEOPIC"
```

> Run as the logged‑in user instead of `SYSTEM` if you need the terminal visible:
> `/ru "%USERNAME%"` and use `/sc onlogon`.

**Option B — PM2 (process manager, auto‑restart):**

```bat
npm i -g pm2 pm2-windows-startup
pm2 start npm --name geopic -- run dev
pm2 save
pm2-startup install
```

**Option C — NSSM (run as a Windows service):** install NSSM, then create one service per
process pointing at `node dist/server/index.js` (API) and `next start` (client). Most
robust; more setup.

### Step 8 — (Optional) Friendly name via DNS / hosts

Instead of typing the IP, give it a name in the office DNS (or edit each PC's
`C:\Windows\System32\drivers\etc\hosts`):

```
192.168.1.50   geopic.office
```

Then use `http://geopic.office:3000`. If you do this, set
`CLIENT_ORIGIN=http://geopic.office:3000` (or enable the regex in Step 4).

### Step 9 — (Optional) Secure DB & pgAdmin from the LAN

`docker-compose.yml` currently publishes **all** services on `0.0.0.0`, so PostGIS and
pgAdmin are reachable from the network. To restrict them to the host only, change the
port mappings to loopback:

```yaml
ports:
  - "127.0.0.1:5433:5432"   # postgres
ports:
  - "127.0.0.1:5050:80"     # pgadmin
```

Recreate with `docker compose up -d` (DB data is kept). The app still works — it connects
over `localhost:5433`.

### Step 10 — (Optional) Access the app from outside the office

If the office network uses **Tailscale**/VPN (this host had a `100.x` Tailscale address),
the same steps apply — just use the Tailscale IP/hostname, e.g. `http://100.x.y.z:3000`,
and set `CLIENT_ORIGIN` accordingly. For public internet hosting you'd need HTTPS + a
reverse proxy + auth — see §13.

### Networking quick checklist

- [ ] Host LAN IP known and **stable** (DHCP reservation / static).
- [ ] Firewall open for **3000** and **4000** inbound.
- [ ] `NEXT_PUBLIC_API_URL` = `http://<LAN-IP>:4000/api` (client restarted / rebuilt).
- [ ] `CLIENT_ORIGIN` = `http://<LAN-IP>:3000` (server restarted) — *or* the CORS regex enabled.
- [ ] Docker Desktop is running; DB shows `healthy`.
- [ ] Host URL tested in the host's browser.
- [ ] Tested from a **second** machine.
- [ ] (Optional) DB/pgAdmin locked to `127.0.0.1`.

---

## 10. Database admin with pgAdmin

**URL:** http://localhost:5050 (LAN: `http://<LAN-IP>:5050`)

**Login:** `admin@geopic.com` / `admin`

pgAdmin starts with an empty server list — you must **register the database connection once**:

1. Right‑click **Servers → Register → Server** (older: *Create → Server*).
2. **General** tab → Name: `GEOPIC`.
3. **Connection** tab → fill exactly:

   | Field | Value |
   | --- | --- |
   | Host name/address | `geopic-postgres` |
   | Port | `5432` |
   | Maintenance database | `geopic` |
   | Username | `postgres` |
   | Password | `postgres` |
   | Save password | ✔ |

4. **Save.** Expand: *Servers → GEOPIC → Databases → geopic → Schemas → public → Tables*.

> ⚠️ **Two gotchas:**
> - Host must be **`geopic-postgres`** (the container name), **not** `localhost` — pgAdmin
>   runs *inside* Docker and reaches PostGIS by container name on the
>   `india-map-artistry_default` network.
> - Port must be **`5432`** (the container port). `5433` is only the **host‑side** mapping.
>
> *(If you connect from a **desktop** client instead — DBeaver/pgAdmin‑desktop on Windows —
> use the opposite: host `localhost`, port `5433`, user `postgres`, password `postgres`,
> db `geopic`.)*

**Tables you'll see:** `processing_records`, `projects`, `project_reports`,
`interpretation_polygons`, `layers`, `layer_features`, `audit_logs`, plus PostGIS
extension tables.

---

## 11. Production build (optional)

Dev mode (`npm run dev`) is what is verified and is fine for internal LAN use. For a
lighter/faster always‑on deployment:

```
set NEXT_PUBLIC_API_URL=http://192.168.1.50:4000/api
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
npm run build
```

- `build:server` → compiles `server/src` → `dist/server/` (per `tsconfig.dist.json`).
- `build:client` → `next build` (inlines `NEXT_PUBLIC_API_URL`).

Start:

```bat
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
set CLIENT_ORIGIN=http://192.168.1.50:3000
npm run start:prod
```

> ⚠️ The root `build:server` script finishes with `cd dist && npm install --omit=dev`.
> If that step errors (there is no `package.json` in `dist/`), the JS files are still
> emitted by `tsc`; you can run the API with `node dist/server/index.js` directly after
> ensuring the production dependencies are resolvable. **Dev mode avoids this entirely**
> and is the recommended path for a small team.

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| "API key required" / blank map | No API key exists here — a stale/broken build or cached tab. | `stop.bat` → `start.bat`; hard‑refresh (**Ctrl+Shift+R**); delete `client/.next` if needed. |
| Page loads but API calls fail (**CORS**) | Origin not allowed, or `NEXT_PUBLIC_API_URL` still `localhost`. | Set `CLIENT_ORIGIN` (§9.4) and correct `NEXT_PUBLIC_API_URL` (§9.3); restart. |
| Remote user's browser tries *their own* localhost:4000 | `NEXT_PUBLIC_API_URL` not changed from localhost. | Set it to `http://<LAN-IP>:4000/api` and restart/rebuild the client. |
| `ECONNREFUSED` / connection refused to DB | Wrong port or DB not up. | Use port **5433**; `docker compose up -d`; check `healthy`. |
| Server starts but DB errors | `.env` not read automatically. | Export `DATABASE_URL` in the shell that runs the server. |
| `@mapbox/shp-write` not found / home page 500 | Client deps incomplete. | `npm install --prefix client`. |
| "Multiple lockfiles / inferred workspace root" | Stray `package‑lock.json` in a parent folder. | Harmless; `client/next.config.ts` pins the Turbopack root. |
| Port already in use | Old processes still running. | `stop.bat`, or kill processes on 3000/4000. |
| npm install skips native builds | Lifecycle scripts blocked. | Re‑run install with scripts allowed (see §3.5). |
| pgAdmin "wrong credentials" | Email typed wrong / confusing DB vs pgAdmin login. | pgAdmin login is `admin@geopic.com` / `admin` (§10). |
| pgAdmin login OK but **server** won't register | Wrong host/port. | Host `geopic-postgres`, port `5432` (§10). |
| Blank map, tiles missing | No internet (OSM/CARTO/Esri unreachable). | Allow outbound 443 to `*.tile.openstreetmap.org`, `*.basemaps.cartocdn.com`, `server.arcgisonline.com`. |
| `/gis/*` pages empty | `/api/gis/*` not implemented in this server. | Known limitation — main Atlas at `/` works fully. |

---

## 13. Security notes

- **No authentication.** Anyone with the URL can read/write data. On an office LAN that is
  usually acceptable; for anything wider, add auth or put it behind a reverse proxy with
  login + **HTTPS**.
- **Default DB password is `postgres`** and pgAdmin is `admin@geopic.com`/`admin` — change
  these for production (`POSTGRES_PASSWORD` in `docker-compose.yml`; pgAdmin password via
  its UI) and restrict ports to `127.0.0.1` (§9.9).
- **CORS** must not be `*` on the public internet. The private‑network regex (§9.4) is
  deliberately limited to `10.x`, `192.168.x`, `172.16–31.x`, `100.64–127.x`, `localhost`.
- Basemap tiles are fetched directly from the Internet by end users (no key, but they need
  outbound HTTPS). For an **air‑gapped** network, self‑host tiles (e.g. TileServer GL, or a
  local `mod_tile`/Nominatim stack) and point `MapCanvas` at your tile URL.
- Keep Docker Desktop, Node and the OS patched.

---

## 14. Command cheat sheet

```bat
:: ---- from scratch ----
docker compose up -d                       :: start DB + pgAdmin
docker inspect --format "{{.State.Health.Status}}" geopic-postgres   :: expect: healthy
npm install && npm install --prefix server && npm install --prefix client

:: ---- run (dev) ----
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
npm run dev                                :: API :4000 + web :3000
:: or one-click: start.bat

:: ---- run on the LAN ----
set NEXT_PUBLIC_API_URL=http://192.168.1.50:4000/api
set CLIENT_ORIGIN=http://192.168.1.50:3000
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/geopic
npm run dev

:: ---- stop ----
:: Ctrl+C, or: stop.bat
docker compose down                        :: stops DB, KEEPS data
docker compose down -v                     :: stops + DELETES data (destructive)

:: ---- firewall (Admin) ----
netsh advfirewall firewall add rule name="GEOPIC Web 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="GEOPIC API 4000" dir=in action=allow protocol=TCP localport=4000

:: ---- logs / status ----
docker compose ps
docker compose logs -f
```

| URL | Purpose |
| --- | --- |
| `http://<LAN-IP>:3000` | Web app (Atlas) — **what everyone opens** |
| `http://<LAN-IP>:4000/api` | REST API |
| `http://<LAN-IP>:5050` | pgAdmin (`admin@geopic.com` / `admin`) |
| `localhost:5433` | Postgres (host only; `postgres`/`postgres`, db `geopic`) |

---

### <a name="linuxmacos"></a>Linux / macOS note

The `.bat` helpers are Windows‑only. On Linux/macOS do the equivalent manually:

```bash
cd india-map-artistry
docker compose up -d
npm install && npm install --prefix server && npm install --prefix client
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/geopic"
export NEXT_PUBLIC_API_URL="http://<LAN-IP>:4000/api"   # in client/.env.local too
export CLIENT_ORIGIN="http://<LAN-IP>:3000"
npm run dev
```

Open the firewall (`ufw allow 3000/tcp && ufw allow 4000/tcp`) and follow §9 the same way.

---

*End of `manish.md`. For the shorter operations guide see `README.md`.*
