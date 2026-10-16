# SitoFolio

A portfolio builder for visual creatives, with a public template collection, an editable portfolio, private project imports and published portfolio snapshots. This repository contains the current **v0.14.1 local development beta** and the latest interface and animation work.

## Run locally

Requirements: **Node.js 24+** and **Python 3.11+**. There are no third-party Node packages to install. The Python parser needs the packages in `product/requirements.txt`.

From the repository root, using PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r product/requirements.txt
Copy-Item product/.env.example product/.env
npm start
```

On macOS or Linux:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r product/requirements.txt
cp product/.env.example product/.env
npm start
```

Open **http://127.0.0.1:4180/**. The collection is at `/#templates`. Create your own local account to explore setup and the editor; no owner accounts or saved projects ship with the repository. Keep the Python environment active, or set `PYTHON_PATH` in `product/.env` to your Python executable. The development server starts its import worker automatically.

Do not replace an existing `.env` when updating a checkout. External service credentials are optional for local UI review; integrations that need them remain unavailable until configured.

## Project map

| Path | Purpose |
| --- | --- |
| `product/web/` | Framework-free browser interface, styles and template presentation |
| `product/web/interface.js`, `interface.css` | Landing page, studio navigation and responsive composition |
| `product/web/signature-motion.js` | Shared composition transitions, Replay and scroll exhibition |
| `product/web/public.js`, `portfolio-experience.css` | Portfolio motion and case-study chapter navigation |
| `product/server.mjs` | HTTP server, authenticated APIs and explicit static-file routes |
| `product/presentation.mjs`, `templates.mjs` | Shared portfolio renderer and template application |
| `product/imports.mjs`, `worker.mjs`, `extract.py` | Private import queue, review and media extraction |
| `product/tests/` | Automated integration, import, onboarding and motion checks |
| `prototype/dist/` | Existing editor runtime used by the product server |
| `docs/DEVELOPER-HANDOFF.md` | Current priorities, review paths and implementation boundaries |
| `docs/PRD-AR.md` | Detailed Arabic product requirements, acceptance criteria and completion plan |

Arabic product requirements are available as [Markdown](docs/PRD-AR.md) and an [editable Word document](docs/SitoFolio-PRD-AR.docx).

## Checks

With the Python environment active, run `npm test` from the root. Tests create temporary workspaces and generated input files. They do not require real provider credentials or reuse your local account database.

## Development status

The UI, local accounts, editor, import review and local publication flow are implemented. The current design focus is distinctive animation and interaction across the interface and templates. Visual acceptance is still pending.

This is a Node application with a database and background worker. GitHub hosts the source; GitHub Pages alone cannot run this application. Production deployment, parser isolation, live provider verification, domains/TLS and operational work remain. See [service setup](product/SETUP.md) and [delivery status](product/DELIVERY-STATUS.md).

## Data and assets

`.env`, account databases, uploads, sessions, source-download manifests, original private reference files, old release archives and local review captures are excluded from Git. A first launch creates a fresh `product/data/` directory.

Curated demo artwork and fonts needed by the current interface are included, so a clone can reproduce it. The sample collection uses repository-local source identifiers; private Drive links and source identifiers are omitted. Font licenses are retained alongside the fonts. Public source visibility does not grant a new open-source license or rights to reuse portfolio artwork, branding or portraits.
