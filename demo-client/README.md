# ShopDemo — Faultline Error Intelligence Demo Client

A production-grade mock e-commerce storefront instrumented with the **Faultline SDK**. This application plays the role of a customer's website equipped with Faultline, showcasing how Faultline clusters production errors by **meaning** (dense semantic vector embeddings via PostgreSQL pgvector) rather than brittle, fragmented exact stack-trace hashes.

```
ShopDemo (Client Storefront)
   │
   ├── Emits 16 Disjoint Call Paths across 6 Known Bugs
   └── Faultline Standalone SDK (Batch flush, Retry Backoff, PII Scrubber)
         │
         ▼ POST /api/errors (with X-API-Key)
Faultline Backend Gateway (FastAPI + pgvector)
   ├── Sentry Legacy Hash Grouping  ──> 16 Fragmented Groups
   └── Faultline Semantic Vectors   ──> 6 Clean Root-Cause Clusters
```

---

## Quickstart

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `VITE_FAULTLINE_URL` and `VITE_FAULTLINE_KEY` match your running Faultline backend:
```env
VITE_FAULTLINE_URL=http://localhost:8000
VITE_FAULTLINE_KEY=fl_demo_key_9f8e7d6c5b4a
VITE_APP_RELEASE=1.4.1
VITE_APP_ENV=production
```

> **Note:** Even if the Faultline backend is offline or unreachable, ShopDemo runs completely smoothly and never crashes; the SDK safely batches, retries, and logs failures in the demo control panel.

### 2. Install & Run
```bash
npm install
npm run dev
```
Open **`http://localhost:5174`** in your browser.

---

## 3-Minute Live Demo Script

Follow this step-by-step walkthrough to demonstrate Faultline's semantic clustering in action:

1. **Open ShopDemo (`http://localhost:5174`)**:
   - Notice the modern UK storefront with 12 studio products and British customer personas (**Oliver Hughes**, **Charlotte Reed**, **Harry Bennett**).
   - In the bottom-right corner, notice the floating **Demo Panel** bug badge.

2. **Trigger One Root Cause Via Two Disjoint Paths**:
   - Open the **Demo Panel** (click the bug icon bottom-right).
   - Go to the **Bugs** tab.
   - Under **1. Null User**:
     - Click **"Trigger via Login"**: Fires `handleAuthCallback() -> fetchUserProfile() -> formatUserProfile()` which fails on `user.name`.
     - Click **"Trigger via Profile"**: Fires `renderProfileHeader() -> getUserDisplayName() -> buildUserGreeting()` which also fails on `user.name`.
   - Inspect the **SDK Log** tab: observe two events queued and sent with completely disjoint call stacks and different functions.

3. **Verify Clustering in Faultline Dashboard (`http://localhost:5173`)**:
   - Switch to the Faultline dashboard.
   - Look at the **Legacy Hash Issues** vs **Faultline Clusters**:
     - *Legacy Sentry Hash:* Creates 2 separate issues because the stack frames differ entirely.
     - *Faultline Semantic Intelligence:* Unifies both events into **1 single root-cause cluster** (`Null User on Authentication Callback`).

4. **Simulate a Bad Deployment Incident**:
   - Return to ShopDemo. In the Demo Panel, switch to the **Spike & Burst** tab.
   - Click **"Bad Deployment (1.4.3)"**:
     - The SDK dynamically increments the release tag to `v1.4.3`.
     - It simulates a release regression by pulsing 20 payment timeout errors over 15 seconds.
   - Look at the Faultline Live Feed or Overview: observe the **Payment Gateway Timeout** cluster immediately flare up with an active **Spike Badge** and real-time velocity alert!

---

## Deliberate Bugs & Natural Call Stacks

ShopDemo implements 6 real root causes. Each is built from **genuine nested function calls** (3 to 6 frames deep) rather than mocked strings, producing realistic stack traces:

