# Code Standards

## Language Rules

- **Pure JavaScript only** — no TypeScript, no JSX compilation
- **ES modules** — use standard `import`/`export` syntax
- **ES2018+** features are fine; keep browser compatibility in mind
- Use `globalThis` instead of `window`
- Single quotes, no semicolons (where avoidable), prefer functional patterns
- Prettier is the formatter — run `npm run lint:fix` to auto-fix

## Component Architecture

All web components extend LitElement and must inherit from `DDDSuper` for DDD design system integration:

```js
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { LitElement, html, css } from "lit";

class MyElement extends DDDSuper(LitElement) {
  // ...
}
customElements.define('my-element', MyElement);
```

HAXcms themes extend `HAXCMSLitElement`:

```js
import { HAXCMSLitElement } from "@haxtheweb/haxcms-elements/lib/core/HAXCMSLitElement.js";
```

## DDD Design System

- **Location**: `elements/d-d-d/`
- Use DDD CSS custom properties for all fonts, colors, spacing, padding, margins
- Never hard-code design values — always use tokens (e.g., `var(--ddd-spacing-4)`, `var(--ddd-theme-primary)`)
- Run `hax audit` from the component root before submitting to verify DDD compliance
- Files listed in `.dddignore` are excluded from audits

## Naming Conventions

- Web components: hyphenated lowercase (`my-element`, `a11y-tabs`)
- Package names in `package.json`: match the component name
- CSS: follow BEM when not using DDD tokens
- Files: component source in `src/` or `lib/` subdirectories

## HAX Integration

Include `haxProperties` in any component intended for HAX authoring:

```js
static get haxProperties() {
  return {
    canScale: true,
    canPosition: true,
    canEditSource: false,
    gizmo: { ... },
    settings: { ... },
  };
}
```

Use the `--writeHaxProperties` flag when scaffolding: `hax webcomponent my-element --writeHaxProperties`

## Third-party Libraries

Always import from the pre-compiled JavaScript distribution — never from TypeScript source:

```js
// ✅ correct
import '@vaadin/upload/vaadin-upload.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

// ❌ wrong — TypeScript source
import '@shoelace-style/shoelace/src/components/button/button.ts';
```

## Internationalization

All components should wire i18n from the start. The `hax webcomponent` scaffold includes this automatically.

## custom-elements.json

This file is **auto-generated** by the build — never edit it manually. Run `yarn run build` to regenerate it.
