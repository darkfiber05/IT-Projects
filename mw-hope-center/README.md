# MW Hope Center — Website Redesign

Full website redesign for MW Hope Center, a nonprofit in Tucker, GA serving
families, youth, and returning citizens across DeKalb and Gwinnett counties.

**Client:** MW Hope Center (College Bound Web Services project)
**Scope:** 20-page custom site, 4 integrated forms (Jotform), embedded
donation platform (Zeffy), full SEO and accessibility remediation.

## Stack
- Static HTML/CSS/JS (no framework, no build step)
- Supabase (PostgreSQL) + Deno Edge Functions for backend form handling
  (schema and function code in `/backend`)
- Jotform embeds for Volunteer, Get Help, and Contact intake
- Zeffy embed for donations

## Structure
- `index.html` + 19 other pages — the full site
- `css/`, `js/` — shared stylesheet and behavior (mobile nav, dropdowns,
  form handling, donation tier UI)
- `images/`, `videos/` — WebP-optimized photos and the compressed hero video
- `backend/` — Supabase schema and notification Edge Function (reference
  code; not yet deployed to a live project)

## Live demo
Open `index.html` directly in a browser — no server or build step required.
