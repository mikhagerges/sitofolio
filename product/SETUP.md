# SitoFolio product implementation — service setup

The product runs at **http://127.0.0.1:4180**. The original Mikha prototype files remain untouched; its separate port 4173 server is not started by this product launcher. The new product starts every real account with an empty, isolated workspace.

This is a working local beta, **not a production launch certification**. There are no production credentials, subscriptions, public deployments or third-party account changes. The integrations below are implemented but have not been tested against live providers without service accounts.

## Run locally

Requires Node 24+, Python 3.11+ and `requirements.txt`. From `E:\Sitofolio\product`, copy `.env.example` to `.env`, set `PYTHON_PATH` to your Python executable, then run `npm start`. In development, the server starts and supervises the import worker automatically. Set `IMPORT_WORKER_AUTOSTART=false` to manage it separately with `npm run worker`. Production always requires a dedicated managed worker. In this workspace the bundled Python is `C:\Users\infotech\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`. No Node dependency installation is needed. Worker logs live in the configured data directory as worker.log and worker-error.log. On Windows, Start-Product.ps1 starts the server hidden using .env; this launcher assumes the default local port 4180. This workspace already has an untracked .env with blank provider credentials and the local Python path.

Run `npm test` with `PYTHON_PATH` configured. Tests use a separate temporary database and generated fixture files; they do not modify user portfolios.

Data lives under `product/data`: SQLite database, private uploads, extracted artwork, optimized AI copies and an encryption key for development OAuth tokens. Do not include this folder in a source release. Back up the database and media together. Never put `.env` or data inside a static/public web directory.

## Accounts to create, when needed

| Service/account | Why | Configuration |
|---|---|---|
| OpenAI API organization + a dedicated SitoFolio project | Optional visual analysis and writing | `OPENAI_API_KEY`, model IDs, project-level spending controls. ChatGPT subscriptions do not configure this server. |
| Google Cloud project | Google sign-in and Drive import | Enable Drive API. Create Web application OAuth client. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Callback: `<APP_ORIGIN>/api/google/callback`. Add test users before verification. |
| Transactional email provider | Email verification, recovery and inquiry notifications | Current adapter uses Resend: verify a sender domain, set `MAIL_API_KEY` and `MAIL_FROM`. The adapter can be replaced. |
| Eligible merchant/payment account | Subscriptions and self-service billing | Current optional adapter uses Stripe. Eligibility must be confirmed for your legal entity before choosing it. Create four EGP prices: Solo 249/month or 2490/year, Pro 449/month or 4490/year. Configure STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_SOLO_PRICE_ID, STRIPE_PRO_PRICE_ID, STRIPE_SOLO_ANNUAL_PRICE_ID and STRIPE_PRO_ANNUAL_PRICE_ID. Match actual Stripe prices to displayed amounts. Webhook: `<APP_ORIGIN>/api/billing/webhook`, subscription lifecycle events. Use test mode first. If ineligible, implement an available gateway adapter instead. |
| Hosting + DNS/domain provider | Public application and portfolio links | A deployment with HTTPS, persistent private storage, web process and worker process. Set `APP_ORIGIN`, `HOST`, `PORT`; do not expose the development loopback server directly. |
| Adobe Fonts Web Project | Acumin on the public site | A licensed Web Project stylesheet, not the family catalog link. Set ACUMIN_STYLESHEET_URL to the official https://use.typekit.net/<project>.css URL. Studio/editor/presentation use this shared stylesheet, with bundled/system fallbacks when absent. |

Enter secrets only in the server's environment or hosting secret store. Do not paste them into chat, frontend code, screenshots or the repository.

## Google Drive permissions

The folder importer uses the official Drive API, server-side OAuth code exchange, PKCE, expiring state bound to the initiating session and encrypted refresh tokens. It downloads only the files/folders explicitly selected in the product. Recursive traversal is bounded to 8 levels and 120 selected files; API pagination is handled for folder imports. Docs, Slides and Drawings export through the official PDF endpoint (10 MB export limit); other unsupported native formats need manual export. Copies run in the background and checkpoint completed files. Fake-provider tests passed; live Google verification remains.

Full folder access uses `drive.readonly`, a **restricted** scope. `GOOGLE_DRIVE_FOLDERS_ENABLED=false` by default. Enable only for designated test users or after applicable Google OAuth verification/security assessment. A future narrower Picker-based file-only integration can use `drive.file`; selecting a folder does not justify assuming access to all descendants under that scope. The UI must not imply Google has approved the application before it has.