| # | Root Cause Bug | Paths Implemented | Why Exact Hash Fails |
|---|---|---|---|
| **1** | **Null User**<br>`Cannot read properties of null (reading 'name')` | 1. `Login -> getProfile`<br>2. `Profile Page Render`<br>3. `Checkout Greeting Header` | 3 completely different routes and function names (`formatUserProfile`, `buildUserGreeting`, `formatCustomerSalutation`). Hashes generate 3 separate issues. |
| **2** | **Payment Timeout**<br>`Payment gateway confirmation timed out after 30000ms` | 1. `Card Payment (Stripe)`<br>2. `UPI Transfer (VPA Resolution)`<br>3. `Digital Wallet (Apple Pay)` | Gateway names, transaction formats, and async wrappers differ, but all represent upstream payment network timeouts. |
| **3** | **Missing Field**<br>`Cannot read properties of undefined (reading 'price')` | 1. `Product Card Variant`<br>2. `Cart Total Calculation`<br>3. `Order Summary Invoice` | Variant structures vs cart line item arrays vs invoice lines. Embeddings understand the semantic missing price invariant. |
| **4** | **Failed JSON Parse**<br>`SyntaxError: Unexpected token in JSON` | 1. `Products Catalog (502 HTML)`<br>2. `Loading Cart (Truncated JSON)`<br>3. `Historical Orders ('undefined')` | API gateway error responses vs corrupted local storage vs empty payloads. Exact hashes fragment them; Faultline groups them. |
| **5** | **Stock Mismatch**<br>`InventoryError: Item out of stock` | 1. `Add to Cart Check`<br>2. `Quantity Stepper Revalidation`<br>3. `Checkout Order Commitment` | Raised from different inventory check depths (`assertWarehouseAllocation`, `checkBinCapacity`, `verifyFinalStockAvailability`). |
| **6** | **Third-Party Failure**<br>`ServiceUnavailableError: Coupon service unreachable` | 1. `Apply Coupon RPC`<br>2. `Remove Coupon Gateway` | Network socket errors (`ECONNREFUSED` vs `ETIMEDOUT`) hitting the same internal promotions microservice. |

---

## Faultline SDK Architecture (`/src/faultline`)

The standalone SDK inside `src/faultline` is designed for resilience:

- **Non-blocking & Zero Crash Guarantee:** Every call is guarded by `try/catch`. Even if network requests fail or the browser environment is restricted, the customer shop never crashes.
- **Batching & Auto-Flush:** Batches events in memory and flushes every **3 seconds**.
- **Page Unload Protection:** Flushes immediately on `beforeunload` and `pagehide` using `navigator.sendBeacon` (with `fetch` `keepalive` fallback).
- **Exponential Backoff:** Retries failed network calls up to 3 times ($2^n$ seconds) before silently dropping.
- **Rate Limiting & Deduplication:** Maximum 30 events per minute rolling window; drops duplicate error messages occurring within 10 seconds.
- **PII & Secret Scrubbing:** Automatically redacts credit cards (`[REDACTED_CREDIT_CARD]`), emails (`[REDACTED_EMAIL]`), and tokens/keys (`[REDACTED_TOKEN]`).
- **User Privacy:** Hashes user identifiers using SHA-256 (`crypto.subtle`) before sending.
- **React `<FaultlineErrorBoundary>`:** React 18 component boundary capturing render crashes.

---

## Demo Control Panel Features

Click the floating bug icon in the bottom-right corner of any page:

1. **Bugs Tab:** One-click triggers for all 16 call paths across all 6 bugs.
2. **Spike & Burst Tab:**
   - **Trigger Random:** Spawns a random error across the 16 paths.
   - **Traffic Burst:** Fires 50 errors across multiple bugs over 10 seconds with a real-time progress bar.
   - **Bad Deployment:** Switches release to `1.4.3` and surges payment timeout errors to demonstrate incident detection.
3. **SDK Log Tab:** Live inspect every event payload, status (`queued`, `sent`, `failed`, `dropped`), retries, and copy raw JSON.
4. **Config Tab:** Dynamically switch release (`1.4.1`, `1.4.2`, `1.4.3`) or simulate browser/OS metadata (Chrome/Windows, Safari/iOS, Firefox/Linux, Edge/Windows).

