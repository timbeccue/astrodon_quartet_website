# Astrodon Quartet Website

See [AGENTS.md](AGENTS.md) for full project context: tech stack, file structure, data schemas, key patterns, and deployment notes.

## Critical: CSS Build Step

After changing any Tailwind classes in HTML or JS files, run:

```bash
npm run build:css
```

This compiles `assets/css/tailwind-input.css` → `assets/css/styles.css`. The site uses **compiled Tailwind** — not the CDN.
