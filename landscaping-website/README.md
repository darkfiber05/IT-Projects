# College Bound Landscaping Service — Business Website

**Live site:** https://bucolic-madeleine-420f7f.netlify.app

## Overview
A full digital storefront built for a real landscaping business, replacing a manual/no-website workflow with an automated lead-to-inbox pipeline.

## Features
- Responsive marketing site (services, pricing, service area, contact)
- Quote request form that writes directly to a Supabase (Postgres) database
- Row Level Security policies allowing public inserts while protecting read access
- Supabase Edge Function + Resend integration that emails the business owner instantly on every new submission
- An internal "AI email dashboard" tool that pulls all submissions from the database and generates ready-to-send response drafts (quote, confirmation, follow-up, unavailable) using smart templates, with one-click send via Gmail

## Stack
- **Frontend:** HTML, CSS, JavaScript
- **Database/Backend:** Supabase (Postgres, Edge Functions)
- **Email:** Resend (transactional email API)
- **Hosting:** Netlify

## My Role
Designed the site end-to-end (branding, layout, copy), built and debugged the database integration (schema design, RLS policies, API wiring), and built the internal dashboard tool used to manage and respond to customer leads.

*Source files to be added.*
