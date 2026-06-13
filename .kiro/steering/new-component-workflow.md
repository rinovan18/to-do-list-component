# New Component Workflow

## Scaffolding

Create a new component from the monorepo root:

```bash
hax webcomponent my-element --y
```

With HAX authoring properties:

```bash
hax webcomponent my-element --writeHaxProperties --y
```

The scaffold places the component in `elements/my-element/` and wires up:
- LitElement base with `DDDSuper` mixin
- i18n support
- `package.json` with `@haxtheweb/` scope
- `custom-elements.json` stub (gets overwritten by build)
- `.dddignore` template

## Component File Structure

```
elements/my-element/
├── my-element.js          # main component source
├── lib/                   # optional: sub-components, mixins
├── src/                   # optional: additional source files
├── demo/                  # demo HTML for local testing
├── test/                  # unit tests
├── custom-elements.json   # AUTO-GENERATED — do not edit
├── package.json
├── .dddignore
└── node_modules/
```

## Minimal Component Template

```js
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { LitElement, html, css } from "lit";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";

class MyElement extends I18NMixin(DDDSuper(LitElement)) {
  static get properties() {
    return {
      ...super.properties,
      label: { type: String },
    }
  }

  constructor() {
    super()
    this.label = ''
  }

  static get styles() {
    return [
      super.styles,
      css`
        :host {
          display: block;
          font-family: var(--ddd-font-primary);
          padding: var(--ddd-spacing-4);
        }
      `,
    ]
  }

  render() {
    return html`<div>${this.label}</div>`
  }

  static get haxProperties() {
    return {
      canScale: true,
      canPosition: true,
      canEditSource: false,
      gizmo: {
        title: 'My Element',
        description: 'A custom element',
        icon: 'icons:android',
        color: 'orange',
        tags: ['Content'],
      },
      settings: {
        configure: [
          {
            property: 'label',
            title: 'Label',
            inputMethod: 'textfield',
          },
        ],
        advanced: [],
      },
    }
  }
}

globalThis.customElements.define('my-element', MyElement)
```

## After Creating a Component

1. `cd elements/my-element`
2. `npm install`
3. `yarn run build` — generates `custom-elements.json`
4. Open `demo/index.html` in a local server to test
5. `hax audit` — verify DDD compliance before opening a PR

## HAXcms Theme Workflow

```bash
hax site --custom-theme-name my-theme --custom-theme-template base
```

Template options: `base`, `polaris-flex`, `polaris-sidebar`

Themes must extend `HAXCMSLitElement`:

```js
import { HAXCMSLitElement } from "@haxtheweb/haxcms-elements/lib/core/HAXCMSLitElement.js";

class MyTheme extends HAXCMSLitElement { ... }
```

Always run `yarn run build` after editing a theme — it regenerates `custom-elements.json` which HAXcms requires.
