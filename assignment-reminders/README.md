# Assignment Reminders — Deadline Tracker & Automated Notifications

## Overview
A tool I built to help the students I keep on track with their coursework. Students were missing assignments because nothing on their phone told them a deadline was coming, so I needed two things: notifications that reach the student automatically, and one view where I can see every upcoming deadline and follow up.

I took a semester's worth of D2L (Brightspace) calendar exports, cleaned them into 20 real deadlines across 5 courses, and built the tool over three iterations.

## Iterations
| Version | What it does | Why I moved on |
|---|---|---|
| **1. Calendar export + tracker page** ([`calendar-export/`](./calendar-export)) | Python script turns the deadline list into an `.ics` file with 3 alerts per event (2 days, 1 day, ~4 hours before), plus a web tracker with countdowns and copy-ready reminder texts | Relied on the student importing the file, and on me sending texts by hand |
| **2. SMS prototype** ([`sms-prototype/`](./sms-prototype)) | Cloudflare Worker + R2 storage, Twilio SMS API, AES-GCM–encrypted credentials, opt-in tracking, delivery-status polling, daily 9 AM scheduled run | Twilio costs money and US carriers require A2P 10DLC registration before texts are delivered |
| **3. Email edition (current)** ([`apps-script-email/`](./apps-script-email)) | Same dashboard rebuilt on Google Apps Script: private web app, Gmail delivery, daily time-based trigger, zero hosting cost | — |

## Current version: features
- Owner-only web app (Google sign-in required), installable on a phone home screen
- Multiple students, each with their own courses and completion checklist
- Add, edit and delete assignments; filter by course, status (unfinished, overdue, finished) and search
- Configurable reminder schedule (7, 3, 1 days before, due day, 1 day overdue)
- Daily automated email at 9 AM Eastern that groups everything due into one message per student
- De-duplication so the same reminder is never sent twice; due-day emails skip deadlines that already passed
- Manual "email now", test email, Google Calendar quick-add, and copy-to-clipboard reminders
- Sent/failed email history and remaining daily Gmail quota

## Technical notes
- **Time zones:** all deadlines are stored as UTC and shown in America/New_York, handling the Nov 1 daylight-saving change (EDT to EST)
- **Storage:** state is kept as JSON in Apps Script Script Properties, split into 8 KB chunks to stay under the 9 KB per-value limit, with `LockService` preventing two saves from overwriting each other
- **Scheduling:** a `ScriptApp` time-based trigger pinned to the Eastern time zone; turning the schedule off removes the trigger
- **Testing:** reminder logic was run in Node against mocked Google services (storage, mail, triggers, date formatting) to check stage matching, de-duplication and DST conversion before deployment
- **Privacy:** no student data, phone numbers, emails or API credentials are included in this repo

## Stack
- **Current:** Google Apps Script (JavaScript V8), HtmlService, GmailApp/MailApp, PropertiesService, time-based triggers
- **Prototype:** Cloudflare Workers, R2 object storage, Twilio Messaging API, Web Crypto (AES-GCM)
- **Data prep:** Python (iCalendar/RFC 5545 generation, `zoneinfo`)
- **Frontend:** HTML, CSS, vanilla JavaScript, responsive mobile layout

## My role
Identified the problem, gathered and cleaned the deadline data from D2L exports, and decided what the tool needed to do. I built the tool with AI coding assistants (Claude and ChatGPT), directing the design, reviewing and testing each version, deploying it, and choosing between SMS and email based on cost and carrier rules.

## Set up the current version
1. Create a project at [script.google.com](https://script.google.com).
2. Paste `apps-script-email/Code.gs` into `Code.gs`. Add an HTML file named exactly `Index` and paste `apps-script-email/Index.html` into it.
3. Deploy as a **Web app**: Execute as *Me*, access *Only myself*.
4. Open the web app URL, add each student's email, send a test, then turn on daily emails.