Official references: [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [OAuth web server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [Drive files list](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list), [PDF export](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/export).

## Import pipeline and cost controls

1. Authenticated users create an import; individual files upload in resumable 2 MB chunks with final SHA-256 validation, bounded size and strict path checks. Original source files are retained privately.
2. Durable SQLite job queue. A separate single worker claims a job atomically and maintains a process lease/heartbeat. It retries temporary database contention; interrupted work is surfaced for explicit retry rather than silently replaying paid calls.
3. Offline Python parser: PDFs become full-page artwork plus extracted text. Images are normalized to WebP and retain aspect ratio/transparency. GIF import analyzes its first frame and explicitly notes this. Unsupported working files are listed, never reported as fully imported.
4. Optional AI analysis: optimized JPEGs at most 768px, `detail: low`, text limited to 2,000 characters per visual, batches of at most 8. Originals are never sent. The UI requires explicit consent. Source text is untrusted, not an instruction.
5. Structured Responses API output with project metadata, description, evidence, confidence and exact visual IDs. Client/year/role remain blank unless supported. Outputs cannot execute tools or publish. A configured stronger model is used only for low-confidence batches if the budget allows.
6. Successful batch results cache per tenant/model/source sequence. Every provider attempt is durably reserved before sending, including retries and timeouts. Defaults: at most 12 calls/import, 10/40/100 calls per Free/Solo/Pro user/month (also bounded by AI_MONTHLY_CALL_LIMIT, default 200) and 100 calls/service/day; max 4,000 output tokens/call, at most 2 attempts with delay. Remaining visuals fall back to local grouping, with a visible note. These are **call/token ceilings, not a guaranteed currency ceiling**: set provider project spend controls and model pricing alerts before enabling public AI access.
7. Review: rename, edit metadata/draft, merge, split, reorder, move images between groups or remove, undo structural edits, and select a cover without reordering the story. Save with revision checks. Final create operation is atomic/idempotent and produces private Draft projects. A separate explicit publish action is required.

Limits: 50 MB per uploaded file, 150 MB/job, 120 input files, 120 total PDF pages, 240 extracted visuals, 400 MB ZIP expansion, ratio <=100, no nested/encrypted ZIPs or symlinks, 40-million-pixel image guard and 120-second parser timeout. Source filenames and archive paths are never used as output destinations. No Behance scraping/integration is enabled.

Official AI references: [Vision](https://developers.openai.com/api/docs/guides/images-vision), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Provider availability and output quality still require live-account evaluation.

## Before accepting public users

Palette extraction uses the same `PARSER_RUNNER` deployment wrapper convention as imports and strips service secrets from its subprocess environment. The local Python process is not a sandbox. The wrapper must support both extract.py and palette.py with file/resource/network isolation. Palette inputs are removed in a finally block; crash recovery should expire leftovers in data/palette-temp. At most eight distributed pages of a PDF are sampled for colors, so users must review the suggested palette.

The curated examples use Mikha's authorized source folder and an AI-generated portrait. They are public example assets on this local beta, separate from tenant uploads. Keep rights/consent for these demo materials before deploying them for other users. reference-work is private development source material and must not be deployed as public assets. The shared example-work.public.json preserves collection mappings using repository-local source identifiers and contains no private Drive links. Original source metadata and preparation inputs are excluded from Git.

- Isolate file parsing in a networkless, non-root environment with CPU, memory, process, filesystem and output limits. The development subprocess is not a security sandbox. Do not merely set `PARSER_SANDBOXED=true` without deploying one. `PARSER_RUNNER` accepts a deployment-specific wrapper executable.
- Production startup requires HTTPS, a 64-hex-character encryption key, and an explicit parser-sandbox setting. Configure a reverse proxy with request limits, correct origin, TLS and timeouts.
- Deploy malware scanning/quarantine for originals, update/lock parser dependencies, add retention/erasure workflows and run hostile-file/load tests. These are launch requirements, not accomplished by file-extension checks.
- SQLite/WAL supports this single-host beta. For horizontal scaling, move tenant tables and job leasing to PostgreSQL, object storage to a private bucket with scoped signed URLs, and jobs to a dedicated queue. Do not run multiple workers against a network-mounted SQLite file.
- Test OAuth, email delivery, billing reconciliation and AI end to end in provider test environments. Configure billing portal, retry webhooks and verify plan downgrades preserve existing work.
- Provision wildcard/custom-host routing and TLS. Domain ownership verification exists; automatic domain hosting/TLS and subdomains are **not provisioned** by the current code. Links currently use `/s/<slug>`.
- Add monitoring, backup/restore drills, admin/support tooling, incident procedures, accessibility audit, legal documents and consent/retention policies appropriate to the launch.
- Complete production engineering listed in DELIVERY-STATUS.md. Editor, preview and publication now share a renderer; local test success does not establish launch readiness.

