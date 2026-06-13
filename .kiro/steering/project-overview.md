# HAX Webcomponents — Project Overview

This is the `webcomponents` monorepo — the core of the HAX (Headless Authoring eXperience) ecosystem. It contains 250+ LitElement-based web components, themes, and the DDD design system.

## Repository Structure

```
webcomponents/
├── elements/           # All individual components (~250+)
│   ├── d-d-d/          # DDD design system (source of truth for tokens)
│   ├── haxcms-elements/# HAXcms theme base classes
│   ├── clean-two/      # Example HAXcms theme
│   └── [component]/    # Each component is its own package
├── api/                # SSR hydration helpers
├── dist/               # Build output (do not edit manually)
└── build.js / build-haxcms.js  # Root build scripts
```

Each element under `elements/` is an independent npm package with its own `package.json`, `node_modules`, and build config.

## Core Principles

- **Accessible** — WCAG 2.0 AA, automated contrast, expert-audited
- **Unbundled** — Pure JS/HTML/CSS, no compilation step, ships as native ES modules
- **DDD-first** — All components use DDD design tokens for fonts, colors, spacing
- **Platform agnostic** — Works standalone, in HAXcms, or any CMS
- **No TypeScript** — Ever. Import only pre-compiled JS distributions of third-party libs

## Package Scope

All internal packages use the `@haxtheweb/` npm scope (e.g., `@haxtheweb/simple-icon`).
