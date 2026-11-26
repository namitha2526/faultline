# Faultline | Frontend Web Dashboard

Faultline is an AI-powered error intelligence platform inspired by Sentry and Linear that groups production errors by **semantic meaning** (vector embeddings) instead of brittle exact stack-trace hashes.

```
600 Raw Ingested Errors
  ├── Legacy Hash Grouping (Sentry)  ──> 231 Fragmented Issues (7.7% Recall, 2.6x Compression)
  └── Faultline Semantic Clustering ──> 8 Genuine Root Causes (100.0% F1, 75.0x Compression)
```

---

## Quickstart

Run the development server locally:

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

- **Zero Configuration**: Runs with full realistic mock data (`VITE_USE_MOCKS=true`) out of the box with 600 production errors across 8 clusters.
- **Production Build**: `npm run build` compiles clean TypeScript into `/dist`.

---

## Key Screens & Features

### 1. Overview Screen
- **Signature Hero Reduction Panel**: Displays the **231 vs 8** root-cause compression with an animated bar visualizer showing **96.5% noise reduction**.
- **KPI Cards**: Total errors, root causes, compression ratio, 24h error count with trend deltas.
- **Stacked Area Chart**: Hourly volume trends stacked by top clusters.
- **Needs Attention**: Real-time surfacing of spiking clusters with mini sparklines.

### 2. Clusters (Issues) Screen
- Dense, keyboard-friendly table with AI-generated titles, 24h trend sparklines, browser pills, and status badges.
- Instant search filter, browser/status filters, and multi-select bulk resolve.

### 3. Cluster Detail Screen
- **"Why These Are One Bug" AI Intelligence Card**: Plain-language root cause explanation, shared call-stack anchors, and cosine similarity gauge (e.g., 0.94).
- **Representative Stack Trace**: Line numbers, frame highlighting (app code vs dimmed `node_modules`), and 1-click clipboard copy.
- **Deep-Dive Tabs**:
  - **Stack Trace Variants**: Side-by-side split & unified diff comparing distinct call-stack pathways (e.g. WebSocket vs HTTP Auth in Redis partition).
  - **Cluster Members**: Dense occurrence log with user IDs, URLs, and similarity-to-centroid scores.
  - **Browsers & OS**: Client distribution graphs.
  - **Timeline**: 24-hour histogram.
- **Similar Clusters**: Nearest neighbor clusters in 384-D vector space.

### 4. Live Feed (The Demo Centerpiece)
- **Real-Time Error Stream**: Incoming errors stream into the buffer on the left.
- **Visual Snapping Animation**: Errors visibly snap into their semantic cluster cards on the right with an animated violet glow (`animate-snap`).
- **Stream Controls**: Play/Pause, speed multipliers (`1x`, `5x`, `20x`), and an `Inject Error` trigger.

### 5. Embedding Map
- Interactive 2D UMAP scatter plot of all 600 errors in vector space.
- Color-coded by cluster with rich hover tooltips, click-to-inspect, zoom/pan controls, and legend visibility toggles.
- **"Isolate Tricky Edge Cases"**: Proves that `RC-1` (User Login) and `RC-7` (Org Settings) are neatly separated into two distinct islands even though their error message text is identical (*"Cannot read properties of undefined (reading 'avatar_url')"*).

### 6. Evaluation Benchmarks
- Empirical benchmark matrix comparing **Hash Baseline (Sentry)** vs **Faultline DBSCAN (eps=0.22)** vs **HDBSCAN**.
- 100% Precision, 100% Recall, 100% F1 score, 1.000 ARI, and 75.0x compression ratio.
- Expandable deep-dive into edge cases (Superficial Similarity & Dispersed Manifestation).

### 7. Releases & Deploy Timeline
- Error frequency timeline chart with automated deployment reference markers (`v2.4.0`, `v2.4.1`, `v2.5.0-canary`).
- Canary deploy rollback and alert correlation.

### 8. Settings & SDK Setup
- Project Ingestion API Key with 1-click copy and secret mask toggle.
- Tabbed SDK install snippets for **JavaScript / TypeScript** and **Python**.
- DBSCAN `eps` distance threshold slider (`0.10` – `0.40`, default `0.22`) and Sentence Transformer model selector (`all-MiniLM-L6-v2`, `bge-small-en-v1.5`, `text-embedding-3-small`).

---

## Live Demo Mode Walkthrough

1. Click **Demo Mode** in the top navigation bar.
2. Select **Simulate Bad Deploy Spike**:
   - Release `v2.5.0-canary` will simulate a 48-error surge on the `Payment Gateway Timeout` cluster (`RC-2`).
   - A critical red/amber alert banner will appear at the top.
   - The Payment Gateway cluster card will flare with a pulsing flame spike indicator.
3. Switch to the **Live Feed** screen to watch errors actively stream in at high velocity and snap into clusters.
4. Click **Revert Spike** in the banner or demo dropdown to restore normal baseline traffic.

---

## Tech Stack
- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS (near-black `#0B0D12` palette, subtle borders `#1E222B`, electric violet `#8B5CF6`)
- **State & Data Layer**: TanStack Query (React Query)
- **Charts**: Recharts & Custom SVGs
- **Icons**: Lucide Icons
- **Typography**: Inter (UI) and JetBrains Mono (Code & tabular numbers)
