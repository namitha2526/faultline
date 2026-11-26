# Faultline 5-Minute Live Demo Walkthrough

This guide provides a step-by-step walkthrough to present Faultline in 5 minutes.

---

## Pre-Flight Check (1 Command to Launch Everything)

Start the entire environment:
```bash
# Terminal 1: Backend API + Database
docker compose up --build

# Terminal 2: Seed the 600 baseline errors & run batch clustering
python data/seed.py && python -m app.ml.evaluate

# Terminal 3: Launch Web Frontend
cd web && npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5-Minute Script & Timings

### 00:00 - 01:00 | The Problem & System Overview
- **Screen**: Click on **`Overview`** in the left sidebar.
- **Narrative**:
  - *"Traditional error monitoring tools like Sentry group errors by hashing raw stack frames. When line numbers drift across commits or asynchronous callers differ, Sentry shatters a single underlying bug into dozens of duplicates."*
  - Point to the **Comparison Panel**:
    - **600 raw errors** created **231 separate issues** in Sentry.
    - Faultline compressed them into the **8 true root causes** with a **75.0x compression ratio** ($96.5\%$ issue triage noise eliminated).

---

### 01:00 - 02:15 | Live Stream & The "Semantic Snap" (Centerpiece)
- **Screen**: Click on **`Live Feed`** in the sidebar.
- **Action**:
  - In the top navbar, click **`Start Replay`**.
  - Adjust playback speed to **2x** or **5x**.
- **What to Observe**:
  - Incoming runtime errors stream into the left column via WebSockets.
  - On the right, watch the 8 active semantic clusters light up with a glowing pulse (`animate-snap`) as each error is assigned to its root cause in **sub-40ms**.
  - Point out that even with different browsers (Chrome vs Safari) and different line numbers, errors instantly find their true semantic home without creating duplicate issues.

---

### 02:15 - 03:15 | The "Bad Deployment" Spike Simulation
- **Action**:
  - In the navbar stream controller, click the **`Bad Deploy Spike`** button.
- **What to Observe**:
  - The live feed suddenly floods with `PaymentGatewayTimeoutError` exceptions.
  - The **`Payment Gateway Timeout`** cluster card flashes red with a pulsing **`SPIKE ALERT`** badge.
  - Faultline immediately flags this anomaly without fragmenting the surging errors into new clusters.

---

### 03:15 - 04:15 | Cluster Deep Dive: Unifying Divergent Stacks
- **Screen**: Click on **`Clusters`** in the sidebar, then click on **`Distributed Redis session store network partition`**.
- **What to Observe**:
  - Show the **Semantic Root Cause Analysis** box:
    - *"Why these are the same bug: Traditional stack hashing fragmented these occurrences across 14 separate issue groups due to shifted line numbers and varying asynchronous dispatch chains."*
  - Look at the **Member Occurrences**:
    - Occurrence 1 came from a **WebSocket reconnection failure**.
    - Occurrence 2 came from an **Express REST Auth middleware**.
    - Occurrence 3 came from a **Celery queue worker job**.
    - Occurrence 4 came from a **GraphQL resolver directive**.
  - Sentry treated these as 14 unrelated bugs. Faultline calculated their 384-D vector cosine distance and assigned them **95%+ similarity scores**.

---

### 04:15 - 05:00 | 2D Embedding Map & Empirical Benchmark
1. **Screen**: Click on **`Embedding Map`**:
   - Hover over the 2D UMAP scatter points to show distinct color clusters.
   - Point out that similar bugs cluster together into dense manifolds, while noisy points are separated.
2. **Screen**: Click on **`Evaluation`**:
   - Review the empirical benchmark against ground truth:
     - **Sentry Hash**: $100\%$ Precision, but only **$7.7\%$ Recall** ($14.3\%$ F1).
     - **Faultline DBSCAN**: **$100\%$ Precision, $100\%$ Recall, $100\%$ F1** ($\text{ARI} = 1.000$).
   - Show **Tricky Case 1**: Login (`RC-1`) vs Org Settings (`RC-7`) share identical wording (`Cannot read properties of undefined reading avatar_url`), but Faultline achieved **0 overlap**.

---

## Wrap-up Takeaway
*"By embedding errors into high-dimensional semantic vector spaces with pgvector, Faultline cuts through stack-trace noise, restores true root-cause tracking, and keeps ingestion sub-50ms."*
