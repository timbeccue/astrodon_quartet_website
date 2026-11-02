# Astrodon Quartet Website — Agent Reference

## Project Overview

Static website for the Astrodon Quartet, a professional string quartet in Baltimore, MD. The site showcases concerts, musician bios, community outreach work, and contact info.

**Production URL**: https://www.astrodonquartet.com  
**Deployed on**: Cloudflare Pages (www + extensionless canonical URLs)  
**Git remote**: `git@github.com:timbeccue/astrodon_quartet_website.git`

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| Markup | HTML5 | One file per page |
| Styles | Tailwind CSS v3 | **Compiled locally** — not CDN |
| Fonts | Google Fonts | Manrope (body), Fugaz One (hero display) |
| Icons | Lucide (CDN) | `lucide.createIcons()` after DOM updates |
| JS | Vanilla ES6+ | No framework, no bundler |
| Data | JSON files | Editable without code changes |
| Build | npm + Tailwind CLI | Node.js required |

### CSS Build Step

Tailwind is compiled, not CDN-loaded. **Run `npm run build:css` after any HTML/class changes.**

```bash
npm run build:css   # compiles tailwind-input.css → assets/css/styles.css (minified)
```

Config lives in `tailwind.config.js` (scans `*.html`, `components/*.html`, `*.js`, `components/*.js`).  
Input: `assets/css/tailwind-input.css` → Output: `assets/css/styles.css` (linked in every HTML page).

### Running Locally

Requires a local server for `fetch()` to work:

```bash
python3 -m http.server 8000
# or: npx serve
```

Then open `http://localhost:8000`.

---

## File Structure

```
/
├── index.html             # Homepage: hero animation, featured concert
├── about.html             # Quartet + individual bios, MVV fellowship info
├── concerts.html          # Full concert calendar + audience testimonials
├── community.html         # Outreach and education activities
├── media.html             # Photo gallery, press materials, videos
├── contact.html           # Contact form / booking info
├── utils.js               # Shared: formatDate, parseConcertDateTime, sortConcertsByDateTime, injectConcertSchema
├── concerts.js            # Concerts page: filter/sort/render logic
├── community.js           # Community page: filter/sort/render logic
├── tailwind.config.js     # Tailwind content paths + font config
├── robots.txt             # SEO crawl rules
├── sitemap.xml            # SEO sitemap
├── package.json           # npm: tailwindcss devDependency + build:css script
├── components/
│   ├── components.js      # Injects navbar + footer on every page
│   ├── navbar.html        # Shared nav
│   └── footer.html        # Shared footer
└── assets/
    ├── css/
    │   ├── tailwind-input.css   # @tailwind directives (source)
    │   └── styles.css           # Compiled output (committed, don't edit directly)
    ├── data/
    │   ├── concerts-data.json   # Concert listings
    │   ├── outreach-data.json   # Community events
    │   └── quotes-data.json     # Audience testimonials (used by concerts.html)
    ├── images/            # WebP preferred, .jpg fallback
    └── favicon/           # Browser icons + site.webmanifest
```

---

## Data Schemas

### concerts-data.json / outreach-data.json

Both use the key `"concerts"` (not `"events"`):

```json
{
  "concerts": [
    {
      "name": "Event Name",
      "date": "YYYY-MM-DD",
      "time": "H:MM AM/PM",        // optional
      "location": "Venue, City, ST",
      "google-maps": "https://...", // optional
      "info": "https://...",        // optional
      "note": "Special note",       // optional
      "admission": "free",          // optional: "free" | "tickets" | "rsvp" — renders a badge on the concert card; "free" also sets isAccessibleForFree in JSON-LD
      "featured": true,             // optional: homepage shows the soonest upcoming featured concert, or the soonest overall if none are flagged; no effect in outreach-data.json
      "description": "1-2 sentences about the event",  // optional
      "program": [                  // optional
        { "composer": "Franz Schubert", "work": "Death and the Maiden" }  // "work" optional; if any item has one, program renders as a list instead of an inline composer row
      ],
      "partner": {                  // optional partnership credit
        "text": "Presented in partnership with ...",
        "logo": "assets/images/partner-logo.webp"  // optional
      }
    }
  ]
}
```

