# phreaknic — Agent Guide

## Structure

This is a **static site** (no build tools, no framework) for the phreaknic hacker conference.

```
index.html          — Main entry; contains all views (news/schedule/speakers) and modal templates
styles.css          — Single CSS file; cyberpunk aesthetic via CSS custom properties
script.js           — Single IIFE; handles data loading, view switching, modals, hash routing
speakers.json       — Speaker data (id, name, topic, initials, bio[], social links)
topics.json         — Schedule topics (id, title, date, time, room, speaker_ids[], description?)
fonts/              — Orbitron (display) + Share Tech Mono (body)
README.md           — Short project description
```

## Conventions

- **No build system** — pure HTML/CSS/JS, no package.json, no bundler, no framework.
- **Vanilla JS (ES5 style)** — IIFE wrapper, `'use strict'`, `var` (no `let`/`const`), function expressions, no modules.
- **CSS custom properties** for theming: cyan (`#00f0ff`) / magenta (`#ff00ff`) palette, dark background (`--bg-primary`).
- **Hash-based SPA routing**: `#news`, `#schedule`, `#speakers`, `#speakers/<id>`, `#topics/<id>`.
- **Routing flow**: `parseHash()` reads the URL hash and returns a route object; `navigateTo(route)` applies the route (switches view, opens modals if needed). `popstate` listener handles back/forward navigation.
- **Modal hash management**: each modal (`openSpeakerModal` / `openTopicModal`) saves the current hash into `lastHashBefore*` before opening, then restores it on close via `history.pushState`. If the modal was never opened (e.g., called as cleanup in `navigateTo`), the close functions must not push any state — they should only restore when `lastHashBefore*` is truthy.
- **Data linking**: `topics.json` entries reference speakers via `speaker_ids[]`; `speakers.json` has display-only `topic` string (not linked by ID).
- **Modals**: two overlays — speaker detail (avatar, bio, social links) and topic detail (description).
- **Responsive**: fixed sidebar collapses to icon-only on mobile (≤768px).
- **Countdown** to event date (`2026-11-06T09:30:00-06:00`) in header.
- **No linting/testing config** — no test framework, no CI.
