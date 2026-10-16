# Delivery status — 16 October 2026 · v0.14.1 local beta

## Signature motion — review round 03

The landing page now uses one persistent, recomposing portfolio scene instead of swapped thumbnail panels, plus a native-scroll exhibition of three supplied artworks. Typography, portrait and artwork frames change layout together; Replay and motion-off behavior are available. The scroll exhibition has three selectable stops and a static accessible layout when motion is disabled. 38 tests pass, including four motion-path/asset checks; browser QA covered rapid changes, interruption, keyboard stops and widths from 320 to 1280 pixels. See [round 03](reviews/03-SIGNATURE-MOTION.md) and its actual browser capture. Visual acceptance is pending.

## Interface direction — review round 02

Original reference-led landing page, public exploration of the 20-template catalog, switchable mood preview, shared studio navigation and visual controls, responsive setup/auth/gallery treatment, first motion pass on Noir/Solstice/Signal, and chapter navigation for long project stories. 34 product tests pass; browser review covered mobile, tablet, desktop, light/dark, filters, search, template return paths and case-study chapter navigation. Visual acceptance remains pending. See [round 02](reviews/02-INTERFACE-DIRECTION.md). This is a local UI update; the production limitations below still apply.

This distinguishes working local features, adapters awaiting service accounts, and remaining production engineering. It is not a launch certification.

## Implemented and exercised locally

- Review round 01: five-step first-use setup, required role/goal/one-or-two visual personalities/name/title, optional profile details and work import, persisted Back/Continue/Finish later, resume after sign-in, exactly three preference-based template recommendations and a working View all 20 link. Template trials retain setup context, examples are opt-in, and completion opens the existing editor with the owner's content. Older accounts are not forced through setup. Google sign-in remains hidden when unconfigured.
- 32 tests passed on 16 October, including six setup-rule tests and an authenticated setup-to-private-preview integration test. Browser QA on an isolated hostname/database covered signup, keyboard selection, limits, saved progress, optional skipping, template preview/back, all templates, owner-only completion, disconnected-save recovery, and desktop/tablet/mobile light/dark layouts. Visual acceptance is pending; see [REVIEW-BOARD.md](REVIEW-BOARD.md) and [round 01](reviews/01-FIRST-USE.md).
- Full template preview and a return-to-templates link, without changing the account's chosen template or projects. Owner-content trials are also read-only.
- Back to edit in editor previews, including returning to the project editor that opened the preview. Colors are available in the existing editor side panel.
- Six palette presets, editable background/text/accent/surface, and local extraction from PNG/JPG/WebP/GIF or PDF. Review precedes applying; palette saves use revision checks and remain editable. Extraction is authenticated, origin-checked, limited to six requests/minute, two concurrent processes, 8 MB images/20 MB PDFs, eight sampled PDF pages and 25 seconds. No paid AI calls or outbound image analysis.
- All 20 examples now use Mikha Gerges's supplied profile and an AI-generated streetwear portrait; headings use sans-serif. Real artwork replaces fictional template projects. The supplied Drive folder's 210 files are represented in 14 complete project/collection stories, including 61 complete PDF pages, source-ordered carousels, animated GIFs and 21 original MP4s. PDFs remain full page artwork; case-study chapters follow the supplied brand presentations. Original working copies are retained in the ignored reference-work directory; curated derivatives are served as example artwork.
- Six featured collections keep the example homepages concise. The Work page contains all 14 collections. Counts describe the supplied collections, not an invented lifetime project total. The user's 235 satisfied clients, five years, six countries, software and contact details are included. Existing account content is preserved when applying a layout.
- 25 integration/security tests passed, including local palette extraction/cleanup/limits, non-mutating template previews, every source file represented, complete PDF page ordering, safe example routes, palette validation and MP4 byte-range playback.
- Dashboard redesign and simple project-editor UI from the rejected v0.15 iteration were rolled back on 9 October 2026. The previous dashboard, profile form, project library/editor and Noir composition are restored; existing workspace content is retained. Full Preview inside the template remains available.
- Browser verification: independent full preview, image/PDF palette extraction, palette save and reset, returning to both portfolio and project editing, saved palette appearing in the editor side panel, and a 390px layout with two project columns and no horizontal overflow. Existing review-account projects were preserved; legacy samples already copied into an account are not silently overwritten.

