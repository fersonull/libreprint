# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Walk-in customers** of a neighborhood print/computer shop in the Philippines. Any age, mostly on their own phones over the shop's local network, often in a hurry. Job: send a document to the counter, get a claim code, and know when it's ready.
- **Counter staff** at the same shop, on a desktop or laptop behind the counter. Job: see what's waiting, open and print files, mark jobs done, hand prints to the right person.

## Product Purpose
Replace "send it to our Facebook/email and wait" with a local queue: upload files with print settings, receive a paper-style claim ticket with a code (e.g. PQ-4819), and watch its status live until pickup. Success is a customer who never has to ask "is mine done yet?" and staff who never print the wrong file.

## Positioning
Runs on the shop's own machine and network; no accounts for customers, no cloud. The claim ticket mirrors the physical stub shops already hand out.

## Operating Context
- Customer: phone in hand at or near the counter, sometimes outside the shop on the same Wi-Fi. Tickets are found again by code.
- Staff: a print desk (queue table, per-ticket detail with document preview), a transactions view, and analytics. Signs in with a shared local password.
- Statuses: queued, printing, done, cancelled. Live updates via server-sent events.

## Capabilities and Constraints
- Upload PDF, DOCX, PNG, JPG; 50 MB per file, 100 MB total.
- Per-file settings: paper size, copies, color/B&W, orientation, sidedness, page ranges; notes.
- English and Filipino (EN/FIL toggle); light and dark themes.
- Next.js 16 app router, Tailwind v4, lucide icons, recharts.

## Brand Commitments
- Name: **libreprint**, lowercase. Keep the existing folded-sheets logo mark (`components/logo.tsx`).
- Keep the EN/FIL toggle and dark mode in the header.

## Evidence on Hand
No customer testimonials, shop names, or real photos exist. Do not invent any.

## Product Principles
1. The customer's phone flow must be finishable one-handed in under a minute.
2. The ticket code is the single thing a customer must not lose; make it unmissable.
3. Staff screens favor scan speed and correctness over decoration.
4. Speak plainly in both languages; the counter, not the app, is the human touch.

## Accessibility & Inclusion
Customers of all ages and reading levels; large tap targets, legible type, Filipino translation parity.