On the concerts page, each card shows a compact date block (month / day / weekday) beside the concert name. Upcoming events are a flat list with the soonest one rendered as a highlighted "Next Concert" card at the top; past events are grouped under month headings. When a concert has `info`, the whole card opens that link in a new tab through an "Event details" link whose `::after` stretches over the card; other controls in the card sit above it with `relative z-10`. Cards without `info` have no hover effect. Each upcoming concert card also gets an "Add to calendar" button that opens a small dropdown with a Google Calendar link and an .ics data-URI download, generated client-side in `concerts.js` from the date/time/location fields using floating (venue-local) times.

### quotes-data.json

```json
{
  "quotes": [
    { "text": "Quote text here." }
  ]
}
```

---

## Key Patterns

### Automatic Event Sorting

`utils.js` exports `sortConcertsByDateTime(events)` — returns `{ upcoming, past }`. Upcoming sorted chronologically (earliest first); past sorted reverse chronologically (most recent first). Used by `concerts.js` and `community.js`. No manual "upcoming"/"past" categorization needed in JSON.

### Component Loading

`components.js` fetches and injects `navbar.html` + `footer.html` asynchronously on every page. Must load before page scripts. Navbar height is calculated with a `setTimeout(..., 50)` delay to ensure the injected HTML is rendered first.

### Lucide Icons

Always call `lucide.createIcons()` after any dynamic DOM update that introduces icon elements.

### Homepage Scroll Dissolve

Scroll-triggered image dissolve effect with device-adaptive container heights:
- Mobile/touch: `275vh`
- Desktop/mouse: `400vh`

Device detection: `('ontouchstart' in window) || (navigator.maxTouchPoints > 0)` + `window.innerWidth < 768`.

### HTML Page Template

Every page follows this head structure:

```html
<title>Page Name | Astrodon Quartet</title>
<meta name="description" content="...">
<link rel="canonical" href="https://www.astrodonquartet.com/<page>">
<!-- Open Graph + Twitter blocks (same title/description, www extensionless URLs) -->
<link rel="stylesheet" href="assets/css/styles.css">
<!-- Google Fonts (Manrope + Fugaz One) -->
<script src="https://unpkg.com/lucide@latest"></script>
<script src="components/components.js"></script>
<!-- page-specific scripts -->
```

**Canonical URL rule**: always `https://www.astrodonquartet.com/<page>` — www host, no `.html` extension (Cloudflare Pages redirects the apex domain and `.html` URLs to this form). Applies to canonicals, og:url, twitter:url, and `sitemap.xml`. When adding a page, add it to `sitemap.xml`.

### Email Signup (Kit)

`concerts.html` embeds the Kit form inline with a one-line script (`data-uid="c8c41a4f69"`). The footer's "Join our mailing list" link opens the same form in a `<dialog>` modal, with `components.js` loading Kit's script on first open; on pages where the form is already inline, the link scrolls to it and blinks an outline around it instead, so Kit's script never runs twice on a page. The form's text, colors, and custom CSS are all managed in Kit, and edits there appear on the site without a code change. Subscribers are stored in Kit.

### SEO Structured Data (JSON-LD)

- **MusicGroup**: static `<script type="application/ld+json">` block duplicated in the heads of `index.html` and `about.html` (members, socials, location). If member info changes, update both.
- **MusicEvent**: generated at runtime from `concerts-data.json` by `injectConcertSchema(upcoming)` in `utils.js` — called by `concerts.js` and the homepage's inline concert script. Stays in sync automatically when concert data changes.

---

## Content Notes

- **Fellowship**: Individual bios on `about.html` reference Mount Vernon Virtuosi (MVV) fellowship. The fellowship section was removed from `index.html` homepage as of commit `67404be`.
- **Concert data**: Schedule through ~August 2026 as of last update.
- **Testimonials**: Audience quotes in `quotes-data.json`, displayed on concerts page (currently hidden via `hidden` class).
- **Open Graph / Twitter Card**: Meta tags + meta description + canonical on all pages; cover image at `assets/images/site-preview.jpg`. See "HTML Page Template" above.
- **Structured data**: See "SEO Structured Data (JSON-LD)" above.

---

## Deployment

- Host: Cloudflare Pages — **no build step configured there**; the site deploys as-is
- CSS is built locally with `npm run build:css` and the compiled `assets/css/styles.css` is committed
- Node version: 22 (use the nvm path, e.g. `~/.nvm/versions/node/v22.8.0/bin`; the default shell Node is v14)
- No server-side code; purely static
- SEO files: `sitemap.xml` + `robots.txt` in the deploy root; submit sitemap via Google Search Console after domain changes
