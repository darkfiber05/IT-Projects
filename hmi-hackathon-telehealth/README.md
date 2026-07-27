# HMI Hackathon — Asynchronous Telehealth Platform

**Live app:** https://ai.studio/apps/6921a4a0-b430-4eb8-ab46-018c9ffa95cd

## Overview
An asynchronous telehealth platform built for the HMI Hackathon (Track 3: Open Innovation), addressing a real access problem in healthcare: patients often can't get timely care because telehealth is limited to scheduled live video calls. This prototype lets patients submit symptoms, photos, and health data for providers to review asynchronously, cutting wait times and increasing provider capacity.

## Problem Statement
Many patients can't access care quickly because telehealth relies mostly on scheduled video calls, which limits how many patients doctors can see.

## Approach
Build an asynchronous, triage-driven platform where patients submit structured symptom data (with photos) that gets triaged and routed to providers, who respond via async messaging or escalate to a live call when needed.

## Key Features

### Patient View
- Language selection (English/Spanish for MVP)
- Structured + free-text symptom intake
- Photo upload (rash, throat, wound, etc.)
- Automated triage result: Urgent / Soon / Routine / Self-care
- Async chat thread with AI + human provider messaging
- **Drone delivery scheduling:** patients can schedule a supply/prescription delivery independent of a new symptom report, with GPS tracking (live map of the drone en route, similar to a rideshare tracker), estimated time of arrival, ship date, and delivery date

### Doctor/Provider View
- ID and medical license verification
- Providers select which regions they're licensed/comfortable to consult in, and whether they're bilingual
- Inbox queue sorted by urgency with SLA countdown
- Structured case view: symptoms, duration, red flags, meds/allergies, photos, vitals
- AI-generated risk flags and suggested follow-up questions (AI assists the **provider only** — never gives the patient a diagnosis directly; the doctor reviews and compares AI suggestions against their own expertise before advising the patient)
- Can request drone delivery of medication/test kits to the patient, and request drones bring back completed test samples
- "Shopping" page for ordering supplies/medication for delivery

### Interactive Body Pain Map
A custom SVG-based interactive human body diagram (front + back views) used for symptom intake, styled like a sports-medicine muscle anatomy chart:
- Each body region (e.g. `left_knee`, `right_shoulder`, `left_glute`) is an individually clickable SVG path
- Tapping a region opens a 1–10 pain intensity slider
- Multiple regions can be selected simultaneously, each with independent pain state
- Selected regions are colored on a heat-map scale (1–3 light yellow → 4–6 orange → 7–8 dark orange → 9–10 bright red)
- Built for mobile touch interaction

### Interactive 3D Region Globe
A rotating, draggable 3D globe (built with D3.js + TopoJSON) used for providers to select which regions they're licensed to serve:
- Orthographic projection rendered on HTML5 Canvas
- Auto-rotates when idle, drag-to-rotate interaction
- Interactive region markers that highlight when selected
- World geometry loaded from a public TopoJSON CDN dataset

## Stack
- Google AI Studio app (React/TypeScript components)
- D3.js + TopoJSON for the 3D globe visualization
- Custom SVG for the interactive body pain map

## My Role
Designed the full patient/provider workflow and drone-delivery tracking UX, wrote the technical specification for the interactive SVG body pain selector (region segmentation, color-scale logic, state management), and implemented the 3D globe region-selection component.
