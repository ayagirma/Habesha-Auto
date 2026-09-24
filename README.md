# Torque & Co — Auto Shop Web App

A working front-end prototype for a mobile-first auto shop web app: VIN-based
accounts, multi-service booking, a live step-by-step service tracker,
new-issue approval before extra charges, four payment methods (card, Zelle,
Cash App, cash), a persistent database-backed account, and shop messaging.

## Files

- `torque-app.html` — the entire app. Single self-contained file: markup,
  styles, and vanilla JavaScript, no build step and no external dependencies
  besides a Google Fonts stylesheet link.

## Running it

**As published on claude.ai** (recommended): the app calls two runtime
capabilities that only exist inside a Claude-published Artifact page —
`db` (a real persistent, per-account database) and `user` (who's viewing).
Opened there, sign-up data, appointments, history, and messages are saved
for real and survive a reload.

**Opened as a plain local file** (double-click, or any static web server):
the app still works end-to-end — booking, the live tracker, the new-issue
approval flow, payments — but falls back to in-memory state only. Nothing
persists across a page reload, and the Account screen's badge will read
"Saved on this device only" instead of "Synced to your account," because
`window.claude` (the capability bridge) doesn't exist outside that host.
This is expected, not a bug.

## What this is / isn't

This is a **front-end prototype**, not a production backend:

- No real authentication — an "account" is just a profile record.
- No real payment processing — card/Zelle/Cash App/cash are all simulated;
  no money moves and no PCI-scope code is involved.
- The database, when it's available, is a real shared document store
  (Claude's Artifact `db` capability) scoped privately per signed-in viewer
  — genuine persistence, but not a server you control, and not something
  a shop's own staff dashboard could plug into as-is.
- Messaging is a real stored thread, but shop replies are canned
  auto-responses, not a live person on the other end.

A real production build would replace the `db`/`user` capability calls
with your own backend (auth, a real database, a payment processor like
Stripe, and a staff-facing app), while keeping the same UI and flows.

## Structure inside `torque-app.html`

- `SERVICES` / `SERVICE_STEPS` — the service catalog and each service's
  step-by-step work list, grouped by category for the booking screen.
- `state` — all in-memory app state (account, vehicle, booking, active
  appointment, history, messages).
- `cloud.*` functions — the persistence layer: reads/writes to the `db`
  capability when available, no-ops otherwise, so the rest of the app
  doesn't need to know which mode it's in.
- Screen render functions (`renderDashboard`, `renderBook`,
  `renderProgress`, `renderEstimate`, `renderPayment`, `renderMessages`,
  `renderAccount`) and the `go(screenName)` router at the top of the
  script.