- Registration/sign-in, scrypt passwords, hashed HttpOnly sessions, origin checks, rate limits, tenant-scoped workspaces/private media and optimistic save conflicts.
- Short two-field onboarding, three-step creation journey, 20 populated templates with visual/search/category filters, temporary previews using owner content, light/dark studio, project search/duplicate/archive, usage and plan comparison. See DESIGN-REFERENCES.md for the 12 reference-inspired directions plus collage and freehand/sketch.
- One presentation renderer for editor, owner preview, review links and published pages. Ordered sections, dedicated Work/About/Contact pages, cinematic layered hero, motion/reveal/counters, scrolling clients and project slider, multi-column uncropped covers and complete case-study images.
- Click-to-edit selects the existing side panel without a popup. Applying a template opens a simplified editor for name, headline/professional title, image and projects; more controls remain available. Personal-brand controls, independent portrait/background uploads, client names/logos, countries and metrics.
- PDF page/text extraction; ZIP/folder/image import; resumable 2 MB chunks with checksums; durable jobs, cancellation, progress, bounded retries and unsupported-file notices.
- Mandatory review: metadata, merge/split, project/visual ordering, reassignment/removal, structural undo and independent cover selection. Commit is atomic/idempotent; imported projects start Draft/Private.
- Google Drive background copy, bounded traversal, native Docs/Slides/Drawings PDF export and completed-file checkpoints. Verified with a fake provider, not live Google.
- Publication snapshots, expiring review links, SEO/OG/favicon/language, Free branding enforcement and Pro sharing-image controls and Solo/Pro branding removal, unpublish and media access checks.
- Pro password-protected projects with expiring grants; private PDF CV attachment; actual page views, top projects, traffic sources, contact/CV events, inquiry inbox and data export.
- Monthly/annual plan display and enforced project/storage/AI limits. Secrets are read by the server from environment settings; frontend receives availability flags.
- 23 integration/security tests passed on 9 October: extraction completeness, tenant isolation, CSRF, conflicts, snapshots, protected media, resume/checksums, Drive retry checkpoints, shared rendering, cover selection, all 20 template pages/stories, sample privacy/preservation and non-mutating owner-content trials.
- Browser checks: complete 27-page HAZA import/review/draft, persisted preview name editing, personal-brand/client controls, real background upload, billing intervals, style previews, dark theme and 390px layouts. A separate local review account was used.

## Adapters requiring accounts and live verification

- OpenAI multimodal grouping/writing: optimized images, structured output, light/strong routing, cache and durable call budgets. Model quality and real costs still need evaluation.
- Google sign-in/Drive OAuth with encrypted tokens, PKCE and session-bound state. Drive is disabled pending configuration and applicable scope verification.
- Resend verification/recovery/inquiry email.
- Stripe Checkout/Portal, monthly/annual price IDs and signed idempotent webhooks; merchant eligibility and reconciliation remain unverified.
- Adobe Fonts integration accepts an official Web Project stylesheet. The Acumin catalog link is not that URL.
- Domain TXT ownership verification; hosting/routing/TLS remain separate unfinished work.

## Remaining production engineering

- Original video ingestion/transcoding, animated GIF preservation beyond the explicitly noted first frame, embedded PDF-object extraction and offline OCR. Full PDF page artwork is retained now.
- Cloud object storage, PostgreSQL/distributed queue, multi-host worker recovery and load testing. This beta uses SQLite and one leased worker on one host.
- Enforced isolated parser deployment, malware scanning/quarantine and dependency/security review. A Python subprocess is not a security sandbox.
- Retention/erasure, account deletion, admin/support tooling, monitoring/alerts, automated encrypted backups and tested restoration.
- Currency-based AI accounting in addition to call/token ceilings and provider spending controls.
- Custom-host/subdomain routing and TLS, provider end-to-end tests, broad accessibility/browser/abuse audit and deployment operations.

Behance import is unavailable until a stable compliant integration is established. No scraping is used. Original prototype files were not overwritten; the beta does not automatically migrate the original Mikha workspace.


## Visual onboarding update — v0.12

- Six image-based personality cards, keyboard-accessible and limited to two selections.
- Exact brand artwork recoloured beige on transparent dark backgrounds, including the editor.
- Six populated, navigable template examples: Aire, Folio, Signal, Afterhours, Exhibit and Studio. Desktop/mobile preview, project index and three editable fictional case studies.
- Applying a template preserves existing profile fields/projects. Optional samples become private drafts, respect project quotas and are not added twice. New empty portfolios default to including samples.
- 22 integration tests passed. Browser verification covered selection limits, logo appearance, responsive cards, case-study navigation, template application preserving HAZA, loaded sample artwork and editing a sample story.
