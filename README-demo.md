# Chauhan Realty & Associates — Cinematic Demo

A premium, award-style single-page experience for the homepage. Buildless (no
bundler, no install) so it runs instantly — but it **must be served over http**
(ES modules + import maps don't work from `file://`) and needs internet for the
CDN libraries.

## Run it

```bash
python -m http.server 5500
```

Then open **http://localhost:5500/** — (in Claude Code you can also launch the
`chauhan-demo` preview from `.claude/launch.json`).

Tip: the cinematic intro plays once per browser session — hard-reload
(Ctrl+Shift+R) or a new tab to see it again.

## What's in it

| File | Role |
|------|------|
| `index.html` | The new cinematic homepage (12 scenes) |
| `css/premium.css` | Full architectural design system (charcoal / cream / bronze / muted green) |
| `js/premium.js` | Core UX — preloader, custom cursor, nav, reveals, before/after, journey, video, testimonials, project modal. Works with **zero dependencies**. |
| `js/scene3d.js` | Isolated Three.js architectural "massing" for the brand section |
| `assets/img/` | Optimized responsive WebP (built from the phone originals) |
| `assets/video/` | Browser-ready hero video + poster |
| `scripts/optimize_media.py` | The media pipeline (Pillow): EXIF-fix → crop → resize → WebP + curation/renaming |

**Enhancement libraries** (loaded from CDN via the import map, all optional —
the page degrades gracefully if any fail): GSAP + ScrollTrigger, Lenis, Three.js.

## Media pipeline

Originals were 1.5–8 MB phone photos (~82 MB total). `optimize_media.py`:
- normalizes EXIF rotation, crops out clutter (e.g. the marker note in the bathroom shot),
- resizes to `480 / 960 / 1600 / 2400`-wide WebP (`assets/img/`),
- renames to clean semantic names.

Result: **82 MB → 15.5 MB**, lazy-loaded with `srcset`. Re-run any time:

```bash
python scripts/optimize_media.py
```

## Known follow-ups (for the production pass)

- **4K `.MOV` clips** (`videos/IMG_6185.MOV`, `IMG_6187.MOV`) aren't used — they
  won't play in browsers and can't be transcoded here (no ffmpeg). Convert to
  720p/1080p H.264 + WebM once ffmpeg is available, then add to the film section.
- **Stats & testimonials** are marked placeholders — swap in verified numbers/quotes.
- **Social links** are `#` placeholders.
- The inner pages (`about/services/projects/contact.html`) are still the original
  design — to be rebuilt in the same language after the homepage is approved.
