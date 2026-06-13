# Contributing & Pull Requests

## Before Starting Work

Check the unified issue queue first — all HAX ecosystem issues are tracked at `haxtheweb/issues`:

```bash
gh issue list
```

Reference the relevant issue number in your commit messages and PR description.

## PR Title Format

```
[component-name] Descriptive title under 70 chars
```

Examples:
- `[simple-icon] Add size property with DDD token support`
- `[clean-two] Fix mobile nav overflow in polaris layout`
- `[d-d-d] Add --ddd-spacing-10 token`

## Pre-commit Checklist

Run these from the component directory before opening a PR:

```bash
npm test          # all tests must pass
npm run lint      # no lint errors
hax audit         # DDD compliance (required for components/themes)
yarn run build    # custom-elements.json is current
```

## Commit Messages

- Clear and descriptive: `Add i18n support to my-element`
- Reference issues: `Fix contrast ratio in dark mode (#142)`
- Include test/doc changes in the same commit when relevant

## PR Description Structure

1. **Summary** — what changed and why
2. **Testing** — how it was tested (local demo, unit tests, hax audit)
3. **Blocked / Notes** — anything incomplete or dependent on other work

## HAXsite PRs

- Test locally with `hax serve` before opening a PR
- Ensure new pages are registered in `site.json` (JSON Outline Schema)
- Content updates must align with the existing page structure

## Code Review Notes

- `custom-elements.json` should always be regenerated via build, never hand-edited
- DDD token usage will be checked — hard-coded design values (colors, spacing, fonts) will be flagged
- TypeScript imports from third-party libraries will be rejected — use `/dist/` JS builds only
- Components without `haxProperties` won't integrate with HAX authoring

## Security Reminders

- Never commit API keys, tokens, or credentials in `package.json`, `site.json`, or any public file
- Validate source URLs when using `--import-site`
- Sanitize user inputs in any component that accepts dynamic content
- Only import from trusted, well-maintained JavaScript distributions
