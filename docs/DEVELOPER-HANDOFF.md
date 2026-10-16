# Developer handoff

## Start here

Read the root README, start the application on port 4180, and open the landing page and `/#templates`. This repository is the current product, including the interface and animation changes from 16 October 2026.

The owner wants both the SitoFolio interface and its templates to feel more distinctive, starting with the interface. The previous feedback was that the animation still felt generic. The latest pass introduces a shared portfolio composition that rearranges its portrait, type and artwork between Noir, Solstice and Signal, plus a sticky native-scroll exhibition of three real artworks. These scenes are ready for review; they are not a completed motion redesign of all 20 templates.

## Review the current experience

1. Switch between Noir, Solstice and Signal on the landing page, including rapid changes. Try Replay and toggle motion off during a transition.
2. Scroll through the artwork exhibition and use its three stop buttons. Native scrolling must remain available.
3. Explore all 20 templates, their return links, and case-study chapter navigation. Noir, Solstice and Signal have the first additional portfolio-motion pass.
4. Create a local account, complete or resume setup, choose a template, and open the editor and preview with your own content.
5. Check narrow and wide layouts, light/dark themes, keyboard navigation and OS reduced-motion preferences.

The reference sites guide pacing, composition and interaction, not asset or source copying. Links are collected in [DESIGN-REFERENCES.md](../product/DESIGN-REFERENCES.md). Earlier review notes are in `product/reviews/`; their private local screenshots and recordings are intentionally absent.

## Implementation boundaries

- The UI is vanilla JavaScript and CSS; no framework build is required.
- Keep `prototype/dist/` beside `product/`: the server uses its editor, model and styles. It is a compatibility dependency, not the application entry point.
- Editor, template examples, preview and published portfolio snapshots use the shared renderer in `product/presentation.mjs`.
- Keep account isolation, explicit import review and explicit publication. Template trials must not change the owner's saved template or work.
- Respect motion-off and reduced-motion settings, preserve keyboard access, and clean up listeners/animation frames on route changes.
- Static files are explicitly allowlisted in `product/server.mjs`. Add new public runtime assets there when needed; keep private data outside `product/web/`.
- The example manifest is `product/example-work.public.json`. Its 210 local source identifiers preserve collection completeness without sharing original Drive metadata. Private source preparation scripts and originals are not part of this repository.

## Provider and deployment work

Local UI review needs no external accounts. Google OAuth/Drive, AI, transactional email, billing and Adobe Fonts require their own configuration and live testing. Never commit their credentials.

Before accepting public users, finish the production requirements in [SETUP.md](../product/SETUP.md) and [DELIVERY-STATUS.md](../product/DELIVERY-STATUS.md), including isolated file parsing, persistent private storage, a managed worker, backups, HTTPS and provider checks. Publishing this repository does not deploy the website.
