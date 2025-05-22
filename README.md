# ABC Mortgage Voice Agent

An AI-driven outbound call agent for ABC Mortgage that pre-qualifies loan leads, transfers them to a loan officer, and schedules callbacks when necessary. Built on [Retell AI](https://www.retellai.com/) and integrated with [Cal.com](https://cal.com/) for real-time calendar booking.

---

## 🚀 Features

- **Automated Outbound Calls**  
  Calls a list of leads, confirms identity, and pre-qualifies on employment & income.

- **Warm Transfer + Fallback**  
  Attempts to transfer to a live loan officer; if no one answers, offers to schedule a callback.

- **Calendar Integration**  
  Fetches available 30-minute slots from Cal.com and books upon lead selection.

- **End-to-End Demo**  
  Batch script generates call invitations, local “join” page for live audio demo, captures call recordings & booking proofs.

---

## 📂 Repository Structure

```

.
├─ public/
│   └─ web-call.html           # Local join-page for live demos
├─ scripts/
│   ├─ e2e-run.ts              # Batch script: create calls & emit join JSON
│   └─ leads.json              # Sample leads dataset
├─ src/
│   ├─ index.ts                # Unified server: webhooks + calendar endpoints + static page
│   ├─ calendar.ts             # Cal.com service wrapper (getFirstFreeSlots, bookSlot)
│   └─ tz-util.ts               # Time-zone helper utilities
├─ tests/
│   └─ calendar.test.ts        # Jest unit tests for calendar.ts
├─ flow\.json                   # Exported Retell conversation flow
├─ README.md                   # This documentation
├─ package.json                # Scripts & dependencies
└─ .env.example                # Required environment variables template

````

> **Note:** The `e2e-artifacts/` folder (call invites, recordings URLs, booking proofs) is **git-ignored**.

---

## ⚙️ Quickstart

### 1. Prerequisites

- Node.js ≥ 18, npm  
- [ngrok](https://ngrok.com/) (for local webhook tunneling)  
- A [Retell AI](https://app.retellai.com) workspace + API key  
- A [Cal.com](https://cal.com) account + API key  

### 2. Clone & Install

```bash
git clone https://github.com/mygithubname/abc-mortgage-company.git
cd abc-mortgage-company
npm install
````

### 3. Configure Environment

Copy `.env.example` → `.env`, then fill in:

```ini
RETELL_API_KEY=sk_live_...
RETELL_AGENT_ID=ag_...
RETELL_WEBHOOK=https://<your-ngrok>.ngrok-free.app/retell/webhook

CALCOM_API_KEY=pk_test_...
```

### 4. Start the Server

```bash
npm run dev
```

Serves webhooks, calendar endpoints, and the demo page at `http://localhost:3000`.

### 5. Expose with ngrok

```bash
ngrok http 3000
```

Copy the HTTPS forwarding URL and update:

* `RETELL_WEBHOOK` in `.env`
* **Webhook URL** in Retell Agent settings
* Custom Function URLs in Retell for `/availability` and `/book`

Then **Publish** your Retell agent.

### 6. Run the Batch Script

```bash
npm run e2e
```

This will:

1. Create web calls for each lead in `scripts/leads.json`
2. Write `*-join.json` files into `e2e-artifacts/` containing `{ call_id, client_token }`
3. Poll each call until completion
4. Save recording URLs and verify Cal.com bookings

### 7. Live Demo

1. Open your browser:

   ```
   http://localhost:3000/web-call.html
   ```
2. Copy **call\_id** and **client\_token** from one of the `*-join.json` files.
3. Paste into the form and click **Join Call** to hear the agent run the full flow.

---

## ✅ Testing

* **Unit tests** (calendar.ts):

  ```bash
  npm test
  ```

* **Simulation tests** (Retell UI → Simulation tab):

  * Wrong Number
  * Happy Path (Transfer Success)
  * Lead Not Here → Schedule Callback
  * Disqualify (Unemployed)

---

## 🚧 Known Constraints & Future Improvements

1. **Phone-Number Limitation**
   Sandbox trial couldn’t provision a live DID—logic validated via simulator & local join page.

2. **Trial Quota Limits**
   Free voice & LLM minutes expired mid-demo; required workspace switch & manual LLM tests.

3. **Custom Function Import**
   Functions must be recreated manually—JSON export omits them.

4. **Dynamic URL Injection**
   Retell UI doesn’t accept templated URLs (`{{baseUrl}}`), so Function URLs must be updated on each ngrok restart.

5. **SDK Typings Lag**
   `createWebCall` returns `access_token`; TypeScript definitions lag behind, requiring `any` casts.

6. **Booking Verification Param**
   Cal.com v2 API requires `attendeeEmail` (not `email`), which early checks used incorrectly.

7. **Name Placeholder Mismatch**
   Metadata shape was updated to `metadata: { leadName }` so the agent no longer says “LeadName Bob Bravo.”

8. **Automated Join**
   Currently manual via `web-call.html`; future work could automate demo with Playwright.

9. **Stable Deployment**
   Deploy backend & demo page (e.g. Vercel/Render) for demos without ngrok reliance.

---

Thank you for reviewing this MVP! 

```
```
